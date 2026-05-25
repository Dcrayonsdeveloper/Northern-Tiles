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
            'items:id,order_id,product_id,name,price,quantity,line_total',
            'items.product:id,name,slug',
        ]);

        return Inertia::render('Admin/Orders/Show', [
            'order' => $order,
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
