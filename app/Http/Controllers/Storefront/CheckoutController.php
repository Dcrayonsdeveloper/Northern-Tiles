<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function create(Request $request): Response
    {
        $cart = $request->session()->get('cart', []);

        if (count($cart) === 0) {
            return Inertia::render('Storefront/Checkout/Index', [
                'items' => [],
                'subtotal' => 0,
            ]);
        }

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

        return Inertia::render('Storefront/Checkout/Index', [
            'items' => $items,
            'subtotal' => $subtotal,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $cart = $request->session()->get('cart', []);

        if (count($cart) === 0) {
            return Redirect::route('cart.index');
        }

        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $productIds = array_keys($cart);
        $products = Product::query()
            ->whereIn('id', $productIds)
            ->where('is_active', true)
            ->get(['id', 'name', 'price']);

        return DB::transaction(function () use ($request, $validated, $cart, $products) {
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
            $tax = 0;
            $total = $subtotal + $tax;

            $order = Order::create([
                'user_id' => $request->user()?->id,
                'status' => 'pending',
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'customer_phone' => $validated['customer_phone'] ?? null,
                'currency' => 'INR',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($items as $item) {
                /** @var Product $product */
                $product = $item['product'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $item['quantity'],
                    'line_total' => $item['line_total'],
                ]);
            }

            $request->session()->forget('cart');

            return Redirect::route('home')->with('success', 'Order placed successfully.');
        });
    }
}
