<?php

namespace App\Domain\Builder\Services;

use App\Domain\Builder\Models\BuilderProduct;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Single source of truth for "what does this user pay for this product?".
 *
 * Every surface that shows or charges a price — the builder storefront, the
 * cart, checkout — goes through here, so trade pricing can never disagree
 * with itself between the page and the invoice.
 */
class BuilderPricingService
{
    /** Per-request memo of product_id => builder price, so a listing page hits the DB once. */
    private array $priceMemo = [];

    /**
     * Is this account entitled to trade pricing?
     * Falls back to the logged-in user when none is passed.
     *
     * Admins count too. They can browse the portal to check the catalogue, and
     * if the preview showed trade prices while the cart charged retail the two
     * would disagree — so the entitlement follows the access, not just the
     * builder flag.
     */
    public function isBuilder(?User $user = null): bool
    {
        $user = $user ?? Auth::user();

        if (! $user?->is_active) {
            return false;
        }

        return (bool) ($user->is_builder || $user->is_admin);
    }

    /**
     * The builder price for a product, or null when the product is not in the
     * builder catalogue. Does NOT check who is asking — callers that are about
     * to charge money must gate on isBuilder() as well; effectivePrice() does
     * both and is the safer entry point.
     */
    public function builderPrice(Product|int $product): ?float
    {
        $productId = $product instanceof Product ? $product->id : (int) $product;

        if (! array_key_exists($productId, $this->priceMemo)) {
            $entry = BuilderProduct::live()->where('product_id', $productId)->first();
            $this->priceMemo[$productId] = $entry ? (float) $entry->price : null;
        }

        return $this->priceMemo[$productId];
    }

    /**
     * Price this user actually pays. Returns the retail/variant price for
     * everyone who is not an approved builder, or for products the admin has
     * not put in the builder catalogue.
     */
    public function effectivePrice(Product $product, ?float $fallback = null, ?User $user = null): float
    {
        $fallback ??= (float) $product->price;

        if (! $this->isBuilder($user)) {
            return $fallback;
        }

        return $this->builderPrice($product) ?? $fallback;
    }

    /**
     * Bulk lookup for listing pages: [product_id => builder price].
     * Only returns entries that are live.
     *
     * @param  iterable<int>  $productIds
     * @return array<int, float>
     */
    public function priceMap(iterable $productIds): array
    {
        $ids = array_values(array_unique(array_map('intval', is_array($productIds) ? $productIds : iterator_to_array($productIds))));

        if (empty($ids)) {
            return [];
        }

        $map = BuilderProduct::live()
            ->whereIn('product_id', $ids)
            ->pluck('price', 'product_id')
            ->map(fn ($price) => (float) $price)
            ->all();

        // Memoise both hits and misses so later single lookups in the same
        // request don't re-query for products we already know aren't listed.
        foreach ($ids as $id) {
            $this->priceMemo[$id] = $map[$id] ?? null;
        }

        return $map;
    }

    /**
     * Product IDs in the live builder catalogue. Used to scope the portal's
     * shop queries — builders only ever see what the admin has published.
     *
     * @return array<int, int>
     */
    public function catalogueProductIds(): array
    {
        return BuilderProduct::live()->pluck('product_id')->map(fn ($id) => (int) $id)->all();
    }
}
