<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\ProductVariant;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class CatalogService
{
    public function getProduct(string $slug, ?int $sellerId = null): ?Product
    {
        $cacheKey = $sellerId ? "product.{$slug}.seller.{$sellerId}" : "product.{$slug}";

        return Cache::remember($cacheKey, 3600, function () use ($slug, $sellerId) {
            $query = Product::with([
                'category',
                'variants' => fn ($q) => $q->active()->orderBy('sort_order'),
                'tags',
                'contentBlocks' => fn ($q) => $q->active()->orderBy('sort_order'),
                'attributeSet.attributes',
            ])
                ->where('slug', $slug);

            if ($sellerId) {
                $query->where('seller_id', $sellerId);
            }

            return $query->first();
        });
    }

    public function getProducts(array $filters = [], ?int $sellerId = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Product::with(['category', 'variants'])
            ->active();

        if ($sellerId) {
            $query->forSeller($sellerId);
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['category_slug'])) {
            $query->where(function ($q) use ($filters) {
                $q->whereHas('category', fn ($inner) => $inner->where('slug', $filters['category_slug']))
                  ->orWhereHas('categories', fn ($inner) => $inner->where('slug', $filters['category_slug']));
            });
        }

        if (!empty($filters['brand'])) {
            $query->where('brand', $filters['brand']);
        }

        if (!empty($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }

        if (!empty($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        if (!empty($filters['in_stock'])) {
            $query->inStock();
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['tags'])) {
            $query->whereHas('tags', function ($q) use ($filters) {
                $q->whereIn('slug', (array) $filters['tags']);
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';

        $allowedSorts = ['created_at', 'price', 'name', 'inventory_quantity'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        }

        return $query->paginate($perPage);
    }

    public function getCategories(): Collection
    {
        return Cache::remember('catalog_categories', 3600, function () {
            return Category::withCount(['products' => function ($q) {
                $q->active();
            }])
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        });
    }

    public function getCategoryTree(): array
    {
        $categories = $this->getCategories();
        return $this->buildCategoryTree($categories);
    }

    protected function buildCategoryTree(Collection $categories, ?int $parentId = null): array
    {
        $branch = [];

        foreach ($categories as $category) {
            if ($category->parent_id === $parentId) {
                $node = $category->toArray();
                $node['children'] = $this->buildCategoryTree($categories, $category->id);
                $branch[] = $node;
            }
        }

        return $branch;
    }

    public function getVariants(int $productId): Collection
    {
        return ProductVariant::where('product_id', $productId)
            ->active()
            ->orderBy('sort_order')
            ->get();
    }

    public function checkInventory(int $variantId, int $quantity): array
    {
        $variant = ProductVariant::find($variantId);

        if (!$variant) {
            return ['available' => false, 'message' => 'Variant not found'];
        }

        if ($variant->canPurchase($quantity)) {
            return [
                'available' => true,
                'quantity_available' => $variant->inventory_quantity,
                'message' => 'In stock',
            ];
        }

        return [
            'available' => false,
            'quantity_available' => $variant->inventory_quantity,
            'message' => 'Insufficient stock',
        ];
    }

    public function getBrands(): array
    {
        return Cache::remember('catalog_brands', 3600, function () {
            return Product::active()
                ->whereNotNull('brand')
                ->distinct()
                ->pluck('brand')
                ->sort()
                ->values()
                ->toArray();
        });
    }

    public function flushProductCache(string $slug): void
    {
        Cache::forget("product.{$slug}");
    }

    public function flushCategoriesCache(): void
    {
        Cache::forget('catalog_categories');
    }

    public function flushBrandsCache(): void
    {
        Cache::forget('catalog_brands');
    }
}
