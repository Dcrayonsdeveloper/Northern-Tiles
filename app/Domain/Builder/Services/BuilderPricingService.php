<?php

namespace App\Domain\Builder\Services;

use App\Domain\Builder\Models\BuilderAccountProduct;
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
    /** Per-request memo of "account:product" => builder price, so a listing page hits the DB once. */
    private array $priceMemo = [];

    /** Per-request memo of account id => product ids in its own catalogue, or null when it has none. */
    private array $accountCatalogueMemo = [];

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

        // isBuilder() requires approval, so a pending applicant keeps paying
        // retail until an admin lets them in — the price can never run ahead
        // of the approval.
        return (bool) ($user->isBuilder() || $user->is_admin);
    }

    /**
     * The builder price for a product, or null when the product is not in the
     * builder catalogue. Does NOT check who is asking — callers that are about
     * to charge money must gate on isBuilder() as well; effectivePrice() does
     * both and is the safer entry point.
     */
    public function builderPrice(Product|int $product, ?User $user = null): ?float
    {
        $productId = $product instanceof Product ? $product->id : (int) $product;
        $user = $user ?? Auth::user();
        $key = ($user?->id ?? 0) . ':' . $productId;

        if (array_key_exists($key, $this->priceMemo)) {
            return $this->priceMemo[$key];
        }

        $ownCatalogue = $this->accountCatalogueIds($user);

        if ($ownCatalogue !== null) {
            // This account has its own list, so the shared catalogue does not
            // apply: a product missing from the list is simply not for sale to
            // them, whatever the shared catalogue says.
            if (! array_key_exists($productId, $ownCatalogue)) {
                return $this->priceMemo[$key] = null;
            }

            // A null price on the row means "at the shared price". If the
            // product is not in the shared catalogue either, there is no trade
            // price to give and the caller falls back to retail.
            $own = $ownCatalogue[$productId];

            return $this->priceMemo[$key] = $own ?? $this->sharedPrice($productId);
        }

        return $this->priceMemo[$key] = $this->sharedPrice($productId);
    }

    /**
     * Product ids in this account's own catalogue as [product_id => price|null],
     * or null when the account has no catalogue of its own and therefore uses
     * the shared one.
     *
     * @return array<int, float|null>|null
     */
    public function accountCatalogueIds(?User $user = null): ?array
    {
        $user = $user ?? Auth::user();

        if (! $user) {
            return null;
        }

        if (array_key_exists($user->id, $this->accountCatalogueMemo)) {
            return $this->accountCatalogueMemo[$user->id];
        }

        $rows = BuilderAccountProduct::live()
            ->forAccount($user)
            ->pluck('price', 'product_id');

        // No rows at all means "not configured", which is different from "an
        // empty catalogue": the account falls back to the shared list rather
        // than seeing nothing.
        if ($rows->isEmpty()) {
            return $this->accountCatalogueMemo[$user->id] = null;
        }

        return $this->accountCatalogueMemo[$user->id] = $rows
            ->map(fn ($price) => $price === null ? null : (float) $price)
            ->all();
    }

    /** The one shared catalogue price, memoised across accounts. */
    private function sharedPrice(int $productId): ?float
    {
        $key = 'shared:' . $productId;

        if (! array_key_exists($key, $this->priceMemo)) {
            $entry = BuilderProduct::live()->where('product_id', $productId)->first();
            $this->priceMemo[$key] = $entry ? (float) $entry->price : null;
        }

        return $this->priceMemo[$key];
    }

    /**
     * Price this user actually pays. Returns the retail/variant price for
     * everyone who is not an approved builder, or for products the admin has
     * not put in the builder catalogue.
     *
     * $channel is the CART/SURFACE the price is being charged on:
     *   - 'retail' (default): always retail, even for approved builders. A
     *     builder can still buy at retail from the public storefront if they
     *     want to keep a purchase off their trade account.
     *   - 'trade': trade price when the user qualifies, otherwise retail.
     *
     * Making channel decide (not just the user) is what keeps a builder's
     * retail cart at retail prices after this system split.
     */
    public function effectivePrice(
        Product $product,
        ?float $fallback = null,
        ?User $user = null,
        string $channel = 'retail'
    ): float {
        $fallback ??= (float) $product->price;

        if ($channel !== 'trade') {
            return $fallback;
        }

        if (! $this->isBuilder($user)) {
            return $fallback;
        }

        return $this->builderPrice($product, $user) ?? $fallback;
    }

    /**
     * Bulk lookup gated by channel. Same shape as priceMap(), but on the
     * retail channel it short-circuits to an empty map so listing renderers
     * on the public storefront never accidentally show trade prices.
     *
     * @param  iterable<int>  $productIds
     * @return array<int, float>
     */
    public function priceMapForChannel(iterable $productIds, ?User $user = null, string $channel = 'retail'): array
    {
        if ($channel !== 'trade' || ! $this->isBuilder($user)) {
            return [];
        }

        return $this->priceMap($productIds, $user);
    }

    /**
     * Bulk lookup for listing pages: [product_id => builder price].
     * Only returns entries that are live.
     *
     * @param  iterable<int>  $productIds
     * @return array<int, float>
     */
    public function priceMap(iterable $productIds, ?User $user = null): array
    {
        $ids = array_values(array_unique(array_map('intval', is_array($productIds) ? $productIds : iterator_to_array($productIds))));

        if (empty($ids)) {
            return [];
        }

        $user = $user ?? Auth::user();

        $shared = BuilderProduct::live()
            ->whereIn('product_id', $ids)
            ->pluck('price', 'product_id')
            ->map(fn ($price) => (float) $price)
            ->all();

        foreach ($ids as $id) {
            $this->priceMemo['shared:' . $id] = $shared[$id] ?? null;
        }

        $own = $this->accountCatalogueIds($user);
        $accountKey = ($user?->id ?? 0) . ':';

        if ($own === null) {
            // Memoise both hits and misses so later single lookups in the same
            // request don't re-query for products we already know aren't listed.
            foreach ($ids as $id) {
                $this->priceMemo[$accountKey . $id] = $shared[$id] ?? null;
            }

            return $shared;
        }

        $map = [];

        foreach ($ids as $id) {
            $price = array_key_exists($id, $own)
                ? ($own[$id] ?? ($shared[$id] ?? null))
                : null;

            $this->priceMemo[$accountKey . $id] = $price;

            if ($price !== null) {
                $map[$id] = $price;
            }
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
