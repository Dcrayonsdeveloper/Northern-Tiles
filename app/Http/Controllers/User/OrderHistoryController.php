<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderHistoryController extends Controller
{
    /**
     * List the authenticated user's own orders, newest first.
     *
     * Security: the WHERE clause is always locked to auth()->id(), so a user
     * can never read another user's orders — there is no route parameter to
     * manipulate and no admin/seller bypass.  The auth middleware on the route
     * guarantees auth()->id() is non-null before this method runs.
     */
    public function index(): Response
    {
        $orders = Order::query()
            ->where('user_id', auth()->id())
            ->with(['items:id,order_id,name,quantity,line_total'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($order) => [
                'id'             => $order->id,
                'order_number'   => $order->order_number,
                'status'         => $order->status,
                'payment_status' => $order->payment_status,
                'currency'       => $order->currency ?? 'AUD',
                'total'          => (float) $order->total,
                'item_count'     => $order->items->count(),
                'created_at'     => $order->created_at->format('M d, Y'),
                // First 3 items shown as a preview inside the card.
                // The full items list is not needed on the index page.
                'items_preview'  => $order->items
                    ->take(3)
                    ->map(fn ($i) => [
                        'name'     => $i->name,
                        'quantity' => (int) $i->quantity,
                    ])
                    ->values()
                    ->all(),
            ]);

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function show(Order $order): Response
    {
        abort_if($order->user_id !== auth()->id(), 403);

        $order->load([
            'items.product:id,name,slug,image_url,sqm_per_box',
            'items.variant:id,name,sku',
        ]);

        return Inertia::render('Orders/Show', [
            'canCancel' => false, // enable when cancel route is implemented
            'order' => [
                'id'             => $order->id,
                'order_number'   => $order->order_number,
                'status'         => $order->status,
                'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method,
                'shipping_method'=> $order->shipping_method,
                'currency'       => $order->currency ?? 'AUD',
                'subtotal'       => (float) $order->subtotal,
                'tax'            => (float) $order->tax,
                'shipping_cost'  => (float) $order->shipping_cost,
                'discount'       => (float) $order->discount,
                'total'          => (float) $order->total,
                'shipping_address' => $order->shipping_address,
                'billing_address'  => $order->billing_address,
                'notes'          => $order->notes,
                'created_at'     => $order->created_at->format('M d, Y'),
                'created_time'   => $order->created_at->format('h:i A'),
                'items'          => $order->items->map(fn ($item) => [
                    'id'        => $item->id,
                    'name'      => $item->name,
                    'sku'       => $item->sku,
                    'quantity'  => (float) $item->quantity,
                    'price'     => (float) $item->price,
                    'line_total'=> (float) $item->line_total,
                    'is_sample' => (bool)  $item->is_sample,
                    'options'   => $item->options_json,
                    'product'   => $item->product ? [
                        'id'         => $item->product->id,
                        'name'       => $item->product->name,
                        'slug'       => $item->product->slug,
                        'image_url'  => $item->product->image_url ?? '/images/placeholder-product.svg',
                        'sqm_per_box'=> $item->product->sqm_per_box,
                    ] : null,
                    'variant'   => $item->variant ? [
                        'id'   => $item->variant->id,
                        'name' => $item->variant->name,
                        'sku'  => $item->variant->sku,
                    ] : null,
                ])->values()->all(),
            ],
        ]);
    }
}
