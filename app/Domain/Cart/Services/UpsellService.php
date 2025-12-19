<?php

namespace App\Domain\Cart\Services;

use App\Domain\Cart\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class UpsellService
{
    protected const CACHE_TTL = 60; // 60 seconds cache
    protected const MAX_RECOMMENDATIONS = 4;

    /**
     * Get upsell/cross-sell recommendations for a cart.
     */
    public function getRecommendations(Cart $cart): array
    {
        if ($cart->isEmpty()) {
            return $this->getPopularProducts();
        }

        $cacheKey = $this->getCacheKey($cart);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($cart) {
            $cartProductIds = $cart->items->pluck('product_id')->toArray();
            $cartCategoryIds = $this->getCartCategoryIds($cart);

            $recommendations = collect();

            // 1. Same category products (not in cart)
            $sameCategoryProducts = $this->getSameCategoryProducts($cartCategoryIds, $cartProductIds);
            $recommendations = $recommendations->merge($sameCategoryProducts);

            // 2. Frequently bought together (based on order history)
            $frequentlyBoughtTogether = $this->getFrequentlyBoughtTogether($cartProductIds);
            $recommendations = $recommendations->merge($frequentlyBoughtTogether);

            // 3. Higher margin / on-sale items
            $onSaleProducts = $this->getOnSaleProducts($cartProductIds);
            $recommendations = $recommendations->merge($onSaleProducts);

            // Remove duplicates and limit
            $recommendations = $recommendations
                ->unique('id')
                ->whereNotIn('id', $cartProductIds)
                ->take(self::MAX_RECOMMENDATIONS);

            return [
                'items' => $this->formatProducts($recommendations),
                'title_key' => 'cart.upsells.title',
                'type' => 'recommendations',
            ];
        });
    }

    /**
     * Get bundle deal suggestions (Pack of 2, etc.).
     */
    public function getBundleDeals(Cart $cart): array
    {
        if ($cart->isEmpty()) {
            return [];
        }

        $bundles = [];

        foreach ($cart->items as $item) {
            // Suggest "Pack of 2" for single quantity items
            if ($item->quantity === 1) {
                $bundles[] = [
                    'type' => 'pack_of_2',
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name,
                    'original_price' => $item->price * 2,
                    'bundle_price' => $item->price * 2 * 0.9, // 10% off for bundle
                    'savings' => $item->price * 2 * 0.1,
                    'label_key' => 'cart.bundle.pack_of_2',
                ];
            }
        }

        return array_slice($bundles, 0, 2); // Max 2 bundle suggestions
    }

    /**
     * Get products from the same categories as cart items.
     */
    protected function getSameCategoryProducts(array $categoryIds, array $excludeProductIds): Collection
    {
        if (empty($categoryIds)) {
            return collect();
        }

        return Product::query()
            ->where('is_active', true)
            ->whereIn('category_id', $categoryIds)
            ->whereNotIn('id', $excludeProductIds)
            ->inRandomOrder()
            ->limit(4)
            ->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description']);
    }

    /**
     * Get frequently bought together products based on order history.
     */
    protected function getFrequentlyBoughtTogether(array $productIds): Collection
    {
        if (empty($productIds)) {
            return collect();
        }

        // Find products that appear in orders with the cart products
        return Product::query()
            ->where('is_active', true)
            ->whereNotIn('id', $productIds)
            ->whereHas('orderItems', function ($query) use ($productIds) {
                $query->whereHas('order', function ($orderQuery) use ($productIds) {
                    $orderQuery->whereHas('items', function ($itemQuery) use ($productIds) {
                        $itemQuery->whereIn('product_id', $productIds);
                    });
                });
            })
            ->withCount(['orderItems as purchase_count'])
            ->orderByDesc('purchase_count')
            ->limit(4)
            ->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description']);
    }

    /**
     * Get on-sale / discounted products.
     */
    protected function getOnSaleProducts(array $excludeProductIds): Collection
    {
        return Product::query()
            ->where('is_active', true)
            ->whereNotNull('compare_at_price')
            ->whereColumn('compare_at_price', '>', 'price')
            ->whereNotIn('id', $excludeProductIds)
            ->orderByRaw('(compare_at_price - price) / compare_at_price DESC')
            ->limit(4)
            ->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description']);
    }

    /**
     * Get popular products when cart is empty.
     */
    protected function getPopularProducts(): array
    {
        $products = Cache::remember('upsells.popular', 300, function () {
            return Product::query()
                ->where('is_active', true)
                ->withCount(['orderItems as sales_count'])
                ->orderByDesc('sales_count')
                ->limit(self::MAX_RECOMMENDATIONS)
                ->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description']);
        });

        return [
            'items' => $this->formatProducts($products),
            'title_key' => 'cart.upsells.popular',
            'type' => 'popular',
        ];
    }

    /**
     * Get category IDs from cart items.
     */
    protected function getCartCategoryIds(Cart $cart): array
    {
        return $cart->items
            ->map(fn ($item) => $item->product?->category_id)
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Format products for frontend.
     */
    protected function formatProducts(Collection $products): array
    {
        return $products->map(function ($product) {
            $hasDiscount = $product->compare_at_price && $product->compare_at_price > $product->price;
            $discountPercent = $hasDiscount
                ? round(($product->compare_at_price - $product->price) / $product->compare_at_price * 100)
                : 0;

            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => $product->price,
                'compare_at_price' => $product->compare_at_price,
                'image_url' => $product->image_url ?? '/images/placeholder-product.svg',
                'short_description' => $product->short_description,
                'has_discount' => $hasDiscount,
                'discount_percent' => $discountPercent,
            ];
        })->values()->toArray();
    }

    /**
     * Generate cache key based on cart contents.
     */
    protected function getCacheKey(Cart $cart): string
    {
        $itemsHash = md5($cart->items->pluck('product_id')->sort()->implode(','));
        return "upsells.cart.{$cart->id}.{$itemsHash}";
    }

    /**
     * Clear upsell cache for a cart.
     */
    public function clearCache(Cart $cart): void
    {
        $cacheKey = $this->getCacheKey($cart);
        Cache::forget($cacheKey);
    }
}
