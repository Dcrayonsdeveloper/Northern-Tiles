<?php

namespace App\Domain\Cart\Services;

use App\Domain\Cart\Models\Cart;
use App\Domain\Marketing\Models\Coupon;
use App\Models\Setting;

class PricingService
{
    /** Maximum samples allowed per order — hard cap, not a target. */
    public const SAMPLE_MAX_QUANTITY = 5;

    /** Flat shipping charge for a samples-only order, regardless of how many samples (1–5). */
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
     * Samples on their own go out for a flat fee. Anything else is quoted by
     * the team once the order is in -- tiles are too heavy and too varied for
     * a flat rate -- and collected separately, so checkout charges nothing for
     * it. A free-shipping coupon is the one thing that settles it upfront.
     */
    public const DELIVERY_SAMPLE_FLAT = 'sample-flat';
    public const DELIVERY_QUOTE = 'delivery-quote';
    public const DELIVERY_FREE = 'free-shipping';

    public function computeTotals(Cart $cart, array $shippingData = [], ?string $shippingMethod = null): array
    {
        $subtotal = $this->calculateSubtotal($cart);
        $discount = $this->calculateDiscount($cart, $subtotal);

        // What is in the cart decides delivery, not where it is going, so
        // neither the address nor $shippingMethod changes it. Both parameters
        // stay so existing callers keep working unchanged.
        $delivery = $this->deliveryFor($cart);
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
    public function deliveryFor(Cart $cart): array
    {
        if ($cart->isEmpty()) {
            return ['method' => null, 'amount' => 0.0];
        }

        if (! $cart->items->contains(fn ($item) => ! $item->is_sample)) {
            return ['method' => self::DELIVERY_SAMPLE_FLAT, 'amount' => self::SAMPLE_SHIPPING_FLAT];
        }

        // A free-shipping coupon is an offer the business chose to make, and
        // the coupon box has already told the customer it applies. Quoting
        // them for delivery afterwards would go back on that.
        if ($this->hasFreeShippingCoupon($cart)) {
            return ['method' => self::DELIVERY_FREE, 'amount' => 0.0];
        }

        return ['method' => self::DELIVERY_QUOTE, 'amount' => 0.0];
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
     * Shipping summary for the cart drawer.
     *
     * There is no spend threshold to count towards any more -- tile delivery
     * is quoted rather than charged -- so the free-shipping progress bar this
     * used to feed has nothing left to show.
     */
    public function getShippingEstimate(Cart $cart): array
    {
        $delivery = $this->deliveryFor($cart);

        return [
            'estimated' => round($delivery['amount'], 2),
            'method' => $delivery['method'],
            'quote_required' => $delivery['method'] === self::DELIVERY_QUOTE,
            'is_free' => $delivery['method'] === self::DELIVERY_FREE,
            'coupon_free_shipping' => $delivery['method'] === self::DELIVERY_FREE,
        ];
    }
}
