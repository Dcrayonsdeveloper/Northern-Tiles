<?php

namespace App\Domain\Marketing\Services;

use App\Domain\Cart\Models\Cart;
use App\Domain\Marketing\Models\Coupon;

class CouponService
{
    /**
     * Validate and apply a coupon code to cart
     */
    public function applyCoupon(Cart $cart, string $code): array
    {
        $coupon = Coupon::findByCode($code);

        if (!$coupon) {
            return [
                'success' => false,
                'error' => 'Invalid coupon code.',
                'error_code' => 'invalid_code',
            ];
        }

        if (!$coupon->isValid()) {
            if ($coupon->expires_at && $coupon->expires_at->isPast()) {
                return [
                    'success' => false,
                    'error' => 'This coupon has expired.',
                    'error_code' => 'expired',
                ];
            }

            if ($coupon->usage_limit && $coupon->times_used >= $coupon->usage_limit) {
                return [
                    'success' => false,
                    'error' => 'This coupon has reached its usage limit.',
                    'error_code' => 'usage_limit',
                ];
            }

            return [
                'success' => false,
                'error' => 'This coupon is not currently active.',
                'error_code' => 'inactive',
            ];
        }

        $userId = $cart->user_id;
        $email = $cart->email;

        if (!$coupon->canBeUsedBy($userId, $email)) {
            if ($coupon->first_order_only) {
                return [
                    'success' => false,
                    'error' => 'This coupon is only valid for first-time customers.',
                    'error_code' => 'first_order_only',
                ];
            }

            if ($coupon->usage_limit_per_customer) {
                return [
                    'success' => false,
                    'error' => 'You have already used this coupon the maximum number of times.',
                    'error_code' => 'per_customer_limit',
                ];
            }

            return [
                'success' => false,
                'error' => 'You are not eligible to use this coupon.',
                'error_code' => 'not_eligible',
            ];
        }

        $subtotal = $cart->getSubtotal();

        if ($coupon->minimum_purchase && $subtotal < $coupon->minimum_purchase) {
            return [
                'success' => false,
                'error' => "Minimum purchase of A\${$coupon->minimum_purchase} required for this coupon.",
                'error_code' => 'minimum_not_met',
                'minimum_purchase' => $coupon->minimum_purchase,
                'current_subtotal' => $subtotal,
            ];
        }

        $discount = $coupon->calculateDiscount($subtotal, $cart->items->toArray());

        // Apply coupon to cart
        $cart->update([
            'coupon_id' => $coupon->id,
            'discount_amount' => $discount,
        ]);

        return [
            'success' => true,
            'coupon' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'title' => $coupon->title,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'discount_amount' => $discount,
                'gives_free_shipping' => $coupon->givesFreeShipping(),
            ],
            'discount_amount' => $discount,
            'message' => $this->getSuccessMessage($coupon, $discount),
        ];
    }

    /**
     * Remove coupon from cart
     */
    public function removeCoupon(Cart $cart): array
    {
        $cart->update([
            'coupon_id' => null,
            'discount_amount' => 0,
        ]);

        return [
            'success' => true,
            'message' => 'Coupon removed successfully.',
        ];
    }

    /**
     * Get applied coupon details for cart
     */
    public function getAppliedCoupon(Cart $cart): ?array
    {
        if (!$cart->coupon_id) {
            return null;
        }

        $coupon = Coupon::find($cart->coupon_id);

        if (!$coupon) {
            // Coupon was deleted, remove from cart
            $cart->update(['coupon_id' => null, 'discount_amount' => 0]);
            return null;
        }

        // Re-validate coupon
        if (!$coupon->isValid()) {
            $cart->update(['coupon_id' => null, 'discount_amount' => 0]);
            return null;
        }

        // Recalculate discount (prices might have changed)
        $subtotal = $cart->getSubtotal();
        $discount = $coupon->calculateDiscount($subtotal);

        if ($discount !== (float) $cart->discount_amount) {
            $cart->update(['discount_amount' => $discount]);
        }

        return [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'title' => $coupon->title,
            'description' => $coupon->description,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount_amount' => $discount,
            'gives_free_shipping' => $coupon->givesFreeShipping(),
        ];
    }

    /**
     * Validate coupon without applying
     */
    public function validateCoupon(string $code, float $subtotal, ?int $userId = null, ?string $email = null): array
    {
        $coupon = Coupon::findByCode($code);

        if (!$coupon) {
            return ['valid' => false, 'error' => 'Invalid coupon code.'];
        }

        if (!$coupon->isValid()) {
            return ['valid' => false, 'error' => 'This coupon is not currently active.'];
        }

        if (!$coupon->canBeUsedBy($userId, $email)) {
            return ['valid' => false, 'error' => 'You are not eligible to use this coupon.'];
        }

        if ($coupon->minimum_purchase && $subtotal < $coupon->minimum_purchase) {
            return [
                'valid' => false,
                'error' => "Minimum purchase of A\${$coupon->minimum_purchase} required.",
            ];
        }

        $discount = $coupon->calculateDiscount($subtotal);

        return [
            'valid' => true,
            'coupon' => $coupon,
            'discount_amount' => $discount,
        ];
    }

    /**
     * Record coupon usage after order completion
     */
    public function recordUsage(Cart $cart, int $orderId): void
    {
        if (!$cart->coupon_id) {
            return;
        }

        $coupon = Coupon::find($cart->coupon_id);

        if ($coupon) {
            $coupon->recordUsage(
                $cart->user_id,
                $orderId,
                $cart->email,
                $cart->discount_amount
            );
        }
    }

    /**
     * Evaluate all eligible coupons and apply the one with the highest discount.
     * Called automatically after every cart mutation (add/update/remove item).
     */
    public function autoApplyBestCoupon(Cart $cart): void
    {
        $subtotal = $cart->getSubtotal();

        if ($subtotal <= 0) {
            if ($cart->coupon_id) {
                $cart->update(['coupon_id' => null, 'discount_amount' => 0]);
            }
            return;
        }

        $userId = $cart->user_id;
        $email = $cart->email;

        $coupons = Coupon::active()
            ->where(function ($q) {
                $q->whereNull('usage_limit')->orWhereColumn('times_used', '<', 'usage_limit');
            })
            ->get();

        // Seed the best candidate from the currently-applied coupon (if it is still
        // valid and eligible). This ensures auto-apply only replaces a user's manually
        // entered code with something STRICTLY better — not just equal — preventing
        // WELCOME10 and FLAT100 from swapping when they happen to give the same amount.
        $bestCoupon = null;
        $bestDiscount = -1.0;

        if ($cart->coupon_id) {
            $applied = $coupons->firstWhere('id', $cart->coupon_id);
            if ($applied
                && $applied->canBeUsedBy($userId, $email)
                && (!$applied->minimum_purchase || $subtotal >= (float) $applied->minimum_purchase)
            ) {
                $bestDiscount = $applied->calculateDiscount($subtotal, $cart->items->toArray());
                $bestCoupon = $applied;
            }
            // If the applied coupon is no longer active/eligible, bestCoupon stays null
            // and the loop below will find the best replacement (or leave the cart coupon-free).
        }

        foreach ($coupons as $coupon) {
            if (!$coupon->canBeUsedBy($userId, $email)) {
                continue;
            }

            if ($coupon->minimum_purchase && $subtotal < (float) $coupon->minimum_purchase) {
                continue;
            }

            $discount = $coupon->calculateDiscount($subtotal, $cart->items->toArray());

            if ($discount > $bestDiscount) {
                $bestDiscount = $discount;
                $bestCoupon = $coupon;
            }
        }

        if ($bestCoupon) {
            if ($cart->coupon_id !== $bestCoupon->id || (float) $cart->discount_amount !== $bestDiscount) {
                $cart->update([
                    'coupon_id' => $bestCoupon->id,
                    'discount_amount' => $bestDiscount,
                ]);
            }
        } else {
            if ($cart->coupon_id) {
                $cart->update(['coupon_id' => null, 'discount_amount' => 0]);
            }
        }
    }

    /**
     * Get success message for applied coupon
     */
    protected function getSuccessMessage(Coupon $coupon, float $discount): string
    {
        if ($coupon->givesFreeShipping()) {
            return 'Free shipping applied!';
        }

        if ($coupon->type === Coupon::TYPE_PERCENTAGE) {
            return "Coupon applied! You save {$coupon->value}% ($" . number_format($discount, 2) . ")";
        }

        return "Coupon applied! You save $" . number_format($discount, 2);
    }
}
