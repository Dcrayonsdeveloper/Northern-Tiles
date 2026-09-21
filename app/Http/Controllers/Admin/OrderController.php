<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $orders = Order::query()
            ->with(['user:id,name,email'])
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function show(Order $order): Response
    {
        $order->loadMissing([
            'user:id,name,email',
            'items:id,order_id,product_id,name,sku,price,quantity,line_total,is_sample',
            'items.product:id,name,slug,image_url',
            'items.product.media',
        ]);

        // A thumbnail per line, skipping media rows whose file was never
        // synced — the same guard the storefront listings use.
        $order->items->each(function ($item) {
            $product = $item->product;
            $image = $product?->image_url;

            if ($product?->relationLoaded('media')) {
                $primary = $product->media
                    ->where('type', 'image')
                    ->sortByDesc('is_primary')
                    ->first(fn ($m) => $m->fileExists());

                if ($primary) {
                    $image = $primary->url;
                }
                $product->unsetRelation('media');
            }

            $item->setAttribute('image_url', $image);
        });

        return Inertia::render('Admin/Orders/Show', [
            'order' => $order,
            'statuses' => ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
            'paymentStatuses' => ['pending', 'paid', 'failed', 'refunded'],
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', Rule::in(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])],
            'payment_status' => ['nullable', Rule::in(['pending', 'paid', 'failed', 'refunded'])],
        ]);

        try {
            $updates = [];

            if (!empty($validated['status'])) {
                $updates['status'] = $validated['status'];

                // Stamp the milestone the first time it is reached. The
                // tracking timeline reads these, and nothing was setting them
                // — an order could sit at "shipped" with no shipped date.
                if ($validated['status'] === 'shipped' && ! $order->shipped_at) {
                    $updates['shipped_at'] = now();
                }

                if ($validated['status'] === 'delivered') {
                    $updates['delivered_at'] = $order->delivered_at ?? now();
                    // Delivered implies it shipped, even if that step was skipped.
                    $updates['shipped_at'] = $order->shipped_at ?? now();
                }
            }

            if (!empty($validated['payment_status'])) {
                $updates['payment_status'] = $validated['payment_status'];
            }

            if (!empty($updates)) {
                $order->update($updates);
            }
        } catch (\Exception $e) {
            \Log::error('Order update failed: ' . $e->getMessage(), [
                'order_id' => $order->id,
                'data' => $validated,
            ]);
            return redirect()->route('admin.orders.show', $order->id)
                ->withErrors(['update' => 'Failed to update order. Please try again.']);
        }

        return redirect()->route('admin.orders.show', $order->id);
    }
}
