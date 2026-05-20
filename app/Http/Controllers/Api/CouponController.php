<?php

namespace App\Http\Controllers\Api;

use App\Domain\Cart\Services\CartService;
use App\Domain\Cart\Services\PricingService;
use App\Domain\Marketing\Services\CouponService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function __construct(
        protected CouponService $couponService,
        protected CartService $cartService,
        protected PricingService $pricingService
    ) {}

    /**
     * Return publicly visible active coupons for the "Available Offers" panel.
     * Only shows unrestricted coupons (no eligible_customers list).
     */
    public function available(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();
        $cart = $this->cartService->getCart($userId, $sessionId);
        $subtotal = $cart ? $cart->getSubtotal() : 0;

        $coupons = \App\Domain\Marketing\Models\Coupon::active()
            ->where(function ($q) {
                $q->whereNull('usage_limit')->orWhereColumn('times_used', '<', 'usage_limit');
            })
            ->whereNull('eligible_customers')
            ->orderBy('minimum_purchase')
            ->get()
            ->map(function ($coupon) use ($subtotal) {
                return [
                    'code'             => $coupon->code,
                    'title'            => $coupon->title,
                    'description'      => $coupon->description,
                    'type'             => $coupon->type,
                    'value'            => (float) $coupon->value,
                    'minimum_purchase' => (float) $coupon->minimum_purchase,
                    'first_order_only' => (bool) $coupon->first_order_only,
                    'gives_free_shipping' => $coupon->givesFreeShipping(),
                    'qualifies'        => !$coupon->minimum_purchase || $subtotal >= (float) $coupon->minimum_purchase,
                ];
            });

        return response()->json(['coupons' => $coupons]);
    }

    /**
     * Apply a coupon code to the cart
     */
    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
        ]);

        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if (!$cart) {
            return response()->json([
                'success' => false,
                'error' => 'Cart not found.',
            ], 404);
        }

        if ($cart->isEmpty()) {
            return response()->json([
                'success' => false,
                'error' => 'Your cart is empty.',
            ], 422);
        }

        $result = $this->couponService->applyCoupon($cart, $validated['code']);

        if ($result['success']) {
            $cart = $cart->fresh(['items.product', 'items.variant']);
            $result['totals'] = $this->pricingService->computeTotals($cart);
            $result['shipping_estimate'] = $this->pricingService->getShippingEstimate($cart);
        }

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Remove coupon from cart
     */
    public function remove(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if (!$cart) {
            return response()->json([
                'success' => false,
                'error' => 'Cart not found.',
            ], 404);
        }

        $result = $this->couponService->removeCoupon($cart);

        $cart = $cart->fresh(['items.product', 'items.variant']);
        $result['coupon'] = null;
        $result['totals'] = $this->pricingService->computeTotals($cart);
        $result['shipping_estimate'] = $this->pricingService->getShippingEstimate($cart);

        return response()->json($result);
    }

    /**
     * Validate a coupon code without applying
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
        ]);

        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);
        $subtotal = $cart ? $cart->getSubtotal() : 0;
        $email = $cart?->email ?? $request->user()?->email;

        $result = $this->couponService->validateCoupon(
            $validated['code'],
            $subtotal,
            $userId,
            $email
        );

        if ($result['valid']) {
            return response()->json([
                'valid' => true,
                'coupon' => [
                    'code' => $result['coupon']->code,
                    'title' => $result['coupon']->title,
                    'type' => $result['coupon']->type,
                    'value' => $result['coupon']->value,
                ],
                'discount_amount' => $result['discount_amount'],
            ]);
        }

        return response()->json($result, 422);
    }
}
