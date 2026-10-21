<?php

namespace Tests\Feature\Checkout;

use App\Domain\Cart\Models\Cart;
use App\Domain\Cart\Services\CheckoutService;
use App\Domain\Cart\Services\PricingService;
use App\Domain\Marketing\Models\Coupon;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Samples on their own ship for a flat fee. Anything else is too heavy and too
 * varied to price at checkout, so the customer pays for the goods and the team
 * quotes delivery afterwards.
 */
class DeliveryQuoteTest extends TestCase
{
    use RefreshDatabase;

    private function product(): Product
    {
        return Product::create([
            'name' => 'Tile', 'slug' => 'tile-' . str()->random(6),
            'sku' => 'T' . str()->random(6), 'price' => 50,
            'status' => 'published', 'is_active' => true,
            // Sold to order, as in the real catalogue, so validateCart() does
            // not reject it for stock.
            'inventory_quantity' => 0, 'inventory_policy' => 'continue',
        ]);
    }

    private function cart(array $lines): Cart
    {
        $cart = Cart::create([
            'session_id' => str()->random(20),
            'last_activity_at' => now(),
        ]);

        foreach ($lines as $line) {
            $cart->items()->create($line + ['product_id' => $this->product()->id]);
        }

        return $cart->refresh();
    }

    private function sample(): array
    {
        return ['price' => 0, 'quantity' => 1, 'is_sample' => true];
    }

    private function tiles(float $price = 50, float $quantity = 2): array
    {
        return ['price' => $price, 'quantity' => $quantity, 'is_sample' => false];
    }

    private function totals(Cart $cart): array
    {
        return app(PricingService::class)->computeTotals($cart);
    }

    private function checkout(Cart $cart)
    {
        $address = [
            'name' => 'Pat Morrow', 'address_line_1' => '1 Test St',
            'city' => 'Darwin', 'state' => 'NT',
            'postal_code' => '0800', 'country' => 'Australia',
        ];

        return app(CheckoutService::class)->processCheckout($cart, [
            'contact' => ['name' => 'Pat Morrow', 'email' => 'pat@example.test', 'phone' => '0412 345 678'],
            'shipping_address' => $address,
            'billing_address' => $address,
            'payment_method' => CheckoutService::PAYMENT_CARD,
        ]);
    }

    public function test_samples_on_their_own_ship_for_the_flat_fee(): void
    {
        $totals = $this->totals($this->cart([$this->sample(), $this->sample(), $this->sample()]));

        $this->assertSame(PricingService::DELIVERY_SAMPLE_FLAT, $totals['shipping_method']);
        $this->assertSame(20.0, $totals['shipping']);
        $this->assertSame(20.0, $totals['sample_shipping']);
        $this->assertSame(20.0, $totals['grand_total']);
        $this->assertFalse($totals['shipping_quote_required']);
    }

    public function test_a_tiles_order_is_charged_nothing_for_delivery_and_left_to_quote(): void
    {
        $totals = $this->totals($this->cart([$this->tiles(50, 2)]));

        $this->assertSame(PricingService::DELIVERY_QUOTE, $totals['shipping_method']);
        $this->assertTrue($totals['shipping_quote_required']);
        $this->assertSame(0.0, $totals['shipping']);
        $this->assertSame(100.0, $totals['grand_total']);
    }

    public function test_samples_travel_free_with_a_tiles_order(): void
    {
        $totals = $this->totals($this->cart([$this->tiles(), $this->sample(), $this->sample()]));

        $this->assertTrue($totals['shipping_quote_required']);
        $this->assertSame(0.0, $totals['sample_shipping']);
        $this->assertSame(0.0, $totals['shipping']);
        $this->assertSame(2, $totals['sample_count']);
    }

    public function test_a_large_tiles_order_is_still_quoted(): void
    {
        // The old free-delivery threshold no longer waives anything: a pallet
        // to Darwin is exactly the order that most needs a quote.
        $totals = $this->totals($this->cart([$this->tiles(60, 100)]));

        $this->assertSame(PricingService::DELIVERY_QUOTE, $totals['shipping_method']);
        $this->assertSame(6000.0, $totals['grand_total']);
    }

    public function test_a_free_shipping_coupon_settles_tile_delivery_upfront(): void
    {
        $coupon = Coupon::create([
            'code' => 'FREESHIP', 'title' => 'Free Shipping',
            'type' => Coupon::TYPE_FREE_SHIPPING, 'value' => 0, 'is_active' => true,
        ]);

        $cart = $this->cart([$this->tiles()]);
        $cart->update(['coupon_id' => $coupon->id]);

        $totals = $this->totals($cart->refresh());

        $this->assertSame(PricingService::DELIVERY_FREE, $totals['shipping_method']);
        $this->assertFalse($totals['shipping_quote_required']);
        $this->assertSame(0.0, $totals['shipping']);
    }

    public function test_the_order_records_how_its_delivery_was_priced(): void
    {
        $tilesOrder = $this->checkout($this->cart([$this->tiles(50, 2), $this->sample()]))->fresh();

        $this->assertSame(PricingService::DELIVERY_QUOTE, $tilesOrder->shipping_method);
        $this->assertSame(0.0, (float) $tilesOrder->shipping_cost);
        $this->assertSame(100.0, (float) $tilesOrder->total);
        $this->assertSame('awaiting', $tilesOrder->deliveryQuoteStatus());

        $samplesOrder = $this->checkout($this->cart([$this->sample()]))->fresh();

        $this->assertSame(PricingService::DELIVERY_SAMPLE_FLAT, $samplesOrder->shipping_method);
        $this->assertSame(20.0, (float) $samplesOrder->shipping_cost);
        $this->assertSame(20.0, (float) $samplesOrder->total);
        $this->assertNull($samplesOrder->deliveryQuoteStatus());
    }
}
