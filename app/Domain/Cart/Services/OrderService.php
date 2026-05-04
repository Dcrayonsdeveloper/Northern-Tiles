<?php

namespace App\Domain\Cart\Services;

use App\Domain\Cart\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        protected CartService $cartService
    ) {}

    public function createFromCart(Cart $cart, array $shippingData, array $billingData = [], ?string $paymentMethod = null): Order
    {
        $errors = $this->cartService->validateCart($cart);
        if (!empty($errors)) {
            throw new \InvalidArgumentException(implode(', ', $errors));
        }

        $subtotal = $cart->getSubtotal();
        $tax = $this->calculateTax($subtotal, $shippingData);
        $shippingCost = $this->calculateShipping($cart, $shippingData);
        $total = $subtotal + $tax + $shippingCost;

        $order = Order::create([
            'user_id' => $cart->user_id,
            'order_number' => $this->generateOrderNumber(),
            'status' => 'pending',
            'subtotal' => $subtotal,
            'tax' => $tax,
            'shipping_cost' => $shippingCost,
            'discount' => 0,
            'total' => $total,
            'currency' => $cart->currency,
            'shipping_address_json' => $shippingData,
            'billing_address_json' => $billingData ?: $shippingData,
            'payment_method' => $paymentMethod,
            'payment_status' => 'pending',
        ]);

        foreach ($cart->items as $item) {
            $sellerId = $item->product->seller_id;

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'seller_id' => $sellerId,
                'name' => $item->variant?->name ?? $item->product->name,
                'sku' => $item->variant?->sku ?? $item->product->sku,
                'quantity' => $item->quantity,
                'price' => $item->price,
                'tax' => 0,
                'options_json' => $item->options_json,
            ]);

            // Inventory is tracked as integer units; round up so a 2.20 m²
            // sale doesn't reserve only 2 units and leave 0.20 dangling.
            $stockUnits = (int) ceil((float) $item->quantity);
            if ($item->variant) {
                $item->variant->decrementInventory($stockUnits);
            } else {
                $item->product->decrement('inventory_quantity', $stockUnits);
            }
        }

        $cart->clear();

        return $order;
    }

    public function updateStatus(Order $order, string $status): Order
    {
        $oldStatus = $order->status;

        $order->update(['status' => $status]);

        if ($status === 'shipped') {
            $order->update(['shipped_at' => now()]);
        } elseif ($status === 'delivered') {
            $order->update(['delivered_at' => now()]);
        }

        event(new \App\Domain\Cart\Events\OrderStatusChanged($order, $oldStatus, $status));

        return $order;
    }

    public function getOrders(?int $userId = null, ?int $sellerId = null, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Order::with(['items', 'user']);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($sellerId) {
            $query->whereHas('items', function ($q) use ($sellerId) {
                $q->where('seller_id', $sellerId);
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (!empty($filters['from_date'])) {
            $query->where('created_at', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->where('created_at', '<=', $filters['to_date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function getOrder(int $id, ?int $userId = null, ?int $sellerId = null): ?Order
    {
        $query = Order::with(['items.product', 'items.variant', 'user']);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($sellerId) {
            $query->whereHas('items', function ($q) use ($sellerId) {
                $q->where('seller_id', $sellerId);
            });
        }

        return $query->find($id);
    }

    public function cancelOrder(Order $order): Order
    {
        if (!in_array($order->status, ['pending', 'processing'])) {
            throw new \InvalidArgumentException('Order cannot be cancelled');
        }

        foreach ($order->items as $item) {
            $stockUnits = (int) ceil((float) $item->quantity);
            if ($item->variant) {
                $item->variant->incrementInventory($stockUnits);
            } elseif ($item->product) {
                $item->product->increment('inventory_quantity', $stockUnits);
            }
        }

        return $this->updateStatus($order, 'cancelled');
    }

    protected function generateOrderNumber(): string
    {
        do {
            $number = 'ORD-' . strtoupper(Str::random(8));
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }

    protected function calculateTax(float $subtotal, array $shippingData): float
    {
        return 0;
    }

    protected function calculateShipping(Cart $cart, array $shippingData): float
    {
        return 0;
    }
}
