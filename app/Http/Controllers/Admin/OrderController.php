<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        // Abandoned card checkouts never appear here. They are listed on
        // Marketing > Abandoned Carts, which is where a checkout nobody
        // finished actually belongs -- an order list is for work to action.
        // Website orders by default; trade is a separate book with its own
        // pricing and its own screen, and mixing the two made it impossible to
        // scan either. 'builder' switches the list over rather than adding to
        // it, which is what the toggle in the header reads as.
        $source = $request->input('source') === 'builder' ? 'builder' : 'website';

        $orders = Order::query()
            ->with(['user:id,name,email'])
            ->excludingAbandonedCheckouts()
            ->where('is_builder_order', $source === 'builder')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $countFor = fn (bool $builder) => Order::query()
            ->excludingAbandonedCheckouts()
            ->where('is_builder_order', $builder)
            ->count();

        // Whether a note exists, not the note itself — the list only needs to
        // show an icon, and staff remarks do not belong in a page payload that
        // wide.
        $orders->getCollection()->each(function ($order) {
            $order->setAttribute('has_admin_note', filled($order->admin_note));
            $order->makeHidden('admin_note');
            // Delivery left to quote is not in the total, so the list flags
            // it until the customer has paid for it.
            $order->setAttribute('delivery_quote_status', $order->deliveryQuoteStatus());
        });

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'source' => $source,
            'sourceCounts' => [
                'website' => $countFor(false),
                'builder' => $countFor(true),
            ],
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

        $order->setAttribute('delivery_label', $order->deliveryLabel());
        $order->setAttribute('delivery_quote_status', $order->deliveryQuoteStatus());

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
            // Staff-only. Separate from orders.notes, which is the customer's.
            'admin_note' => ['nullable', 'string', 'max:2000'],
            // The delivery checkout left to quote, and whether the customer
            // has paid it. Neither touches `total`: that is what the card was
            // charged, and Stripe reconciles against it.
            'delivery_quote' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'delivery_quote_paid' => ['nullable', 'boolean'],
        ]);

        $quote = array_key_exists('delivery_quote', $validated)
            ? $validated['delivery_quote']
            : $order->delivery_quote;

        if (($validated['delivery_quote_paid'] ?? false) && $quote === null) {
            throw ValidationException::withMessages([
                'delivery_quote' => 'Enter the quoted amount before marking delivery as paid.',
            ]);
        }

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

            // array_key_exists, not empty(): clearing the box has to be able to
            // erase the note, and "" is empty.
            if (array_key_exists('admin_note', $validated)) {
                $updates['admin_note'] = $validated['admin_note'] ?: null;
            }

            // Only an order whose delivery was left to quote has one to record.
            if ($order->isDeliveryQuoted()) {
                if (array_key_exists('delivery_quote', $validated)) {
                    $updates['delivery_quote'] = $validated['delivery_quote'];
                }

                if (array_key_exists('delivery_quote_paid', $validated)) {
                    // Keep the first paid date when the box is saved again.
                    $updates['delivery_quote_paid_at'] = $validated['delivery_quote_paid']
                        ? ($order->delivery_quote_paid_at ?? now())
                        : null;
                }
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

    /**
     * Display a printable receipt for the order.
     */
    public function receipt(Order $order)
    {
        $order->loadMissing([
            'user:id,name,email',
            'items:id,order_id,product_id,name,sku,price,quantity,line_total,is_sample',
        ]);

        return view('admin.orders.receipt', [
            'order' => $order,
        ]);
    }
}
