<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\ProductMedia;
use App\Domain\Catalog\Models\ProductOption;
use App\Domain\Catalog\Models\ProductOptionValue;
use App\Domain\Catalog\Models\ProductVariant;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * Get products with filtering and pagination.
     */
    public function getProducts(array $filters = [], ?int $sellerId = null, int $perPage = 20)
    {
        $query = $this->filteredQuery($filters, $sellerId)
            // Primary first, but not primary only: a product whose images were
            // uploaded without one being flagged still has a thumbnail to show.
            ->with(['category', 'categories', 'seller', 'media' => fn ($q) => $q
                ->where('type', 'image')
                ->orderByDesc('is_primary')
                ->orderBy('sort')]);

        // Sorting
        $sortField = $filters['sort'] ?? 'created_at';
        $sortDir = $filters['dir'] ?? 'desc';
        $query->orderBy($sortField, $sortDir);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Ids of every product the given filters match, ignoring pagination.
     *
     * Backs "select all N" in the admin list. It shares filteredQuery() with
     * getProducts() on purpose: a select-all that matched a different set from
     * the one on screen would quietly apply bulk actions to the wrong products.
     *
     * @return array<int, int>
     */
    public function matchingIds(array $filters = [], ?int $sellerId = null): array
    {
        return $this->filteredQuery($filters, $sellerId)
            ->orderBy('id')
            ->pluck('id')
            ->all();
    }

    /**
     * The admin list's filters as a query, with no eager loading or ordering.
     */
    protected function filteredQuery(array $filters = [], ?int $sellerId = null)
    {
        $query = Product::query()
            ->when($sellerId, fn ($q) => $q->forSeller($sellerId));

        // Status filter
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('meta_title', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        // Category filter
        if (!empty($filters['category_id'])) {
            $query->whereHas('categories', fn ($q) => $q->where('categories.id', $filters['category_id']));
        }

        // Vendor filter (admin only)
        if (!empty($filters['vendor_id']) && !$sellerId) {
            $query->where('seller_id', $filters['vendor_id']);
        }

        return $query;
    }

    /**
     * Get a single product with all relations for editing.
     */
    public function getProductForEdit(int $id, ?int $sellerId = null): ?Product
    {
        return Product::with([
            'category',
            'categories',
            'seller',
            'media',
            'options.values',
            'variants.optionValues',
            'variants.media',
            'productTags',
            'digitalFiles',
        ])
            ->when($sellerId, fn ($q) => $q->forSeller($sellerId))
            ->find($id);
    }

    /**
     * Create a new product.
     */
    public function createProduct(array $data, User $user): Product
    {
        return DB::transaction(function () use ($data, $user) {
            // Generate unique slug
            $data['slug'] = $this->generateUniqueSlug($data['name'], $data['slug'] ?? null);
            $data['created_by'] = $user->id;
            $data['updated_by'] = $user->id;

            // Set seller if user is a seller
            if ($user->hasRole('seller') && !isset($data['seller_id'])) {
                $data['seller_id'] = $user->id;
            }

            // Create product
            $product = Product::create($data);

            // Sync categories
            if (!empty($data['category_ids'])) {
                $product->categories()->sync($data['category_ids']);
            }

            // Sync tags
            if (!empty($data['tags'])) {
                $product->syncProductTags($data['tags']);
            }

            // Create default variant if no options
            if (empty($data['options'])) {
                $this->createDefaultVariant($product, $data);
            }

            $this->flushProductCache($product);

            return $product->fresh(['categories', 'variants', 'media']);
        });
    }

    /**
     * Update an existing product.
     */
    public function updateProduct(Product $product, array $data, User $user): Product
    {
        return DB::transaction(function () use ($product, $data, $user) {
            // Handle slug change
            if (!empty($data['slug']) && $data['slug'] !== $product->slug) {
                $data['slug'] = $this->generateUniqueSlug($data['name'] ?? $product->name, $data['slug'], $product->id);
            }

            $data['updated_by'] = $user->id;

            // Update product
            $product->update($data);

            // Sync categories
            if (isset($data['category_ids'])) {
                $product->categories()->sync($data['category_ids']);
            }

            // Sync tags
            if (isset($data['tags'])) {
                $product->syncProductTags($data['tags']);
            }

            $this->flushProductCache($product);

            return $product->fresh(['categories', 'variants', 'media', 'options.values']);
        });
    }

    /**
     * Delete a product.
     */
    public function deleteProduct(Product $product): bool
    {
        return DB::transaction(function () use ($product) {
            $this->flushProductCache($product);
            return $product->delete();
        });
    }

    /**
     * Duplicate a product.
     */
    public function duplicateProduct(Product $product, User $user): Product
    {
        return DB::transaction(function () use ($product, $user) {
            $newProduct = $product->replicate(['slug', 'sku', 'created_at', 'updated_at']);
            $newProduct->name = $product->name . ' (Copy)';
            $newProduct->slug = $this->generateUniqueSlug($newProduct->name);
            // products.sku is UNIQUE. Replicating it verbatim meant the insert
            // broke the constraint for any product that has one — which is the
            // whole catalogue — so Duplicate 500'd instead of copying anything.
            $newProduct->sku = $this->generateUniqueSku($product->sku, Product::class);
            $newProduct->status = Product::STATUS_DRAFT;
            $newProduct->published_at = null;
            $newProduct->created_by = $user->id;
            $newProduct->updated_by = $user->id;
            $newProduct->save();

            // Copy categories
            $newProduct->categories()->sync($product->categories->pluck('id'));

            // Copy tags
            $tagData = [];
            foreach ($product->productTags as $tag) {
                $tagData[$tag->id] = [
                    'source' => $tag->pivot->source,
                    'confidence' => $tag->pivot->confidence,
                ];
            }
            $newProduct->productTags()->sync($tagData);

            // Copy options and values
            foreach ($product->options as $option) {
                $newOption = $newProduct->options()->create([
                    'name' => $option->name,
                    'position' => $option->position,
                ]);
                foreach ($option->values as $value) {
                    $newOption->values()->create([
                        'value' => $value->value,
                        'position' => $value->position,
                        'meta_json' => $value->meta_json,
                    ]);
                }
            }

            // Copy variants. product_variants.sku is UNIQUE too, with the same
            // consequence as above for any product that reached this far.
            foreach ($product->variants as $variant) {
                $newProduct->variants()->create(
                    collect($variant->toArray())
                        ->except(['id', 'product_id', 'created_at', 'updated_at'])
                        ->put('sku', $this->generateUniqueSku($variant->sku, ProductVariant::class))
                        ->toArray()
                );
            }

            // Copy media. The new rows must not point at the original's files:
            // MediaService::deleteMedia() removes the file from disk, so a
            // shared path would mean deleting the copy's image also blanked the
            // product it was copied from. Each local file is duplicated into the
            // new product's own directory; remote urls are referenced as-is.
            foreach ($product->media as $media) {
                $newProduct->media()->create(
                    collect($media->toArray())
                        ->except(['id', 'product_id', 'created_at', 'updated_at', 'url', 'poster_url'])
                        ->put('path', $this->copyMediaFile($media->path, $newProduct->id, $media->type))
                        ->put('poster_path', $this->copyMediaFile($media->poster_path, $newProduct->id, $media->type))
                        ->toArray()
                );
            }

            return $newProduct->fresh(['categories', 'variants', 'options.values', 'media']);
        });
    }

    /**
     * A SKU that is free to use, derived from the one being copied.
     *
     * Both products.sku and product_variants.sku are UNIQUE and nullable.
     * Null stays null — a blank SKU is a legitimate state and NULLs do not
     * collide — anything else gains a -COPY suffix, numbered if that is taken.
     *
     * Any -COPY suffix already on the source is stripped before numbering, so
     * duplicating a duplicate gives NTD2004-COPY-2 rather than a SKU that
     * grows -COPY-COPY-COPY the further it gets from the original.
     *
     * @param  class-string<\Illuminate\Database\Eloquent\Model>  $model
     */
    protected function generateUniqueSku(?string $sku, string $model): ?string
    {
        if (! $sku) {
            return null;
        }

        $base = preg_replace('/-COPY(-\d+)?$/i', '', $sku) . '-COPY';
        $candidate = $base;
        $counter = 1;

        while ($model::where('sku', $candidate)->exists()) {
            $counter++;
            $candidate = $base . '-' . $counter;
        }

        return $candidate;
    }

    /**
     * Duplicate one stored media file for a copied product.
     *
     * Remote urls (imported from Shopify and S3) have no local file to copy,
     * and a row whose file is already missing — older imports left plenty —
     * is carried over unchanged rather than silently dropped.
     */
    protected function copyMediaFile(?string $path, int $productId, string $type): ?string
    {
        if (! $path || Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            return $path;
        }

        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $copy = "products/{$productId}/{$type}s/" . Str::uuid() . ($extension ? '.' . $extension : '');

        $disk->copy($path, $copy);

        return $copy;
    }

    /**
     * Update product status (publish, schedule, archive).
     */
    public function updateStatus(Product $product, string $status, ?string $publishAt = null): Product
    {
        $data = ['status' => $status];

        if ($status === Product::STATUS_SCHEDULED && $publishAt) {
            $data['published_at'] = $publishAt;
        } elseif ($status === Product::STATUS_PUBLISHED) {
            $data['published_at'] = now();
        }

        $product->update($data);
        $this->flushProductCache($product);

        return $product;
    }

    /**
     * Generate a unique slug.
     */
    public function generateUniqueSlug(string $name, ?string $slug = null, ?int $excludeId = null): string
    {
        $baseSlug = $slug ? Str::slug($slug) : Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while ($this->slugExists($slug, $excludeId)) {
            $counter++;
            $slug = $baseSlug . '-' . $counter;
        }

        return $slug;
    }

    /**
     * Check if slug exists.
     */
    protected function slugExists(string $slug, ?int $excludeId = null): bool
    {
        return Product::where('slug', $slug)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();
    }

    /**
     * Create a default variant for products without options.
     */
    protected function createDefaultVariant(Product $product, array $data): ProductVariant
    {
        return $product->variants()->create([
            'name' => 'Default',
            'sku' => $data['sku'] ?? null,
            'price' => $data['price'] ?? 0,
            'compare_at_price' => $data['compare_at_price'] ?? null,
            'cost' => $data['cost'] ?? null,
            'inventory_quantity' => $data['inventory_quantity'] ?? 0,
            'inventory_policy' => $data['inventory_policy'] ?? 'deny',
            'track_inventory' => $data['track_inventory'] ?? true,
            'requires_shipping' => $data['requires_shipping'] ?? true,
            'weight_grams' => $data['weight_grams'] ?? null,
            'is_default' => true,
            'is_active' => true,
        ]);
    }

    /**
     * Flush product cache.
     */
    protected function flushProductCache(Product $product): void
    {
        Cache::forget("product.{$product->slug}");
        Cache::forget('home.new_arrivals.all');
        Cache::forget('home.discounts');
    }
}
