<?php

namespace App\Domain\Cart\Services;

use App\Domain\Cart\Models\Cart;
use App\Domain\Marketing\Models\Coupon;
use App\Models\Setting;

class PricingService
{
    /**
     * Compute all totals for a cart (server-authoritative).
     * Never trust client totals - always recalculate on server.
     */
    public function computeTotals(Cart $cart, array $shippingData = []): array
    {
        $subtotal = $this->calculateSubtotal($cart);
        $discount = $this->calculateDiscount($cart, $subtotal);
        $shipping = $this->calculateShipping($cart, $shippingData);
        $taxableAmount = $subtotal - $discount;
        $tax = $this->calculateTax($taxableAmount, $shippingData);
        $grandTotal = $taxableAmount + $shipping + $tax;

        $currency = $cart->currency ?? Setting::getValue('marketplace.currency', 'INR');

        return [
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'shipping' => round($shipping, 2),
            'tax' => round($tax, 2),
            'grand_total' => round($grandTotal, 2),
            'item_count' => $cart->getItemCount(),
            'currency' => $currency,
            'currency_symbol' => $this->getCurrencySymbol($currency),
        ];
    }

    /**
     * Calculate subtotal from cart items.
     */
    protected function calculateSubtotal(Cart $cart): float
    {
        return $cart->items->sum(function ($item) {
            return $item->price * $item->quantity;
        });
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
     * Calculate shipping cost based on address and cart contents.
     */
    protected function calculateShipping(Cart $cart, array $shippingData): float
    {
        if ($cart->isEmpty()) {
            return 0;
        }

        // Check if coupon gives free shipping
        if ($cart->coupon_id) {
            $coupon = Coupon::find($cart->coupon_id);
            if ($coupon && $coupon->givesFreeShipping()) {
                return 0;
            }
        }

        // Get shipping settings
        $freeShippingThreshold = (float) Setting::getValue('shipping.free_threshold', 999);
        $flatRate = (float) Setting::getValue('shipping.flat_rate', 50);

        $subtotal = $this->calculateSubtotal($cart);

        // Free shipping above threshold
        if ($subtotal >= $freeShippingThreshold) {
            return 0;
        }

        // TODO: Integrate with shipping zones/methods
        // For now, use flat rate
        return $flatRate;
    }

    /**
     * Calculate tax based on location and cart contents.
     */
    protected function calculateTax(float $taxableAmount, array $shippingData): float
    {
        // Get tax rate (default 18% GST for India)
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
            'INR' => '₹',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
        ];

        // Use setting symbol if currency matches marketplace currency
        $marketplaceCurrency = Setting::getValue('marketplace.currency', 'INR');
        if ($currency === $marketplaceCurrency) {
            return Setting::getValue('marketplace.currency_symbol', $symbols[$currency] ?? $currency);
        }

        return $symbols[$currency] ?? $currency;
    }

    /**
     * Format price for display.
     */
    public function formatPrice(float $amount, string $currency = 'INR'): string
    {
        $symbol = $this->getCurrencySymbol($currency);
        return $symbol . number_format($amount, 2);
    }

    /**
     * Get shipping estimate (before full address is provided).
     */
    public function getShippingEstimate(Cart $cart): array
    {
        $subtotal = $this->calculateSubtotal($cart);
        $freeShippingThreshold = (float) Setting::getValue('shipping.free_threshold', 999);
        $flatRate = (float) Setting::getValue('shipping.flat_rate', 50);

        $estimatedShipping = $subtotal >= $freeShippingThreshold ? 0 : $flatRate;
        $amountForFreeShipping = max(0, $freeShippingThreshold - $subtotal);

        return [
            'estimated' => round($estimatedShipping, 2),
            'free_threshold' => $freeShippingThreshold,
            'amount_for_free' => round($amountForFreeShipping, 2),
            'is_free' => $estimatedShipping === 0.0,
        ];
    }
}
