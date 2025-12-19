<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(Request $request): Response
    {
        $cart = $request->session()->get('cart', []);
        $productIds = array_keys($cart);

        $products = Product::query()
            ->whereIn('id', $productIds)
            ->where('is_active', true)
            ->get(['id', 'name', 'slug', 'price', 'image_url', 'stock']);

        $items = $products->map(function (Product $product) use ($cart) {
            $qty = (int) ($cart[$product->id] ?? 0);
            $lineTotal = (float) $product->price * $qty;

            return [
                'product' => $product,
                'quantity' => $qty,
                'line_total' => round($lineTotal, 2),
            ];
        })->values();

        $subtotal = round($items->sum('line_total'), 2);

        return Inertia::render('Storefront/Cart/Index', [
            'items' => $items,
            'subtotal' => $subtotal,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
        ]);

        $productId = (int) $validated['product_id'];
        $quantity = (int) ($validated['quantity'] ?? 1);

        $cart = $request->session()->get('cart', []);
        $cart[$productId] = (int) ($cart[$productId] ?? 0) + $quantity;

        $request->session()->put('cart', $cart);

        return Redirect::back()->with('success', 'Added to cart.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $cart = $request->session()->get('cart', []);
        $cart[$product->id] = (int) $validated['quantity'];
        $request->session()->put('cart', $cart);

        return Redirect::back();
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $cart = $request->session()->get('cart', []);
        unset($cart[$product->id]);
        $request->session()->put('cart', $cart);

        return Redirect::back();
    }
}
