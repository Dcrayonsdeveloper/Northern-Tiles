<?php

namespace Tests\Feature\Checkout;

use App\Domain\Cart\Models\Cart;
use App\Domain\Cart\Services\CheckoutService;
use App\Domain\Cart\Services\PricingService;
use App\Domain\Cart\Services\ShippingRates;
use App\Domain\Marketing\Models\Coupon;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Staff set one delivery charge per state for orders with tiles. A state with
 * no rate falls back to a delivery quote, so with nothing set, checkout works
 * exactly as quoting alone.
 */
class StateShippingRatesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // NSW and VIC are priced; every other state is left to quote.
        ShippingRates::save(20, ['NSW' => 120, 'VIC' => 95.5]);
    }

    protected function tearDown(): void
    {
        // Setting keeps a static per-request cache that outlives the test.
        Setting::forgetCache(ShippingRates::SAMPLE_KEY);
        Setting::forgetCache(ShippingRates::STATES_KEY);

        parent::tearDown();
    }

    private function product(): Product
    {
        return Product::create([
            'name' => 'Tile', 'slug' => 'tile-' . str()->random(6),
            'sku' => 'T' . str()->random(6), 'price' => 50,
            'status' => 'published', 'is_active' => true,
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

    private function totals(Cart $cart, ?string $state = null): array
    {
        return app(PricingService::class)->computeTotals($cart, $state ? ['state' => $state] : []);
    }

    public function test_a_tiles_order_pays_the_rate_for_its_state(): void
    {
        $totals = $this->totals($this->cart([$this->tiles(50, 2)]), 'NSW');

        $this->assertSame(PricingService::DELIVERY_STATE_RATE, $totals['shipping_method']);
        $this->assertSame(120.0, $totals['shipping']);
        $this->assertSame(220.0, $totals['grand_total']);
        $this->assertFalse($totals['shipping_quote_required']);
    }

    public function test_a_state_without_a_rate_is_quoted(): void
    {
        $totals = $this->totals($this->cart([$this->tiles()]), 'WA');

        $this->assertSame(PricingService::DELIVERY_QUOTE, $totals['shipping_method']);
        $this->assertTrue($totals['shipping_quote_required']);
        $this->assertSame(0.0, $totals['shipping']);
    }

    public function test_before_there_is_an_address_delivery_waits_for_the_state(): void
    {
        $totals = $this->totals($this->cart([$this->tiles()]));

        $this->assertSame(PricingService::DELIVERY_STATE_RATE, $totals['shipping_method']);
        $this->assertTrue($totals['shipping_awaiting_state']);
        $this->assertFalse($totals['shipping_quote_required']);
        $this->assertSame(0.0, $totals['shipping']);
    }

    public function test_with_no_rates_set_every_tiles_order_is_quoted(): void
    {
        ShippingRates::save(20, []);

        foreach ([null, 'NSW'] as $state) {
            $totals = $this->totals($this->cart([$this->tiles()]), $state);

            $this->assertSame(PricingService::DELIVERY_QUOTE, $totals['shipping_method'], 'state ' . var_export($state, true));
            $this->assertFalse($totals['shipping_awaiting_state']);
        }
    }

    public function test_samples_on_their_own_pay_the_samples_rate_wherever_they_go(): void
    {
        ShippingRates::save(25, ['NSW' => 120]);

        $totals = $this->totals($this->cart([$this->sample(), $this->sample()]), 'NSW');

        $this->assertSame(PricingService::DELIVERY_SAMPLE_FLAT, $totals['shipping_method']);
        $this->assertSame(25.0, $totals['shipping']);
    }

    public function test_samples_travel_free_with_tiles_at_the_state_rate(): void
    {
        $totals = $this->totals($this->cart([$this->tiles(50, 2), $this->sample()]), 'VIC');

        $this->assertSame(95.5, $totals['shipping']);
        $this->assertSame(0.0, $totals['sample_shipping']);
    }

    public function test_a_free_shipping_coupon_still_makes_delivery_free(): void
    {
        $coupon = Coupon::create([
            'code' => 'FREESHIP', 'title' => 'Free Shipping',
            'type' => Coupon::TYPE_FREE_SHIPPING, 'value' => 0, 'is_active' => true,
        ]);

        $cart = $this->cart([$this->tiles()]);
        $cart->update(['coupon_id' => $coupon->id]);

        $totals = $this->totals($cart->refresh(), 'NSW');

        $this->assertSame(PricingService::DELIVERY_FREE, $totals['shipping_method']);
        $this->assertSame(0.0, $totals['shipping']);
    }

    public function test_the_order_is_charged_the_rate_for_its_state(): void
    {
        $address = [
            'name' => 'Pat Morrow', 'address_line_1' => '1 Test St',
            'city' => 'Sydney', 'state' => 'NSW',
            'postal_code' => '2000', 'country' => 'Australia',
        ];

        $order = app(CheckoutService::class)->processCheckout($this->cart([$this->tiles(50, 2)]), [
            'contact' => ['name' => 'Pat Morrow', 'email' => 'pat@example.test', 'phone' => '0412 345 678'],
            'shipping_address' => $address,
            'billing_address' => $address,
            'payment_method' => CheckoutService::PAYMENT_CARD,
        ])->fresh();

        $this->assertSame(PricingService::DELIVERY_STATE_RATE, $order->shipping_method);
        $this->assertSame(120.0, (float) $order->shipping_cost);
        $this->assertSame(220.0, (float) $order->total);
        $this->assertNull($order->deliveryQuoteStatus());
        $this->assertSame('NSW delivery rate', $order->deliveryLabel());
    }
}
