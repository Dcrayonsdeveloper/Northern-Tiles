<?php

namespace App\Domain\Cart\Services;

use App\Domain\Cart\Models\Cart;
use App\Domain\Marketing\Models\Coupon;
use App\Models\Setting;

class PricingService
{
    /** Maximum samples allowed per order — hard cap, not a target. */
    public const SAMPLE_MAX_QUANTITY = 5;

    /** Flat shipping charge for a sample order, regardless of how many samples (1–5). */
    public const SAMPLE_SHIPPING_FLAT = 9.99;

    /**
     * Compute all totals for a cart (server-authoritative).
     * Never trust client totals - always recalculate on server.
     */
    public const SHIPPING_STANDARD = 'standard';
    public const SHIPPING_EXPRESS = 'express';

    /** Delivery zones. What a customer pays is decided by where it is going. */
    public const ZONE_SYDNEY_METRO = 'sydney-metro';
    public const ZONE_MELBOURNE_METRO = 'melbourne-metro';
    public const ZONE_REST_OF_AUSTRALIA = 'rest-of-australia';

    public function computeTotals(Cart $cart, array $shippingData = [], ?string $shippingMethod = null): array
    {
        $subtotal = $this->calculateSubtotal($cart);
        $discount = $this->calculateDiscount($cart, $subtotal);

        $sampleShipping = $this->calculateSampleShipping($cart);
        // $shippingMethod is ignored: the destination decides the rate now. The
        // parameter stays so existing callers keep working unchanged.
        $zone = self::zoneForPostcode($shippingData['postal_code'] ?? null, $shippingData['state'] ?? null, $shippingData['city'] ?? null);
        $nonSampleShipping = $this->nonSampleShippingFor($cart, $shippingData['postal_code'] ?? null, $shippingData['state'] ?? null, $shippingData['city'] ?? null);
        $shipping = $sampleShipping + $nonSampleShipping;

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
            'shipping_zone' => $zone['key'],
            'shipping_zone_label' => $zone['label'],
            'sample_shipping' => round($sampleShipping, 2),
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
     * Non-sample subtotal — used for free-shipping threshold calculation.
     * A cart loaded with free samples should NOT trigger free non-sample shipping.
     */
    protected function calculateNonSampleSubtotal(Cart $cart): float
    {
        return $cart->items
            ->filter(fn ($item) => ! $item->is_sample)
            ->sum(fn ($item) => $item->price * $item->quantity);
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
     * The delivery rate card.
     *
     * One definition, read by the checkout page as well as by the totals below,
     * so the price quoted on screen and the price charged cannot drift apart.
     * Prices come from settings, so they can be changed without a deploy; the
     * postcode ranges are the metropolitan areas the flat rates apply to, and
     * anything outside them is Rest of Australia.
     */
    public static function shippingZones(): array
    {
        return [
            [
                'key' => self::ZONE_SYDNEY_METRO,
                'label' => 'Metropolitan Sydney',
                'price' => (float) Setting::getValue('shipping.rate_sydney_metro', 10),
                'ranges' => [[1000, 2249], [2555, 2574], [2740, 2786]],
                'states' => ['NSW'],
                'cities' => ['Sydney'],
            ],
            [
                'key' => self::ZONE_MELBOURNE_METRO,
                'label' => 'Metropolitan Melbourne',
                'price' => (float) Setting::getValue('shipping.rate_melbourne_metro', 10),
                'ranges' => [[3000, 3207], [8000, 8499]],
                'states' => ['VIC'],
                'cities' => ['Melbourne'],
            ],
            [
                'key' => self::ZONE_REST_OF_AUSTRALIA,
                'label' => 'Rest of Australia',
                'price' => (float) Setting::getValue('shipping.rate_rest_of_australia', 20),
                'ranges' => [],
                'states' => [],
                'cities' => [],
            ],
        ];
    }

    /**
     * Which zone an address falls in.
     *
     * The city the customer picked decides it. It is chosen from a list, so it
     * says plainly where the order is going, and a postcode that disagrees is
     * more likely a typo than a correction -- 3074 is a Melbourne suburb, and
     * letting it override a selected Geelong quoted metropolitan rates for a
     * regional delivery.
     *
     * The postcode and then the state are only consulted when no city has been
     * chosen, which is how orders arriving from the API and older saved
     * addresses still get priced.
     */
    public static function zoneForPostcode(?string $postcode, ?string $state = null, ?string $city = null): array
    {
        $zones = self::shippingZones();

        $city = strtolower(trim((string) $city));
        if ($city !== '') {
            foreach ($zones as $zone) {
                foreach ($zone['cities'] as $known) {
                    if (strtolower($known) === $city) {
                        return $zone;
                    }
                }
            }

            return end($zones);
        }

        $digits = preg_replace('/\D/', '', (string) $postcode);
        if ($digits !== '') {
            $code = (int) $digits;
            foreach ($zones as $zone) {
                foreach ($zone['ranges'] as [$from, $to]) {
                    if ($code >= $from && $code <= $to) {
                        return $zone;
                    }
                }
            }

            return end($zones);
        }

        $state = strtoupper(trim((string) $state));
        if ($state !== '') {
            foreach ($zones as $zone) {
                if (in_array($state, $zone['states'], true)) {
                    return $zone;
                }
            }
        }

        return end($zones);
    }

    /**
     * Non-sample shipping, priced by where the order is going.
     *
     * Operates on the non-sample subtotal only, so samples keep their own flat
     * rate rather than being charged twice.
     */
    public function nonSampleShippingFor(Cart $cart, ?string $postcode = null, ?string $state = null, ?string $city = null): float
    {
        if ($cart->isEmpty()) {
            return 0;
        }

        $nonSampleSubtotal = $this->calculateNonSampleSubtotal($cart);

        // If there are no non-sample items, no non-sample shipping
        if ($nonSampleSubtotal <= 0) {
            return 0;
        }

        // Check if coupon gives free shipping
        if ($cart->coupon_id) {
            $coupon = Coupon::find($cart->coupon_id);
            if ($coupon && $coupon->givesFreeShipping()) {
                return 0;
            }
        }

        // The spend-over threshold still waives delivery; it sits on top of the
        // rate card rather than replacing it.
        $freeShippingThreshold = (float) Setting::getValue('shipping.free_threshold', 999);

        if ($nonSampleSubtotal >= $freeShippingThreshold) {
            return 0;
        }

        return (float) self::zoneForPostcode($postcode, $state, $city)['price'];
    }

    /**
     * Calculate sample shipping.
     * Flat $9.99 for any number of samples from 1 to MAX. No samples → no charge.
     * No tiering — adding the 5th sample doesn't cost more than the 1st.
     */
    protected function calculateSampleShipping(Cart $cart): float
    {
        $sampleCount = $this->getSampleCount($cart);

        return $sampleCount > 0 ? self::SAMPLE_SHIPPING_FLAT : 0;
    }

    /**
     * Kept for back-compat — returns the combined shipping.
     */
    protected function calculateShipping(Cart $cart, array $shippingData, ?string $method = null): float
    {
        return $this->calculateSampleShipping($cart)
            + $this->nonSampleShippingFor($cart, $shippingData['postal_code'] ?? null, $shippingData['state'] ?? null, $shippingData['city'] ?? null);
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
     * Get shipping estimate (before full address is provided).
     * Free-shipping progress bar is based on non-sample subtotal only —
     * samples should not count toward the free-shipping threshold.
     */
    public function getShippingEstimate(Cart $cart): array
    {
        $nonSampleSubtotal = $this->calculateNonSampleSubtotal($cart);
        $freeShippingThreshold = (float) Setting::getValue('shipping.free_threshold', 999);
        $flatRate = (float) Setting::getValue('shipping.flat_rate', 50);

        // Free-shipping coupon makes non-sample shipping $0 regardless of subtotal
        $hasFreeShippingCoupon = false;
        if ($cart->coupon_id) {
            $coupon = Coupon::find($cart->coupon_id);
            if ($coupon && $coupon->givesFreeShipping()) {
                $hasFreeShippingCoupon = true;
            }
        }

        $estimatedNonSampleShipping = (!$hasFreeShippingCoupon && $nonSampleSubtotal > 0 && $nonSampleSubtotal < $freeShippingThreshold)
            ? $flatRate
            : 0;

        $amountForFreeShipping = $hasFreeShippingCoupon ? 0 : max(0, $freeShippingThreshold - $nonSampleSubtotal);

        $sampleShipping = $this->calculateSampleShipping($cart);

        return [
            'estimated' => round($estimatedNonSampleShipping + $sampleShipping, 2),
            'non_sample_shipping' => round($estimatedNonSampleShipping, 2),
            'sample_shipping' => round($sampleShipping, 2),
            'free_threshold' => $freeShippingThreshold,
            'amount_for_free' => round($amountForFreeShipping, 2),
            'is_free' => $estimatedNonSampleShipping === 0.0 && $sampleShipping === 0.0,
            'coupon_free_shipping' => $hasFreeShippingCoupon,
        ];
    }
}
