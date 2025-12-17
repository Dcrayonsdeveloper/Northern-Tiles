<?php

namespace App\Http\Controllers\Api;

use App\Domain\Cart\Http\Requests\AddToCartRequest;
use App\Domain\Cart\Services\CartService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    public function count(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        return response()->json([
            'count' => $this->cartService->getCount($userId, $sessionId),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if (!$cart) {
            return response()->json([
                'items' => [],
                'subtotal' => 0,
                'count' => 0,
            ]);
        }

        $cart->load(['items.product', 'items.variant']);

        return response()->json([
            'items' => $cart->items,
            'subtotal' => $cart->getSubtotal(),
            'count' => $cart->getItemCount(),
        ]);
    }

    public function add(AddToCartRequest $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getOrCreate($userId, $sessionId);

        $item = $this->cartService->addItem(
            $cart,
            $request->input('product_id'),
            $request->input('variant_id'),
            $request->input('quantity', 1),
            $request->input('options', [])
        );

        return response()->json([
            'success' => true,
            'item' => $item->load(['product', 'variant']),
            'count' => $cart->getItemCount(),
            'subtotal' => $cart->getSubtotal(),
        ]);
    }

    public function update(Request $request, int $itemId): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0|max:100',
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

        $success = $this->cartService->updateItemQuantity($item, $validated['quantity']);

        if (!$success) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }

        return response()->json([
            'success' => true,
            'count' => $cart->fresh()->getItemCount(),
            'subtotal' => $cart->fresh()->getSubtotal(),
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

        return response()->json([
            'success' => true,
            'count' => $cart->fresh()->getItemCount(),
            'subtotal' => $cart->fresh()->getSubtotal(),
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if ($cart) {
            $this->cartService->clearCart($cart);
        }

        return response()->json([
            'success' => true,
            'count' => 0,
            'subtotal' => 0,
        ]);
    }
}
