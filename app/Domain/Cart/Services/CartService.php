<?php

namespace App\Domain\Cart\Services;

use App\Domain\Builder\Services\BuilderPricingService;
use App\Domain\Cart\Models\Cart;
use App\Domain\Cart\Models\CartItem;
use App\Domain\Catalog\Models\ProductVariant;
use App\Models\Product;

class CartService
{
    public function getOrCreate(?int $userId, ?string $sessionId, string $channel = Cart::CHANNEL_RETAIL): Cart
    {
        return Cart::getOrCreate($userId, $sessionId, $channel);
    }

    public function getCart(?int $userId, ?string $sessionId, string $channel = Cart::CHANNEL_RETAIL): ?Cart
    {
        if ($userId) {
            return Cart::where('user_id', $userId)
                ->where('channel', $channel)
                ->active()
                ->first();
        }

        if ($sessionId) {
            return Cart::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->where('channel', $channel)
                ->active()
                ->first();
        }

        return null;
    }

    public function addItem(Cart $cart, int $productId, ?int $variantId, float $quantity = 1, array $options = [], bool $isSample = false): CartItem
    {
        $product = Product::findOrFail($productId);
        $variant = $variantId ? ProductVariant::findOrFail($variantId) : null;

        // Samples are a retail-only concept — never on a trade cart.
        if ($cart->channel === Cart::CHANNEL_TRADE) {
            $isSample = false;
        }

        // Samples are always free — shipping covers the cost
        $retail = $variant ? $variant->price : $product->price;
        // Pricing decision runs against the CART'S CHANNEL, not the user's
        // role. A builder's retail cart charges retail; only lines added on
        // a trade cart resolve to the builder price. This is what stops a
        // builder browsing the public storefront from silently paying trade
        // rates there.
        $price = $isSample
            ? 0
            : app(BuilderPricingService::class)->effectivePrice(
                $product,
                (float) $retail,
                $cart->user,
                $cart->channel
            );

        // Zero-price products are display-only and cannot be purchased
        if (!$isSample && (float) $price <= 0) {
            throw new \App\Domain\Cart\Exceptions\ProductNotPurchasableException(
                "'{$product->name}' is not available for purchase."
            );
        }

        // Enforce sample maximum (5 per order, hard cap)
        if ($isSample) {
            $max = \App\Domain\Cart\Services\PricingService::SAMPLE_MAX_QUANTITY;
            $existingSampleCount = (int) $cart->items()->where('is_sample', true)->sum('quantity');
            $available = $max - $existingSampleCount;
            if ($available <= 0) {
                throw new \App\Domain\Cart\Exceptions\SampleLimitExceededException(
                    "Maximum {$max} samples per order. You already have {$existingSampleCount}."
                );
            }
            // Cap quantity to remaining capacity
            $quantity = min($quantity, $available);
        }

        // Sample and non-sample lines of the same product stay separate.
        // Options (selected colour / finish) are part of the identity too, so
        // the same tile chosen in a different colour becomes its own line
        // instead of merging and silently discarding the new selection.
        $normalizedOptions = $options ?: null;
        $existingItem = $cart->items()
            ->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('is_sample', $isSample)
            ->get()
            ->first(fn ($it) => ($it->options_json ?: null) == $normalizedOptions);

        if ($existingItem) {
            $existingItem->incrementQuantity($quantity);
            return $existingItem->fresh();
        }

        return $cart->items()->create([
            'product_id' => $productId,
            'variant_id' => $variantId,
            'quantity' => $quantity,
            'price' => $price,
            'options_json' => $options ?: null,
            'is_sample' => $isSample,
        ]);
    }

    public function updateItemQuantity(CartItem $item, float $quantity): bool
    {
        return $item->updateQuantity($quantity);
    }

    public function removeItem(CartItem $item): bool
    {
        return $item->delete();
    }

    public function clearCart(Cart $cart): void
    {
        $cart->clear();
    }

    public function getCount(?int $userId, ?string $sessionId, string $channel = Cart::CHANNEL_RETAIL): int
    {
        $cart = $this->getCart($userId, $sessionId, $channel);
        if (!$cart) {
            return 0;
        }
        // Ensure items are loaded for accurate count
        $cart->loadMissing('items');
        return $cart->getItemCount();
    }

    public function getSubtotal(Cart $cart): float
    {
        return $cart->getSubtotal();
    }

    public function syncPrices(Cart $cart): void
    {
        foreach ($cart->items as $item) {
            $item->syncPrice();
        }
    }

    /**
     * Guests are ALWAYS on the retail channel (no BuilderMiddleware access
     * without login), so this merges a guest retail cart into the user's
     * retail cart. Trade carts are never touched here — they are login-only
     * by construction.
     */
    public function mergeGuestCart(int $userId, string $sessionId): void
    {
        $guestCart = Cart::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->where('channel', Cart::CHANNEL_RETAIL)
            ->active()
            ->first();

        if (!$guestCart) {
            return;
        }

        $userCart = Cart::where('user_id', $userId)
            ->where('channel', Cart::CHANNEL_RETAIL)
            ->active()
            ->first();

        if (!$userCart) {
            $guestCart->update(['user_id' => $userId, 'session_id' => null]);
            return;
        }

        // The dedupe key MUST match addItem's — product_id + variant_id +
        // is_sample + options_json — otherwise a merged sample becomes a
        // chargeable line and a colour/finish selection silently vanishes.
        foreach ($guestCart->items as $guestItem) {
            $normalizedOptions = $guestItem->options_json ?: null;
            $existingItem = $userCart->items()
                ->where('product_id', $guestItem->product_id)
                ->where('variant_id', $guestItem->variant_id)
                ->where('is_sample', (bool) $guestItem->is_sample)
                ->get()
                ->first(fn ($it) => ($it->options_json ?: null) == $normalizedOptions);

            if ($existingItem) {
                $existingItem->incrementQuantity($guestItem->quantity);
            } else {
                $userCart->items()->create([
                    'product_id' => $guestItem->product_id,
                    'variant_id' => $guestItem->variant_id,
                    'quantity' => $guestItem->quantity,
                    'price' => $guestItem->price,
                    'options_json' => $guestItem->options_json,
                    'is_sample' => (bool) $guestItem->is_sample,
                ]);
            }
        }

        $guestCart->delete();
    }

    public function validateCart(Cart $cart): array
    {
        $errors = [];

        foreach ($cart->items as $item) {
            if (!$item->product || !$item->product->is_active) {
                $errors[] = "Product '{$item->product?->name}' is no longer available";
                continue;
            }

            if (!$item->is_sample && (float) $item->product->price <= 0) {
                $errors[] = "'{$item->product->name}' is not available for purchase.";
                continue;
            }

            if ($item->variant) {
                if (!$item->variant->is_active) {
                    $errors[] = "Variant '{$item->variant->name}' is no longer available";
                    continue;
                }

                if (!$item->variant->canPurchase($item->quantity)) {
                    $errors[] = "Insufficient stock for '{$item->variant->name}'";
                }
            } else {
                if ($item->product->inventory_policy === 'deny' && $item->product->inventory_quantity < $item->quantity) {
                    $errors[] = "Insufficient stock for '{$item->product->name}'";
                }
            }
        }

        return $errors;
    }
}
