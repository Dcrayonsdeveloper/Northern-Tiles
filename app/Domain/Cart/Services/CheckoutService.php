<?php

namespace App\Domain\Cart\Services;

use App\Domain\Payment\Services\StripePaymentService;

use App\Domain\Cart\Models\Cart;
use App\Domain\Catalog\Services\ProductUnitResolver;
use App\Domain\Marketing\Services\CouponService;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService,
        protected PricingService $pricingService,
        protected CouponService $couponService,
        protected ProductUnitResolver $unitResolver,
        protected StripePaymentService $stripe
    ) {}

    /**
     * Process checkout and create order.
     * Server recalculates all totals - never trust client.
     */
    public function processCheckout(Cart $cart, array $data): Order
    {
        // Eager-load relationships once so all downstream code uses cached data
        $cart->load(['items.product', 'items.variant']);

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
                // Kept so the webhook can find this cart later: it arrives
                // from Stripe with no session and no cookie, so for a guest
                // there is otherwise nothing to match on.
                'cart_id' => $cart->id,
                // Trade flag comes from the CART'S CHANNEL, not the user role.
                // Before the split this was derived from ->isBuilder(), which
                // meant a builder buying from the retail storefront had the
                // order flagged as trade — the reverse of what the invoicing
                // team expected. Cart channel is the ground truth: 'trade' cart
                // → trade order, 'retail' cart → retail order, always.
                'is_builder_order' => $cart->channel === \App\Domain\Cart\Models\Cart::CHANNEL_TRADE,
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
                // The zone this order was priced at, so the charge can be explained
                // later even if the rate card changes.
                'shipping_method' => \App\Domain\Cart\Services\PricingService::zoneForPostcode(
                    $data['shipping_address']['postal_code'] ?? null,
                    $data['shipping_address']['state'] ?? null,
                    $data['shipping_address']['city'] ?? null
                )['key'],
                'payment_method' => $data['payment_method'] ?? 'online',
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
                    'line_total' => $item->price * $item->quantity,
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

            // Record coupon usage and increment times_used counter
            if ($cart->coupon_id) {
                $this->couponService->recordUsage($cart, $order->id);
            }

            // Mark cart as recovered if it was abandoned
            if ($cart->isAbandoned()) {
                $cart->markAsRecovered($order->id);
            }

            // A card order is not paid yet -- the customer is about to be sent
            // to Stripe. Emptying the cart here meant anyone who reached the
            // payment screen and came back without paying returned to nothing,
            // with no way to recover what they had chosen. The cart is cleared
            // when the payment actually succeeds instead, in
            // StripePaymentService::markPaid(). Orders settled out of band --
            // trade on invoice -- have no payment step to wait for, so they
            // still clear here.
            if (($data['payment_method'] ?? null) !== self::PAYMENT_CARD) {
                $cart->clear();
            }

            return $order;
        });
    }

    /**
     * Validate checkout data. $channel is kept in the signature for future
     * per-channel gates (e.g. reintroducing invoice / net-30 for trade), but
     * today retail and trade accept the same payment methods and same fields.
     */
    public function validateCheckoutData(array $data, bool $isGuest, string $channel = 'retail'): array
    {
        // Deliveries are Australian only and the state comes from a fixed list,
        // so both are enforced here rather than trusted from the form. The city
        // The city is chosen from a list per state, so it cannot come back as
        // four spellings of the same place the way a free-text box allowed.
        $rules = [
            'contact.email' => 'required|email|max:255',
            'contact.phone' => 'nullable|string|max:20',
            'contact.name' => 'nullable|string|max:255',
            'shipping_address.name' => 'required|string|max:255',
            'shipping_address.address_line_1' => 'required|string|max:255',
            'shipping_address.address_line_2' => 'nullable|string|max:255',
            'shipping_address.city' => 'required|string|max:100',
            'shipping_address.state' => 'required|string|in:ACT,NSW,NT,QLD,SA,TAS,VIC,WA',
            'shipping_address.postal_code' => 'required|string|max:20',
            'shipping_address.country' => 'required|string|in:Australia',
            'shipping_address.phone' => 'nullable|string|max:20',
            // No longer chosen by the customer -- the delivery postcode decides it.
            // Left nullable so a stale open tab posting the old field still checks out.
            'shipping_method' => 'nullable|string|max:50',
            // 'online' stays accepted so a stale open tab, which posted that
            // before card existed, still checks out.
            'payment_method' => 'required|string|in:card,online',
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
                'billing_address.state' => 'required|string|in:ACT,NSW,NT,QLD,SA,TAS,VIC,WA',
                'billing_address.postal_code' => 'required|string|max:20',
                'billing_address.country' => 'required|string|in:Australia',
            ]);
        }

        return $rules;
    }

    /**
     * The delivery rate card shown at checkout.
     *
     * Comes straight from PricingService so the figure on screen is the same
     * one the order is charged at.
     */
    public function getShippingZones(): array
    {
        return \App\Domain\Cart\Services\PricingService::shippingZones();
    }

    /**
     * Get available payment methods.
     */
    public function getPaymentMethods(): array
    {
        // Card first, and only when Stripe can actually take it. This used to
        // return one hardcoded "Pay Online ... through PayPal" option -- a
        // gateway this application has never integrated -- regardless of
        // whether Stripe was configured. So the only method a customer could
        // choose led nowhere, and the working Stripe flow was never offered.
        if ($this->stripe->isEnabled()) {
            return [
                [
                    'id' => self::PAYMENT_CARD,
                    'name' => 'Pay Online',
                    // Still says card, because that is what the Stripe page
                    // leads with -- but the heading no longer promises only
                    // cards, so Link and the wallets that appear there are not
                    // a surprise.
                    'description' => 'Pay securely by card on the next step.',
                    'icon' => 'card',
                ],
            ];
        }

        // Stripe off: the order is still placed, and someone follows it up.
        // Better than offering a card form that cannot charge anything.
        return [
            [
                'id' => self::PAYMENT_OFFLINE,
                'name' => 'Pay on invoice',
                'description' => 'We will contact you to arrange payment.',
                'icon' => 'invoice',
            ],
        ];
    }

    /** Routed to Stripe after the order is created. */
    public const PAYMENT_CARD = 'card';

    /** Order is placed and payment arranged out of band. */
    public const PAYMENT_OFFLINE = 'online';

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
            $isSoldPerSqm = $this->unitResolver->isSoldPerSquareMetre($item->product);
            
            return [
                'id' => $item->id,
                'name' => $item->variant?->name ?? $item->product->name,
                'quantity' => $item->quantity,
                'price' => $item->price,
                'line_total' => $item->price * $item->quantity,
                'is_sample' => (bool) $item->is_sample,
                'is_sold_per_sqm' => $isSoldPerSqm,
                'image_url' => $item->product->image_url ?? '/images/placeholder-product.svg',
                'options' => $item->options_json,
            ];
        });

        $totals = $this->pricingService->computeTotals($cart, $shippingData);
        $shippingZones = $this->getShippingZones();
        $paymentMethods = $this->getPaymentMethods();

        return [
            'items' => $items,
            'totals' => $totals,
            'shipping_zones' => $shippingZones,
            'payment_methods' => $paymentMethods,
        ];
    }
}
