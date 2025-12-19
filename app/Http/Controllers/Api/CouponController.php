<?php

namespace App\Http\Controllers\Api;

use App\Domain\Cart\Services\CartService;
use App\Domain\Marketing\Services\CouponService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function __construct(
        protected CouponService $couponService,
        protected CartService $cartService
    ) {}

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
