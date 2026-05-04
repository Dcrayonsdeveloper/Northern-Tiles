<?php

namespace App\Http\Controllers\Api;

use App\Domain\Cart\Http\Requests\AddToCartRequest;
use App\Domain\Cart\Services\CartService;
use App\Domain\Cart\Services\PricingService;
use App\Domain\Cart\Services\UpsellService;
use App\Domain\Marketing\Models\Coupon;
use App\Domain\Marketing\Services\CouponService;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected PricingService $pricingService,
        protected UpsellService $upsellService,
        protected CouponService $couponService
    ) {}

    public function count(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        return response()->json([
            'count' => $this->cartService->getCount($userId, $sessionId),
        ]);
    }

    /**
     * Get full cart with items, totals, and upsells.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if (!$cart) {
            return response()->json([
                'items' => [],
                'totals' => [
                    'subtotal' => 0,
                    'discount' => 0,
                    'shipping' => 0,
                    'sample_shipping' => 0,
                    'tax' => 0,
                    'grand_total' => 0,
                    'item_count' => 0,
                    'sample_count' => 0,
                    'sample_max' => 5,
                    'samples_remaining' => 5,
                    'is_at_sample_max' => false,
                    'sample_minimum_met' => true,
                    'currency' => Setting::getValue('marketplace.currency', 'AUD'),
                    'currency_symbol' => Setting::getValue('marketplace.currency_symbol', '$'),
                ],
                'shipping_estimate' => [
                    'estimated' => 0,
                    'free_threshold' => 999,
                    'amount_for_free' => 999,
                    'is_free' => false,
                ],
                'upsells' => $this->upsellService->getRecommendations(new \App\Domain\Cart\Models\Cart()),
                'bundles' => [],
                'coupon' => null,
            ]);
        }

        $cart->load(['items.product', 'items.variant']);

        // Format cart items for frontend (filter out items with deleted products)
        $items = $cart->items
            ->filter(fn ($item) => $item->product !== null)
            ->map(function ($item) {
                $product = $item->product;
                $variant = $item->variant;

                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'line_total' => $item->price * $item->quantity,
                    'is_sample' => (bool) $item->is_sample,
                    'product' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'image_url' => $product->image_url ?? '/images/placeholder-product.svg',
                        'compare_at_price' => $product->compare_at_price,
                        'sqm_per_box' => $product->sqm_per_box,
                    ],
                    'variant' => $variant ? [
                        'id' => $variant->id,
                        'name' => $variant->name,
                        'sku' => $variant->sku,
                    ] : null,
                    'options' => $item->options_json,
                ];
            })
            ->values();

        // Compute server-authoritative totals
        $totals = $this->pricingService->computeTotals($cart);
        $shippingEstimate = $this->pricingService->getShippingEstimate($cart);

        // Get upsell recommendations
        $upsells = $this->upsellService->getRecommendations($cart);
        $bundles = $this->upsellService->getBundleDeals($cart);

        // Get applied coupon info
        $appliedCoupon = $this->couponService->getAppliedCoupon($cart);

        return response()->json([
            'items' => $items,
            'totals' => $totals,
            'shipping_estimate' => $shippingEstimate,
            'upsells' => $upsells,
            'bundles' => $bundles,
            'coupon' => $appliedCoupon,
        ]);
    }

    public function add(AddToCartRequest $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getOrCreate($userId, $sessionId);

        try {
            $item = $this->cartService->addItem(
                $cart,
                $request->input('product_id'),
                $request->input('variant_id'),
                $request->input('quantity', 1),
                $request->input('options', []),
                (bool) $request->input('is_sample', false)
            );
        } catch (\App\Domain\Cart\Exceptions\SampleLimitExceededException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'sample_limit_exceeded',
            ], 422);
        }

        // Clear upsell cache since cart changed
        $this->upsellService->clearCache($cart);

        // Reload cart with fresh data
        $cart = $cart->fresh(['items.product', 'items.variant']);
        $totals = $this->pricingService->computeTotals($cart);

        return response()->json([
            'success' => true,
            'item' => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'quantity' => $item->quantity,
                'price' => $item->price,
                'line_total' => $item->price * $item->quantity,
                'is_sample' => (bool) $item->is_sample,
                'product' => [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'slug' => $item->product->slug,
                    'image_url' => $item->product->image_url ?? '/images/placeholder-product.svg',
                    'sqm_per_box' => $item->product->sqm_per_box,
                ],
            ],
            'totals' => $totals,
        ]);
    }

    public function update(Request $request, int $itemId): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0|max:100',
        ]);

        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if (!$cart) {
            return response()->json(['error' => 'Cart not found'], 404);
        }

        $item = $cart->items()->find($itemId);

        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        // Enforce sample maximum when increasing a sample line's quantity
        if ($item->is_sample && $validated['quantity'] > $item->quantity) {
            $max = \App\Domain\Cart\Services\PricingService::SAMPLE_MAX_QUANTITY;
            $otherSamples = (int) $cart->items()
                ->where('is_sample', true)
                ->where('id', '!=', $item->id)
                ->sum('quantity');
            $allowed = $max - $otherSamples;
            if ($validated['quantity'] > $allowed) {
                return response()->json([
                    'success' => false,
                    'message' => "Maximum {$max} samples per order. You can have up to {$allowed} on this line.",
                    'error_code' => 'sample_limit_exceeded',
                ], 422);
            }
        }

        $success = $this->cartService->updateItemQuantity($item, $validated['quantity']);

        if (!$success) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }

        // Clear upsell cache since cart changed
        $this->upsellService->clearCache($cart);

        // Reload cart with fresh data
        $cart = $cart->fresh(['items.product', 'items.variant']);
        $totals = $this->pricingService->computeTotals($cart);

        return response()->json([
            'success' => true,
            'totals' => $totals,
        ]);
    }

    public function remove(Request $request, int $itemId): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if (!$cart) {
            return response()->json(['error' => 'Cart not found'], 404);
        }

        $item = $cart->items()->find($itemId);

        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        $this->cartService->removeItem($item);

        // Clear upsell cache since cart changed
        $this->upsellService->clearCache($cart);

        // Reload cart with fresh data
        $cart = $cart->fresh(['items.product', 'items.variant']);
        $totals = $this->pricingService->computeTotals($cart);

        return response()->json([
            'success' => true,
            'totals' => $totals,
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if ($cart) {
            $this->upsellService->clearCache($cart);
            $this->cartService->clearCart($cart);
        }

        return response()->json([
            'success' => true,
            'totals' => [
                'subtotal' => 0,
                'discount' => 0,
                'shipping' => 0,
                'sample_shipping' => 0,
                'tax' => 0,
                'grand_total' => 0,
                'item_count' => 0,
                'sample_count' => 0,
                'sample_max' => 5,
                'samples_remaining' => 5,
                'is_at_sample_max' => false,
                'sample_minimum_met' => true,
                'currency' => Setting::getValue('marketplace.currency', 'AUD'),
                'currency_symbol' => Setting::getValue('marketplace.currency_symbol', '$'),
            ],
        ]);
    }

    /**
     * Buy Now: Add item to cart and return success for redirect to checkout.
     */
    public function buyNow(AddToCartRequest $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getOrCreate($userId, $sessionId);

        $this->cartService->addItem(
            $cart,
            $request->input('product_id'),
            $request->input('variant_id'),
            $request->input('quantity', 1),
            $request->input('options', []),
            (bool) $request->input('is_sample', false)
        );

        // Clear upsell cache since cart changed
        $this->upsellService->clearCache($cart);

        return response()->json([
            'success' => true,
            'redirect' => '/checkout',
        ]);
    }
}
