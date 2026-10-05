<?php

namespace Tests\Feature\Checkout;

use App\Domain\Cart\Models\Cart;
use App\Domain\Cart\Services\CheckoutService;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A card order is created before the customer pays, so emptying the cart at
 * that moment left anyone who reached the Stripe screen and came back without
 * paying staring at an empty basket — with no way to recover what they chose.
 */
class CartSurvivesUnpaidCheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function cartWithItem(): Cart
    {
        $product = Product::create([
            'name' => 'Tile', 'slug' => 'tile-' . str()->random(6),
            'sku' => 'T' . str()->random(6), 'price' => 50,
            'status' => 'published', 'is_active' => true,
            // Matches the real catalogue: stock sits at 0 and the product is
            // sold to order. Without this validateCart() rejects it for
            // insufficient stock before checkout is reached.
            'inventory_quantity' => 0, 'inventory_policy' => 'continue',
        ]);

        $cart = Cart::create([
            'session_id' => str()->random(20),
            'last_activity_at' => now(),
        ]);

        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
            'price' => 50,
        ]);

        return $cart->refresh();
    }

    private function checkout(Cart $cart, string $paymentMethod)
    {
        return app(CheckoutService::class)->processCheckout($cart, [
            'contact' => ['name' => 'Pat Morrow', 'email' => 'pat@example.test', 'phone' => null],
            'shipping_address' => [
                'name' => 'Pat Morrow', 'address_line_1' => '1 Test St',
                'city' => 'Melbourne', 'state' => 'Victoria',
                'postal_code' => '3000', 'country' => 'Australia',
            ],
            'billing_address' => [
                'name' => 'Pat Morrow', 'address_line_1' => '1 Test St',
                'city' => 'Melbourne', 'state' => 'Victoria',
                'postal_code' => '3000', 'country' => 'Australia',
            ],
            'payment_method' => $paymentMethod,
        ]);
    }

    public function test_a_card_order_leaves_the_cart_intact_until_it_is_paid(): void
    {
        $cart = $this->cartWithItem();

        $order = $this->checkout($cart, CheckoutService::PAYMENT_CARD);

        // One line, quantity 2 — still there, because they have not paid yet.
        $this->assertSame(1, $cart->fresh()->items()->count());
        $this->assertSame(2, (int) $cart->fresh()->items()->sum('quantity'));
        $this->assertSame('pending', $order->payment_status);
    }

    public function test_the_order_remembers_which_cart_it_came_from(): void
    {
        $cart = $this->cartWithItem();

        $order = $this->checkout($cart, CheckoutService::PAYMENT_CARD);

        // A webhook arrives from Stripe with no session and no cookie, so for
        // a guest this link is the only way to find the cart again.
        $this->assertSame($cart->id, $order->cart_id);
        $this->assertSame($cart->id, $order->cart->id);
    }

    public function test_an_order_settled_out_of_band_still_clears_the_cart(): void
    {
        $cart = $this->cartWithItem();

        // Trade on invoice has no payment screen to come back from, so there
        // is nothing to preserve the basket for.
        $this->checkout($cart, CheckoutService::PAYMENT_OFFLINE);

        $this->assertSame(0, $cart->fresh()->items()->count());
    }
}
