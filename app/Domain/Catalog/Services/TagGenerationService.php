<?php

namespace App\Domain\Catalog\Services;

use App\Models\Product;
use App\Models\Tag;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class TagGenerationService
{
    protected TagService $tagService;

    public function __construct(TagService $tagService)
    {
        $this->tagService = $tagService;
    }

    /**
     * Generate tags for a product based on its attributes.
     */
    public function generateTags(Product $product): Collection
    {
        $generatedTags = collect();

        // Generate from category
        $categoryTags = $this->generateFromCategories($product);
        $generatedTags = $generatedTags->merge($categoryTags);

        // Generate from product attributes
        $attributeTags = $this->generateFromAttributes($product);
        $generatedTags = $generatedTags->merge($attributeTags);

        // Generate from product name/title
        $titleTags = $this->generateFromTitle($product);
        $generatedTags = $generatedTags->merge($titleTags);

        // Generate from brand
        if ($product->brand) {
            $generatedTags->push([
                'name' => $product->brand,
                'confidence' => 0.95,
            ]);
        }

        // Generate from product type
        if ($product->product_type) {
            $generatedTags->push([
                'name' => $product->product_type,
                'confidence' => 0.9,
            ]);
        }

        return $generatedTags->unique('name');
    }

    /**
     * Generate and apply tags to a product.
     */
    public function applyGeneratedTags(Product $product, bool $replaceExisting = false): void
    {
        $tags = $this->generateTags($product);

        if ($tags->isEmpty()) {
            return;
        }

        $tagData = $tags->map(fn ($t) => [
            'name' => $t['name'],
            'source' => 'generated',
            'confidence' => $t['confidence'],
        ])->toArray();

        if ($replaceExisting) {
            // Remove old generated tags first
            $product->productTags()
                ->wherePivot('source', 'generated')
                ->detach();
        }

        $this->tagService->addProductTags(
            $product,
            array_column($tagData, 'name'),
            'generated',
            0.8
        );
    }

    /**
     * Generate tags from product categories.
     */
    protected function generateFromCategories(Product $product): Collection
    {
        $tags = collect();

        foreach ($product->categories as $category) {
            $tags->push([
                'name' => $category->name,
                'confidence' => 0.9,
            ]);

            // Add parent categories too
            $parent = $category->parent;
            while ($parent) {
                $tags->push([
                    'name' => $parent->name,
                    'confidence' => 0.7,
                ]);
                $parent = $parent->parent;
            }
        }

        return $tags;
    }

    /**
     * Generate tags from product attributes.
     */
    protected function generateFromAttributes(Product $product): Collection
    {
        $tags = collect();

        // From options/variants
        foreach ($product->options as $option) {
            foreach ($option->values as $value) {
                $tags->push([
                    'name' => $value->value,
                    'confidence' => 0.85,
                ]);
            }
        }

        // From dimensions (size categorization)
        if ($product->variants->isNotEmpty()) {
            $variant = $product->variants->first();
            $sizeTags = $this->generateSizeTags($variant);
            $tags = $tags->merge($sizeTags);
        }

        return $tags;
    }

    /**
     * Generate size-related tags from variant dimensions.
     */
    protected function generateSizeTags($variant): Collection
    {
        $tags = collect();

        if ($variant->weight_grams) {
            if ($variant->weight_grams < 100) {
                $tags->push(['name' => 'Lightweight', 'confidence' => 0.7]);
            } elseif ($variant->weight_grams > 5000) {
                $tags->push(['name' => 'Heavy', 'confidence' => 0.7]);
            }
        }

        return $tags;
    }

    /**
     * Generate tags from product title using keyword extraction.
     */
    protected function generateFromTitle(Product $product): Collection
    {
        $tags = collect();
        $name = $product->name;

        // Common product keywords to look for
        $keywords = [
            'organic' => 0.9,
            'natural' => 0.85,
            'premium' => 0.8,
            'luxury' => 0.8,
            'handmade' => 0.9,
            'vintage' => 0.85,
            'modern' => 0.8,
            'classic' => 0.8,
            'eco-friendly' => 0.9,
            'sustainable' => 0.9,
            'vegan' => 0.9,
            'wireless' => 0.85,
            'portable' => 0.8,
            'professional' => 0.75,
            'waterproof' => 0.85,
            'rechargeable' => 0.8,
        ];

        $lowercaseName = Str::lower($name);

        foreach ($keywords as $keyword => $confidence) {
            if (Str::contains($lowercaseName, $keyword)) {
                $tags->push([
                    'name' => Str::title($keyword),
                    'confidence' => $confidence,
                ]);
            }
        }

        return $tags;
    }

    /**
     * Batch generate tags for multiple products.
     */
    public function batchGenerateTags(array $productIds, bool $replaceExisting = false): int
    {
        $count = 0;

        foreach ($productIds as $productId) {
            $product = Product::with(['categories.parent', 'options.values', 'variants'])->find($productId);

            if ($product) {
                $this->applyGeneratedTags($product, $replaceExisting);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Suggest tags based on similar products.
     */
    public function suggestTagsFromSimilarProducts(Product $product, int $limit = 10): Collection
    {
        // Find products in same categories
        $categoryIds = $product->categories->pluck('id');

        if ($categoryIds->isEmpty()) {
            return collect();
        }

        // Get tags from similar products
        $tags = Tag::whereHas('products', function ($q) use ($categoryIds, $product) {
            $q->whereHas('categories', fn ($cq) => $cq->whereIn('categories.id', $categoryIds))
                ->where('id', '!=', $product->id);
        })
            ->withCount(['products' => function ($q) use ($categoryIds) {
                $q->whereHas('categories', fn ($cq) => $cq->whereIn('categories.id', $categoryIds));
            }])
            ->orderByDesc('products_count')
            ->limit($limit)
            ->get();

        return $tags->map(fn ($tag) => [
            'id' => $tag->id,
            'name' => $tag->name,
            'confidence' => min(0.5 + ($tag->products_count / 100), 0.9),
        ]);
    }
}
