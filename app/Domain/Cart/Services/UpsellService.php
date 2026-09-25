<?php

namespace App\Domain\Cart\Services;

use App\Domain\Builder\Models\BuilderAccountProduct;
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
            return $this->getPopularProducts($cart);
        }

        $cacheKey = $this->getCacheKey($cart);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($cart) {
            $cartProductIds = $cart->items->pluck('product_id')->toArray();
            $cartCategoryIds = $this->getCartCategoryIds($cart);

            // For trade carts, only recommend products assigned to the builder
            $allowedProductIds = $this->getAllowedProductIds($cart);

            $recommendations = collect();

            // 1. Same category products (not in cart)
            $sameCategoryProducts = $this->getSameCategoryProducts($cartCategoryIds, $cartProductIds, $allowedProductIds);
            $recommendations = $recommendations->merge($sameCategoryProducts);

            // 2. Frequently bought together (based on order history)
            $frequentlyBoughtTogether = $this->getFrequentlyBoughtTogether($cartProductIds, $allowedProductIds);
            $recommendations = $recommendations->merge($frequentlyBoughtTogether);

            // 3. Higher margin / on-sale items
            $onSaleProducts = $this->getOnSaleProducts($cartProductIds, $allowedProductIds);
            $recommendations = $recommendations->merge($onSaleProducts);

            // Remove duplicates and limit
            $recommendations = $recommendations
                ->unique('id')
                ->whereNotIn('id', $cartProductIds)
                ->take(self::MAX_RECOMMENDATIONS);

            // Fallback: if no recommendations found, get random active products
            if ($recommendations->isEmpty()) {
                $query = Product::query()
                    ->where('is_active', true)
                    ->where('status', 'published')
                    ->whereNotIn('id', $cartProductIds);

                // Filter by allowed products for trade carts
                if ($allowedProductIds !== null) {
                    $query->whereIn('id', $allowedProductIds);
                }

                $fallbackIds = $query->pluck('id')
                    ->shuffle()
                    ->take(self::MAX_RECOMMENDATIONS);
                $recommendations = $fallbackIds->isNotEmpty()
                    ? Product::whereIn('id', $fallbackIds)->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description'])
                    : collect();
            }

            return [
                'items' => $this->formatProducts($recommendations, $cart),
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
            // Suggest "Pack of 2" for single quantity items.
            // Loose comparison because quantity is now decimal:2 (cast to string "1.00").
            if ((float) $item->quantity == 1) {
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
     * Get the list of product IDs allowed for this cart.
     * For trade carts, this is limited to products assigned to the builder.
     * For retail carts, returns null (no restriction).
     */
    protected function getAllowedProductIds(Cart $cart): ?array
    {
        // Only apply filtering for trade carts
        if ($cart->channel !== Cart::CHANNEL_TRADE) {
            return null;
        }

        // Get the builder's user_id
        $userId = $cart->user_id;
        if (!$userId) {
            return [];
        }

        // Get product IDs assigned to this builder
        return BuilderAccountProduct::query()
            ->forAccount($userId)
            ->live()
            ->pluck('product_id')
            ->toArray();
    }

    /**
     * Get products from the same categories as cart items.
     */
    protected function getSameCategoryProducts(array $categoryIds, array $excludeProductIds, ?array $allowedProductIds = null): Collection
    {
        if (empty($categoryIds)) {
            return collect();
        }

        $query = Product::query()
            ->where('is_active', true)
            ->whereIn('category_id', $categoryIds)
            ->whereNotIn('id', $excludeProductIds);

        // Filter by allowed products for trade carts
        if ($allowedProductIds !== null) {
            $query->whereIn('id', $allowedProductIds);
        }

        $ids = $query->pluck('id')
            ->shuffle()
            ->take(4);
        return $ids->isNotEmpty()
            ? Product::whereIn('id', $ids)->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description'])
            : collect();
    }

    /**
     * Get frequently bought together products based on order history.
     */
    protected function getFrequentlyBoughtTogether(array $productIds, ?array $allowedProductIds = null): Collection
    {
        if (empty($productIds)) {
            return collect();
        }

        // Find products that appear in orders with the cart products
        try {
            $query = Product::query()
                ->where('is_active', true)
                ->whereNotIn('id', $productIds)
                ->whereHas('orderItems', function ($query) use ($productIds) {
                    $query->whereHas('order', function ($orderQuery) use ($productIds) {
                        $orderQuery->whereHas('items', function ($itemQuery) use ($productIds) {
                            $itemQuery->whereIn('product_id', $productIds);
                        });
                    });
                });

            // Filter by allowed products for trade carts
            if ($allowedProductIds !== null) {
                $query->whereIn('id', $allowedProductIds);
            }

            return $query
                ->withCount(['orderItems as purchase_count'])
                ->orderByDesc('purchase_count')
                ->limit(4)
                ->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description']);
        } catch (\Throwable $e) {
            return collect();
        }
    }

    /**
     * Get on-sale / discounted products.
     */
    protected function getOnSaleProducts(array $excludeProductIds, ?array $allowedProductIds = null): Collection
    {
        $query = Product::query()
            ->where('is_active', true)
            ->whereNotNull('compare_at_price')
            ->whereColumn('compare_at_price', '>', 'price')
            ->whereNotIn('id', $excludeProductIds);

        // Filter by allowed products for trade carts
        if ($allowedProductIds !== null) {
            $query->whereIn('id', $allowedProductIds);
        }

        return $query
            ->orderByRaw('(compare_at_price - price) / compare_at_price DESC')
            ->limit(4)
            ->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description']);
    }

    /**
     * Get popular products when cart is empty.
     */
    protected function getPopularProducts(Cart $cart = null): array
    {
        // For trade carts, filter by allowed products
        $allowedProductIds = $cart ? $this->getAllowedProductIds($cart) : null;
        $cacheKey = $allowedProductIds !== null
            ? 'upsells.popular.trade.' . ($cart->user_id ?? 0)
            : 'upsells.popular';

        $products = Cache::remember($cacheKey, 300, function () use ($allowedProductIds) {
            $query = Product::query()
                ->where('is_active', true)
                ->where('status', 'published');

            // Filter by allowed products for trade carts
            if ($allowedProductIds !== null) {
                $query->whereIn('id', $allowedProductIds);
            }

            $ids = $query->pluck('id')
                ->shuffle()
                ->take(self::MAX_RECOMMENDATIONS);
            return $ids->isNotEmpty()
                ? Product::whereIn('id', $ids)->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description'])
                : collect();
        });

        return [
            'items' => $this->formatProducts($products, $cart),
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
     * For trade carts, uses the builder's custom price if available.
     */
    protected function formatProducts(Collection $products, ?Cart $cart = null): array
    {
        // For trade carts, get the builder's custom prices
        $builderPrices = [];
        if ($cart && $cart->channel === Cart::CHANNEL_TRADE && $cart->user_id) {
            $builderPrices = BuilderAccountProduct::query()
                ->forAccount($cart->user_id)
                ->live()
                ->whereIn('product_id', $products->pluck('id'))
                ->pluck('price', 'product_id')
                ->toArray();
        }

        return $products->map(function ($product) use ($builderPrices, $cart) {
            // Use builder price if available for trade carts
            $price = $product->price;
            $compareAtPrice = $product->compare_at_price;

            if ($cart && $cart->channel === Cart::CHANNEL_TRADE && isset($builderPrices[$product->id])) {
                $customPrice = $builderPrices[$product->id];
                if ($customPrice !== null) {
                    // Trade price: custom price is the new price, retail price becomes compare_at
                    $compareAtPrice = $product->price; // retail price
                    $price = (float) $customPrice;
                }
            }

            $hasDiscount = $compareAtPrice && $compareAtPrice > $price;
            $discountPercent = $hasDiscount
                ? round(($compareAtPrice - $price) / $compareAtPrice * 100)
                : 0;

            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => $price,
                'compare_at_price' => $compareAtPrice,
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
        $channelPrefix = $cart->channel === Cart::CHANNEL_TRADE ? "trade.{$cart->user_id}." : '';
        return "upsells.{$channelPrefix}cart.{$cart->id}.{$itemsHash}";
    }

    /**
     * Clear upsell cache for a cart.
     */
    public function clearCache(Cart $cart): void
    {
        $cacheKey = $this->getCacheKey($cart);
        Cache::forget($cacheKey);

        // Also clear the popular products cache for trade carts
        if ($cart->channel === Cart::CHANNEL_TRADE && $cart->user_id) {
            Cache::forget('upsells.popular.trade.' . $cart->user_id);
        }
    }
}
