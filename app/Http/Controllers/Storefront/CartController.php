<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Cart\Services\CartService;
use App\Domain\Cart\Services\PricingService;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected PricingService $pricingService
    ) {}

    public function index(Request $request): Response
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        $items = [];
        $subtotal = 0;

        if ($cart) {
            $cart->load(['items.product', 'items.variant']);

            $items = $cart->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product' => $item->product,
                    'variant' => $item->variant,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'line_total' => $item->price * $item->quantity,
                ];
            })->values();

            $totals = $this->pricingService->computeTotals($cart);
            $subtotal = $totals['subtotal'];
        }

        return Inertia::render('Storefront/Cart/Index', [
            'items' => $items,
            'subtotal' => $subtotal,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
        ]);

        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getOrCreate($userId, $sessionId);

        $this->cartService->addItem(
            $cart,
            $validated['product_id'],
            $validated['variant_id'] ?? null,
            $validated['quantity'] ?? 1
        );

        return Redirect::back()->with('success', 'Added to cart.');
    }

    public function update(Request $request, int $itemId): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if ($cart) {
            $item = $cart->items()->find($itemId);
            if ($item) {
                $this->cartService->updateItemQuantity($item, $validated['quantity']);
            }
        }

        return Redirect::back();
    }

    public function destroy(Request $request, int $itemId): RedirectResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if ($cart) {
            $item = $cart->items()->find($itemId);
            if ($item) {
                $this->cartService->removeItem($item);
            }
        }

        return Redirect::back();
    }
}
