<?php

namespace App\Domain\Cart\Services;

use App\Domain\Cart\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService,
        protected PricingService $pricingService
    ) {}

    /**
     * Process checkout and create order.
     * Server recalculates all totals - never trust client.
     */
    public function processCheckout(Cart $cart, array $data): Order
    {
        // Validate cart has items
        if ($cart->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => ['Your cart is empty.'],
            ]);
        }

        // Validate cart items (stock, availability)
        $errors = $this->cartService->validateCart($cart);
        if (!empty($errors)) {
            throw ValidationException::withMessages([
                'cart' => $errors,
            ]);
        }

        // Authoritative sample-minimum validation — never trust the frontend
        $sampleValidation = $this->pricingService->getSampleValidation($cart);
        if (! $sampleValidation['is_valid']) {
            throw ValidationException::withMessages([
                'cart' => [$sampleValidation['message']],
            ]);
        }

        // Server-authoritative totals calculation
        $totals = $this->pricingService->computeTotals($cart, $data['shipping_address'] ?? []);

        return DB::transaction(function () use ($cart, $data, $totals) {
            // Create order
            $order = Order::create([
                'user_id' => $cart->user_id,
                'order_number' => $this->generateOrderNumber(),
                'status' => 'pending',
                'customer_name' => $data['contact']['name'] ?? null,
                'customer_email' => $data['contact']['email'],
                'customer_phone' => $data['contact']['phone'] ?? null,
                'currency' => $totals['currency'],
                'subtotal' => $totals['subtotal'],
                'tax' => $totals['tax'],
                'shipping_cost' => $totals['shipping'],
                'discount' => $totals['discount'],
                'total' => $totals['grand_total'],
                'shipping_address' => $data['shipping_address'] ?? null,
                'billing_address' => $data['billing_address'] ?? $data['shipping_address'] ?? null,
                'shipping_method' => $data['shipping_method'] ?? 'standard',
                'payment_method' => $data['payment_method'] ?? 'cod',
                'payment_status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);

            // Create order items and decrement inventory
            foreach ($cart->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'seller_id' => $item->product->seller_id ?? null,
                    'name' => $item->variant?->name ?? $item->product->name,
                    'sku' => $item->variant?->sku ?? $item->product->sku ?? null,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'tax' => 0, // Tax is calculated at order level
                    'options_json' => $item->options_json,
                    'is_sample' => (bool) $item->is_sample,
                ]);

                // Samples don't reduce real inventory
                if (! $item->is_sample) {
                    $this->decrementInventory($item);
                }
            }

            // Update cart email if guest checkout
            if (!$cart->user_id && !empty($data['contact']['email'])) {
                $cart->setEmail(
                    $data['contact']['email'],
                    $data['contact']['marketing_opt_in'] ?? false
                );
            }

            // Mark cart as recovered if it was abandoned
            if ($cart->isAbandoned()) {
                $cart->markAsRecovered($order->id);
            }

            // Clear the cart
            $cart->clear();

            return $order;
        });
    }

    /**
     * Validate checkout data.
     */
    public function validateCheckoutData(array $data, bool $isGuest): array
    {
        $rules = [
            'contact.email' => 'required|email|max:255',
            'contact.phone' => 'nullable|string|max:20',
            'contact.name' => 'nullable|string|max:255',
            'shipping_address.name' => 'required|string|max:255',
            'shipping_address.address_line_1' => 'required|string|max:255',
            'shipping_address.address_line_2' => 'nullable|string|max:255',
            'shipping_address.city' => 'required|string|max:100',
            'shipping_address.state' => 'required|string|max:100',
            'shipping_address.postal_code' => 'required|string|max:20',
            'shipping_address.country' => 'required|string|max:100',
            'shipping_address.phone' => 'nullable|string|max:20',
            'shipping_method' => 'required|string|in:standard,express',
            'payment_method' => 'required|string|in:cod,upi,card',
            'billing_same_as_shipping' => 'boolean',
            'notes' => 'nullable|string|max:500',
        ];

        // If billing is different from shipping
        if (!($data['billing_same_as_shipping'] ?? true)) {
            $rules = array_merge($rules, [
                'billing_address.name' => 'required|string|max:255',
                'billing_address.address_line_1' => 'required|string|max:255',
                'billing_address.address_line_2' => 'nullable|string|max:255',
                'billing_address.city' => 'required|string|max:100',
                'billing_address.state' => 'required|string|max:100',
                'billing_address.postal_code' => 'required|string|max:20',
                'billing_address.country' => 'required|string|max:100',
            ]);
        }

        return $rules;
    }

    /**
     * Get available shipping methods.
     */
    public function getShippingMethods(Cart $cart): array
    {
        $subtotal = $cart->getSubtotal();

        return [
            [
                'id' => 'standard',
                'name' => 'Standard Shipping',
                'description' => '5-7 business days',
                'price' => $subtotal >= 999 ? 0 : 50,
                'estimated_days' => '5-7',
            ],
            [
                'id' => 'express',
                'name' => 'Express Shipping',
                'description' => '2-3 business days',
                'price' => 150,
                'estimated_days' => '2-3',
            ],
        ];
    }

    /**
     * Get available payment methods.
     */
    public function getPaymentMethods(): array
    {
        return [
            [
                'id' => 'cod',
                'name' => 'Cash on Delivery',
                'description' => 'Pay when you receive your order',
                'icon' => 'cash',
            ],
            [
                'id' => 'upi',
                'name' => 'UPI',
                'description' => 'Pay via UPI apps like GPay, PhonePe',
                'icon' => 'upi',
            ],
            [
                'id' => 'card',
                'name' => 'Credit/Debit Card',
                'description' => 'Pay securely with your card',
                'icon' => 'card',
            ],
        ];
    }

    /**
     * Generate unique order number.
     */
    protected function generateOrderNumber(): string
    {
        do {
            $number = 'JKR-' . strtoupper(Str::random(8));
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }

    /**
     * Decrement product/variant inventory.
     */
    protected function decrementInventory($item): void
    {
        // Inventory is tracked as integer units; round up so a 2.20 m² sale
        // doesn't reserve only 2 units and leave 0.20 dangling.
        $stockUnits = (int) ceil((float) $item->quantity);

        if ($item->variant) {
            // Variant inventory
            if (method_exists($item->variant, 'decrementInventory')) {
                $item->variant->decrementInventory($stockUnits);
            }
        } elseif ($item->product && isset($item->product->inventory_quantity)) {
            // Product inventory
            $item->product->decrement('inventory_quantity', $stockUnits);
        }
    }

    /**
     * Get checkout summary for display.
     */
    public function getCheckoutSummary(Cart $cart, array $shippingData = []): array
    {
        $cart->load(['items.product', 'items.variant']);

        $items = $cart->items->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->variant?->name ?? $item->product->name,
                'quantity' => $item->quantity,
                'price' => $item->price,
                'line_total' => $item->price * $item->quantity,
                'is_sample' => (bool) $item->is_sample,
                'image_url' => $item->product->image_url ?? '/images/placeholder-product.svg',
            ];
        });

        $totals = $this->pricingService->computeTotals($cart, $shippingData);
        $shippingMethods = $this->getShippingMethods($cart);
        $paymentMethods = $this->getPaymentMethods();

        return [
            'items' => $items,
            'totals' => $totals,
            'shipping_methods' => $shippingMethods,
            'payment_methods' => $paymentMethods,
        ];
    }
}
