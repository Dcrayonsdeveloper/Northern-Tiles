<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\Collection;
use App\Domain\Catalog\Models\CollectionProduct;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CollectionIndexService
{
    public function __construct(
        protected CollectionRuleEngine $ruleEngine
    ) {}

    /**
     * Reindex a single collection.
     */
    public function reindexCollection(Collection $collection): int
    {
        if ($collection->isManual()) {
            Log::info("Collection {$collection->id} is manual, skipping reindex");
            return 0;
        }

        $rules = $collection->rules_json;
        if (empty($rules) || empty($rules['conditions'])) {
            Log::info("Collection {$collection->id} has no rules, clearing auto products");
            $this->clearAutoProducts($collection);
            return 0;
        }

        return DB::transaction(function () use ($collection, $rules) {
            // Get matching product IDs
            $matchingProductIds = $this->ruleEngine
                ->buildQuery($rules, $collection->vendor_id)
                ->pluck('products.id')
                ->toArray();

            // Clear existing auto products
            $this->clearAutoProducts($collection);

            // Insert new matches
            $now = now();
            $inserts = [];
            $sortOrder = 0;

            foreach ($matchingProductIds as $productId) {
                $inserts[] = [
                    'collection_id' => $collection->id,
                    'product_id' => $productId,
                    'source' => CollectionProduct::SOURCE_AUTO,
                    'sort_order' => $sortOrder++,
                    'computed_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Batch insert
            if (!empty($inserts)) {
                foreach (array_chunk($inserts, 500) as $chunk) {
                    DB::table('collection_products')->insert($chunk);
                }
            }

            // Update last indexed timestamp
            $collection->update(['last_indexed_at' => $now]);

            Log::info("Collection {$collection->id} reindexed with {$sortOrder} products");

            return count($matchingProductIds);
        });
    }

    /**
     * Reindex all automated collections.
     */
    public function reindexAllCollections(?int $vendorId = null): array
    {
        $query = Collection::automated()->active();

        if ($vendorId !== null) {
            $query->forVendor($vendorId);
        }

        $results = [];
        $collections = $query->get();

        foreach ($collections as $collection) {
            try {
                $count = $this->reindexCollection($collection);
                $results[$collection->id] = [
                    'handle' => $collection->handle,
                    'count' => $count,
                    'status' => 'success',
                ];
            } catch (\Exception $e) {
                Log::error("Failed to reindex collection {$collection->id}: {$e->getMessage()}");
                $results[$collection->id] = [
                    'handle' => $collection->handle,
                    'count' => 0,
                    'status' => 'error',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    /**
     * Update collections for a specific product.
     * Called when a product is saved/updated.
     */
    public function updateCollectionsForProduct(Product $product): array
    {
        $results = [];

        // Get all automated collections
        $collections = Collection::automated()
            ->active()
            ->when($product->seller_id, function ($q) use ($product) {
                $q->where(function ($sub) use ($product) {
                    $sub->whereNull('vendor_id')
                        ->orWhere('vendor_id', $product->seller_id);
                });
            }, function ($q) {
                $q->whereNull('vendor_id');
            })
            ->get();

        foreach ($collections as $collection) {
            try {
                $shouldInclude = $this->productMatchesCollection($product, $collection);
                $isIncluded = $this->isProductInCollection($product->id, $collection->id, 'auto');

                if ($shouldInclude && !$isIncluded) {
                    // Add to collection
                    $this->addProductToCollection($product->id, $collection->id, 'auto');
                    $results[$collection->id] = 'added';
                } elseif (!$shouldInclude && $isIncluded) {
                    // Remove from collection
                    $this->removeProductFromCollection($product->id, $collection->id, 'auto');
                    $results[$collection->id] = 'removed';
                } else {
                    $results[$collection->id] = 'unchanged';
                }
            } catch (\Exception $e) {
                Log::error("Failed to update collection {$collection->id} for product {$product->id}: {$e->getMessage()}");
                $results[$collection->id] = 'error';
            }
        }

        return $results;
    }

    /**
     * Check if a product matches a collection's rules.
     */
    public function productMatchesCollection(Product $product, Collection $collection): bool
    {
        if ($collection->isManual()) {
            return false;
        }

        $rules = $collection->rules_json;
        if (empty($rules) || empty($rules['conditions'])) {
            return false;
        }

        return $this->ruleEngine
            ->buildQuery($rules, $collection->vendor_id)
            ->where('products.id', $product->id)
            ->exists();
    }

    /**
     * Check if product is in collection with given source.
     */
    public function isProductInCollection(int $productId, int $collectionId, ?string $source = null): bool
    {
        $query = DB::table('collection_products')
            ->where('product_id', $productId)
            ->where('collection_id', $collectionId);

        if ($source) {
            $query->where('source', $source);
        }

        return $query->exists();
    }

    /**
     * Add product to collection.
     */
    public function addProductToCollection(int $productId, int $collectionId, string $source = 'manual'): void
    {
        // Get max sort order
        $maxSort = DB::table('collection_products')
            ->where('collection_id', $collectionId)
            ->max('sort_order') ?? -1;

        DB::table('collection_products')->insertOrIgnore([
            'collection_id' => $collectionId,
            'product_id' => $productId,
            'source' => $source,
            'sort_order' => $maxSort + 1,
            'computed_at' => $source === 'auto' ? now() : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Remove product from collection.
     */
    public function removeProductFromCollection(int $productId, int $collectionId, ?string $source = null): void
    {
        $query = DB::table('collection_products')
            ->where('product_id', $productId)
            ->where('collection_id', $collectionId);

        if ($source) {
            $query->where('source', $source);
        }

        $query->delete();
    }

    /**
     * Manually add products to a collection.
     */
    public function syncManualProducts(Collection $collection, array $productIds): void
    {
        DB::transaction(function () use ($collection, $productIds) {
            // Remove existing manual products
            DB::table('collection_products')
                ->where('collection_id', $collection->id)
                ->where('source', 'manual')
                ->delete();

            // Add new manual products
            $now = now();
            $inserts = [];
            foreach ($productIds as $index => $productId) {
                $inserts[] = [
                    'collection_id' => $collection->id,
                    'product_id' => $productId,
                    'source' => 'manual',
                    'sort_order' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($inserts)) {
                DB::table('collection_products')->insert($inserts);
            }
        });
    }

    /**
     * Reorder products in a collection.
     */
    public function reorderProducts(Collection $collection, array $orderedProductIds): void
    {
        DB::transaction(function () use ($collection, $orderedProductIds) {
            foreach ($orderedProductIds as $index => $productId) {
                DB::table('collection_products')
                    ->where('collection_id', $collection->id)
                    ->where('product_id', $productId)
                    ->update(['sort_order' => $index, 'updated_at' => now()]);
            }
        });
    }

    /**
     * Clear auto products from a collection.
     */
    protected function clearAutoProducts(Collection $collection): void
    {
        DB::table('collection_products')
            ->where('collection_id', $collection->id)
            ->where('source', CollectionProduct::SOURCE_AUTO)
            ->delete();
    }

    /**
     * Get collections that include a product.
     */
    public function getCollectionsForProduct(int $productId): array
    {
        return Collection::whereHas('products', function ($q) use ($productId) {
            $q->where('products.id', $productId);
        })
            ->active()
            ->get(['id', 'title', 'handle', 'type'])
            ->toArray();
    }
}
