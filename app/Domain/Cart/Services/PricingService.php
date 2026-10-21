<?php

namespace App\Domain\Cart\Services;

use App\Domain\Cart\Models\Cart;
use App\Domain\Marketing\Models\Coupon;
use App\Models\Setting;

class PricingService
{
    /** Maximum samples allowed per order — hard cap, not a target. */
    public const SAMPLE_MAX_QUANTITY = 5;

    /**
     * Flat shipping charge for a samples-only order, regardless of how many
     * samples (1–5). The default only: staff can change it under Admin >
     * Shipping Rates (ShippingRates::sampleRate()).
     */
    public const SAMPLE_SHIPPING_FLAT = 20.00;

    /**
     * Compute all totals for a cart (server-authoritative).
     * Never trust client totals - always recalculate on server.
     */
    public const SHIPPING_STANDARD = 'standard';
    public const SHIPPING_EXPRESS = 'express';

    /**
     * How an order's delivery was priced. Stored on orders.shipping_method.
     *
     * Samples on their own go out for a flat fee. Anything else is charged the
     * rate staff have set for the state it is going to. Where a state has no
     * rate, the team quotes delivery once the order is in and collects it
     * separately, so checkout charges nothing for it. A free-shipping coupon
     * settles it upfront either way.
     */
    public const DELIVERY_SAMPLE_FLAT = 'sample-flat';
    public const DELIVERY_STATE_RATE = 'state-rate';
    public const DELIVERY_QUOTE = 'delivery-quote';
    public const DELIVERY_FREE = 'free-shipping';

    public function computeTotals(Cart $cart, array $shippingData = [], ?string $shippingMethod = null): array
    {
        $subtotal = $this->calculateSubtotal($cart);
        $discount = $this->calculateDiscount($cart, $subtotal);

        // What is in the cart decides delivery, and for tiles the state it is
        // going to. $shippingMethod is ignored; it stays so existing callers
        // keep working unchanged.
        $state = $shippingData['state'] ?? null;
        $delivery = $this->deliveryFor($cart, $state);
        $shipping = $delivery['amount'];

        $taxableAmount = $subtotal - $discount;
        $tax = $this->calculateTax($taxableAmount, $shippingData);
        $grandTotal = $taxableAmount + $shipping + $tax;

        $currency = $cart->currency ?? Setting::getValue('marketplace.currency', 'AUD');

        $sampleCount = $this->getSampleCount($cart);
        $sampleMax = self::SAMPLE_MAX_QUANTITY;
        $samplesRemaining = max(0, $sampleMax - $sampleCount);
        $isAtSampleMax = $sampleCount >= $sampleMax;

        return [
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'shipping' => round($shipping, 2),
            'shipping_method' => $delivery['method'],
            // Delivery still to be quoted. `shipping` is then 0 because
            // nothing is charged for it at checkout -- not because it is free.
            'shipping_quote_required' => $delivery['method'] === self::DELIVERY_QUOTE,
            // Priced by state and no address given yet, as in the cart: the
            // 0 in `shipping` is a placeholder until checkout knows the state.
            'shipping_awaiting_state' => $delivery['method'] === self::DELIVERY_STATE_RATE && blank($state),
            'sample_shipping' => round($delivery['method'] === self::DELIVERY_SAMPLE_FLAT ? $shipping : 0, 2),
            'tax' => round($tax, 2),
            'grand_total' => round($grandTotal, 2),
            'item_count' => $cart->getItemCount(),
            'sample_count' => $sampleCount,
            'sample_max' => $sampleMax,
            'samples_remaining' => $samplesRemaining,
            'is_at_sample_max' => $isAtSampleMax,
            // Legacy field kept true for back-compat; no minimum applies anymore.
            'sample_minimum_met' => true,
            'currency' => $currency,
            'currency_symbol' => $this->getCurrencySymbol($currency),
        ];
    }

    /**
     * Calculate subtotal from cart items.
     * Samples contribute 0 since their stored price is 0.
     */
    protected function calculateSubtotal(Cart $cart): float
    {
        return $cart->items->sum(function ($item) {
            return $item->price * $item->quantity;
        });
    }

    /**
     * Count sample units in the cart.
     */
    protected function getSampleCount(Cart $cart): int
    {
        return (int) $cart->items
            ->filter(fn ($item) => (bool) $item->is_sample)
            ->sum('quantity');
    }

    /**
     * Calculate discount (coupon codes, automatic discounts, etc.).
     */
    protected function calculateDiscount(Cart $cart, float $subtotal): float
    {
        // Use coupon discount from cart if applied
        if ($cart->coupon_id && $cart->discount_amount > 0) {
            return (float) $cart->discount_amount;
        }

        return 0;
    }

    /**
     * How this cart's delivery is priced: one of the DELIVERY_* methods and
     * the amount charged for it at checkout.
     *
     * Samples travel free with anything else in the cart -- one delivery is
     * going out either way -- so the flat sample fee only applies to an order
     * of nothing but samples.
     */
    public function deliveryFor(Cart $cart, ?string $state = null): array
    {
        if ($cart->isEmpty()) {
            return ['method' => null, 'amount' => 0.0];
        }

        if (! $cart->items->contains(fn ($item) => ! $item->is_sample)) {
            return ['method' => self::DELIVERY_SAMPLE_FLAT, 'amount' => ShippingRates::sampleRate()];
        }

        // A free-shipping coupon is an offer the business chose to make, and
        // the coupon box has already told the customer it applies. Quoting
        // them for delivery afterwards would go back on that.
        if ($this->hasFreeShippingCoupon($cart)) {
            return ['method' => self::DELIVERY_FREE, 'amount' => 0.0];
        }

        $rates = ShippingRates::stateRates();
        $state = strtoupper(trim((string) $state));

        // Before there is an address the price depends on where it is going --
        // unless no state has a rate at all, in which case every delivery is
        // quoted and that can be said now.
        if ($state === '') {
            return array_filter($rates, fn ($rate) => $rate !== null) === []
                ? ['method' => self::DELIVERY_QUOTE, 'amount' => 0.0]
                : ['method' => self::DELIVERY_STATE_RATE, 'amount' => 0.0];
        }

        $rate = $rates[$state] ?? null;

        return $rate === null
            ? ['method' => self::DELIVERY_QUOTE, 'amount' => 0.0]
            : ['method' => self::DELIVERY_STATE_RATE, 'amount' => $rate];
    }

    protected function hasFreeShippingCoupon(Cart $cart): bool
    {
        if (! $cart->coupon_id) {
            return false;
        }

        $coupon = Coupon::find($cart->coupon_id);

        return $coupon !== null && $coupon->givesFreeShipping();
    }

    /**
     * Validate the cart's sample quantity. There is no minimum — any 1–5 samples
     * is fine. Only invalid state is exceeding the maximum (which the cart pipeline
     * enforces, so this is a final safety check).
     */
    public function getSampleValidation(Cart $cart): array
    {
        $sampleCount = $this->getSampleCount($cart);
        $max = self::SAMPLE_MAX_QUANTITY;

        $isValid = $sampleCount <= $max;
        $message = $isValid ? null : "Maximum {$max} samples per order. Please remove " . ($sampleCount - $max) . " sample(s) to continue.";

        return [
            'sample_count' => $sampleCount,
            'is_valid' => $isValid,
            'max' => $max,
            'remaining' => max(0, $max - $sampleCount),
            'message' => $message,
        ];
    }

    /**
     * Calculate tax based on location and cart contents.
     */
    protected function calculateTax(float $taxableAmount, array $shippingData): float
    {
        // Get tax rate (default 0 — AUD store, GST would go here)
        $taxRate = (float) Setting::getValue('tax.default_rate', 0);

        // TODO: Integrate with tax zones for location-based tax
        return $taxableAmount * ($taxRate / 100);
    }

    /**
     * Get currency symbol.
     */
    protected function getCurrencySymbol(string $currency): string
    {
        $symbols = [
            'AUD' => '$',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'INR' => '₹',
        ];

        // Use setting symbol if currency matches marketplace currency
        $marketplaceCurrency = Setting::getValue('marketplace.currency', 'AUD');
        if ($currency === $marketplaceCurrency) {
            return Setting::getValue('marketplace.currency_symbol', $symbols[$currency] ?? $currency);
        }

        return $symbols[$currency] ?? $currency;
    }

    /**
     * Format price for display.
     */
    public function formatPrice(float $amount, string $currency = 'AUD'): string
    {
        $symbol = $this->getCurrencySymbol($currency);
        return $symbol . number_format($amount, 2);
    }

    /**
     * Shipping summary for the cart drawer, which has no address to price by.
     *
     * There is no spend threshold to count towards any more -- tile delivery
     * is priced by state or quoted -- so the free-shipping progress bar this
     * used to feed has nothing left to show.
     */
    public function getShippingEstimate(Cart $cart): array
    {
        $delivery = $this->deliveryFor($cart);

        return [
            'estimated' => round($delivery['amount'], 2),
            'method' => $delivery['method'],
            'quote_required' => $delivery['method'] === self::DELIVERY_QUOTE,
            'awaiting_state' => $delivery['method'] === self::DELIVERY_STATE_RATE,
            'is_free' => $delivery['method'] === self::DELIVERY_FREE,
            'coupon_free_shipping' => $delivery['method'] === self::DELIVERY_FREE,
        ];
    }
}
