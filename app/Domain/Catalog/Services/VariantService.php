<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\ProductOption;
use App\Domain\Catalog\Models\ProductOptionValue;
use App\Domain\Catalog\Models\ProductVariant;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VariantService
{
    /**
     * Create or update product options and values.
     */
    public function syncOptions(Product $product, array $options): void
    {
        DB::transaction(function () use ($product, $options) {
            $existingOptionIds = [];
            $existingValueIds = [];

            foreach ($options as $index => $optionData) {
                $option = $this->upsertOption($product, $optionData, $index);
                $existingOptionIds[] = $option->id;

                foreach ($optionData['values'] ?? [] as $valueIndex => $valueData) {
                    $value = $this->upsertOptionValue($option, $valueData, $valueIndex);
                    $existingValueIds[] = $value->id;
                }

                // Delete removed values
                ProductOptionValue::where('product_option_id', $option->id)
                    ->whereNotIn('id', $existingValueIds)
                    ->delete();
            }

            // Delete removed options
            ProductOption::where('product_id', $product->id)
                ->whereNotIn('id', $existingOptionIds)
                ->delete();
        });
    }

    /**
     * Upsert a product option.
     */
    protected function upsertOption(Product $product, array $data, int $position): ProductOption
    {
        $attributes = [
            'product_id' => $product->id,
            'name' => $data['name'],
        ];

        return ProductOption::updateOrCreate(
            isset($data['id']) ? ['id' => $data['id']] : $attributes,
            array_merge($attributes, ['position' => $position])
        );
    }

    /**
     * Upsert an option value.
     */
    protected function upsertOptionValue(ProductOption $option, array $data, int $position): ProductOptionValue
    {
        $value = is_array($data) ? ($data['value'] ?? $data['name'] ?? '') : $data;
        $meta = is_array($data) ? ($data['meta'] ?? null) : null;

        $attributes = [
            'product_option_id' => $option->id,
            'value' => $value,
        ];

        return ProductOptionValue::updateOrCreate(
            isset($data['id']) ? ['id' => $data['id']] : $attributes,
            array_merge($attributes, [
                'position' => $position,
                'meta_json' => $meta,
            ])
        );
    }

    /**
     * Generate all variant combinations from options.
     */
    public function generateCombinations(Product $product): array
    {
        $options = $product->options()->with('values')->ordered()->get();

        if ($options->isEmpty()) {
            return [];
        }

        $valueGroups = $options->map(fn ($option) => $option->values->pluck('id')->toArray())->toArray();

        return $this->cartesianProduct($valueGroups);
    }

    /**
     * Calculate cartesian product of option values.
     */
    protected function cartesianProduct(array $arrays): array
    {
        if (empty($arrays)) {
            return [[]];
        }

        $result = [[]];

        foreach ($arrays as $array) {
            $append = [];
            foreach ($result as $product) {
                foreach ($array as $item) {
                    $append[] = array_merge($product, [$item]);
                }
            }
            $result = $append;
        }

        return $result;
    }

    /**
     * Create variants from generated combinations.
     */
    public function createVariantsFromCombinations(Product $product, array $baseData = []): array
    {
        $combinations = $this->generateCombinations($product);
        $variants = [];

        if (empty($combinations) || (count($combinations) === 1 && empty($combinations[0]))) {
            // No options, create single default variant
            $variants[] = $this->ensureDefaultVariant($product, $baseData);
            return $variants;
        }

        DB::transaction(function () use ($product, $combinations, $baseData, &$variants) {
            $isFirst = true;

            foreach ($combinations as $index => $valueIds) {
                $variant = $this->createVariantFromValueIds($product, $valueIds, array_merge($baseData, [
                    'sort_order' => $index,
                    'is_default' => $isFirst,
                ]));
                $variants[] = $variant;
                $isFirst = false;
            }
        });

        return $variants;
    }

    /**
     * Create a variant from option value IDs.
     */
    protected function createVariantFromValueIds(Product $product, array $valueIds, array $data = []): ProductVariant
    {
        $values = ProductOptionValue::with('option')->whereIn('id', $valueIds)->get();
        $name = $values->pluck('value')->join(' / ');

        // Generate SKU from product SKU and option values
        $skuParts = [$product->sku ?? Str::upper(Str::random(6))];
        foreach ($values as $value) {
            $skuParts[] = Str::upper(Str::substr(Str::slug($value->value, ''), 0, 3));
        }
        $sku = implode('-', $skuParts);

        $variantData = array_merge([
            'product_id' => $product->id,
            'name' => $name,
            'sku' => $sku,
            'price' => $product->price ?? 0,
            'compare_at_price' => $product->compare_at_price,
            'cost' => $product->cost,
            'inventory_quantity' => 0,
            'inventory_policy' => 'deny',
            'track_inventory' => true,
            'requires_shipping' => !$product->is_digital,
            'is_active' => true,
        ], $data);

        $variant = ProductVariant::create($variantData);

        // Attach option values
        $variant->optionValues()->sync($valueIds);

        return $variant;
    }

    /**
     * Ensure a default variant exists for a product.
     */
    public function ensureDefaultVariant(Product $product, array $data = []): ProductVariant
    {
        $defaultVariant = $product->variants()->where('is_default', true)->first();

        if ($defaultVariant) {
            return $defaultVariant;
        }

        $variantData = array_merge([
            'product_id' => $product->id,
            'name' => 'Default',
            'sku' => $product->sku ?? Str::upper(Str::random(8)),
            'price' => $product->price ?? 0,
            'compare_at_price' => $product->compare_at_price,
            'cost' => $product->cost,
            'inventory_quantity' => $data['inventory_quantity'] ?? 0,
            'inventory_policy' => $data['inventory_policy'] ?? 'deny',
            'track_inventory' => $data['track_inventory'] ?? true,
            'requires_shipping' => $data['requires_shipping'] ?? !$product->is_digital,
            'weight_grams' => $data['weight_grams'] ?? null,
            'is_default' => true,
            'is_active' => true,
            'sort_order' => 0,
        ], $data);

        return ProductVariant::create($variantData);
    }

    /**
     * Update a variant.
     */
    public function updateVariant(ProductVariant $variant, array $data): ProductVariant
    {
        $variant->update($data);

        if (isset($data['option_value_ids'])) {
            $variant->optionValues()->sync($data['option_value_ids']);
        }

        return $variant->fresh(['optionValues']);
    }

    /**
     * Bulk update variants.
     */
    public function bulkUpdateVariants(Product $product, array $variantsData): array
    {
        $updatedVariants = [];

        DB::transaction(function () use ($product, $variantsData, &$updatedVariants) {
            foreach ($variantsData as $data) {
                if (isset($data['id'])) {
                    $variant = ProductVariant::where('id', $data['id'])
                        ->where('product_id', $product->id)
                        ->first();

                    if ($variant) {
                        $updatedVariants[] = $this->updateVariant($variant, $data);
                    }
                }
            }
        });

        return $updatedVariants;
    }

    /**
     * Delete a variant.
     */
    public function deleteVariant(ProductVariant $variant): bool
    {
        $product = $variant->product;
        $wasDefault = $variant->is_default;

        $variant->optionValues()->detach();
        $variant->media()->detach();
        $variant->delete();

        // If deleted variant was default, set another as default
        if ($wasDefault) {
            $nextVariant = $product->variants()->orderBy('sort_order')->first();
            if ($nextVariant) {
                $nextVariant->update(['is_default' => true]);
            }
        }

        return true;
    }

    /**
     * Set a variant as default.
     */
    public function setDefault(ProductVariant $variant): ProductVariant
    {
        DB::transaction(function () use ($variant) {
            // Remove default from all other variants
            ProductVariant::where('product_id', $variant->product_id)
                ->where('id', '!=', $variant->id)
                ->update(['is_default' => false]);

            $variant->update(['is_default' => true]);
        });

        return $variant->fresh();
    }

    /**
     * Reorder variants.
     */
    public function reorder(Product $product, array $variantIds): void
    {
        DB::transaction(function () use ($product, $variantIds) {
            foreach ($variantIds as $index => $id) {
                ProductVariant::where('id', $id)
                    ->where('product_id', $product->id)
                    ->update(['sort_order' => $index]);
            }
        });
    }

    /**
     * Get variant by option values.
     */
    public function findVariantByOptionValues(Product $product, array $valueIds): ?ProductVariant
    {
        sort($valueIds);

        foreach ($product->variants as $variant) {
            $variantValueIds = $variant->optionValues->pluck('id')->sort()->values()->toArray();
            if ($variantValueIds === $valueIds) {
                return $variant;
            }
        }

        return null;
    }

    /**
     * Calculate total inventory across all variants.
     */
    public function getTotalInventory(Product $product): int
    {
        return $product->variants()
            ->where('track_inventory', true)
            ->sum('inventory_quantity');
    }

    /**
     * Check if any variant is in stock.
     */
    public function hasInventory(Product $product): bool
    {
        return $product->variants()
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where('inventory_quantity', '>', 0)
                    ->orWhere('inventory_policy', 'continue')
                    ->orWhere('track_inventory', false);
            })
            ->exists();
    }
}
