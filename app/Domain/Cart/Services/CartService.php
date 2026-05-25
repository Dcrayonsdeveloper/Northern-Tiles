<?php

namespace App\Domain\Cart\Services;

use App\Domain\Cart\Models\Cart;
use App\Domain\Cart\Models\CartItem;
use App\Domain\Catalog\Models\ProductVariant;
use App\Models\Product;

class CartService
{
    public function getOrCreate(?int $userId, ?string $sessionId): Cart
    {
        return Cart::getOrCreate($userId, $sessionId);
    }

    public function getCart(?int $userId, ?string $sessionId): ?Cart
    {
        if ($userId) {
            return Cart::where('user_id', $userId)->active()->first();
        }

        if ($sessionId) {
            return Cart::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->active()
                ->first();
        }

        return null;
    }

    public function addItem(Cart $cart, int $productId, ?int $variantId, float $quantity = 1, array $options = [], bool $isSample = false): CartItem
    {
        $product = Product::findOrFail($productId);
        $variant = $variantId ? ProductVariant::findOrFail($variantId) : null;

        // Samples are always free — shipping covers the cost
        $price = $isSample ? 0 : ($variant ? $variant->price : $product->price);

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

        // Sample and non-sample lines of the same product stay separate
        $existingItem = $cart->items()
            ->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('is_sample', $isSample)
            ->first();

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

    public function getCount(?int $userId, ?string $sessionId): int
    {
        $cart = $this->getCart($userId, $sessionId);
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

    public function mergeGuestCart(int $userId, string $sessionId): void
    {
        $guestCart = Cart::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->active()
            ->first();

        if (!$guestCart) {
            return;
        }

        $userCart = Cart::where('user_id', $userId)->active()->first();

        if (!$userCart) {
            $guestCart->update(['user_id' => $userId, 'session_id' => null]);
            return;
        }

        foreach ($guestCart->items as $guestItem) {
            $existingItem = $userCart->items()
                ->where('product_id', $guestItem->product_id)
                ->where('variant_id', $guestItem->variant_id)
                ->first();

            if ($existingItem) {
                $existingItem->incrementQuantity($guestItem->quantity);
            } else {
                $userCart->items()->create([
                    'product_id' => $guestItem->product_id,
                    'variant_id' => $guestItem->variant_id,
                    'quantity' => $guestItem->quantity,
                    'price' => $guestItem->price,
                    'options_json' => $guestItem->options_json,
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
