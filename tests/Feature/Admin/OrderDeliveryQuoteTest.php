<?php

namespace Tests\Feature\Admin;

use App\Domain\Cart\Services\PricingService;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Tile orders are paid for without delivery, which staff quote afterwards and
 * collect by phone or invoice. The quote is recorded on the order but never
 * folded into its total -- that is what the card was charged, and the Stripe
 * webhook checks the amount it received against it.
 */
class OrderDeliveryQuoteTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function order(string $shippingMethod = PricingService::DELIVERY_QUOTE): Order
    {
        return Order::create([
            'order_number' => 'JKR-' . str()->random(8),
            'status' => 'pending',
            'customer_name' => 'Pat Morrow',
            'customer_email' => 'pat@example.test',
            'currency' => 'AUD',
            'subtotal' => 600,
            'shipping_cost' => 0,
            'total' => 600,
            'shipping_method' => $shippingMethod,
            'payment_method' => 'card',
            'payment_status' => 'paid',
        ]);
    }

    public function test_the_order_screen_shows_the_quote_is_still_needed(): void
    {
        $this->withoutVite();
        $order = $this->order();

        $this->actingAs($this->admin())
            ->get(route('admin.orders.show', $order))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Orders/Show')
                ->where('order.delivery_quote_status', 'awaiting')
                ->where('order.delivery_label', 'Quoted separately'));
    }

    public function test_staff_can_record_a_quote_without_touching_the_total(): void
    {
        $order = $this->order();

        $this->actingAs($this->admin())
            ->put(route('admin.orders.update', $order), ['delivery_quote' => '185.50', 'delivery_quote_paid' => false])
            ->assertRedirect(route('admin.orders.show', $order->id));

        $fresh = $order->fresh();
        $this->assertSame(185.5, (float) $fresh->delivery_quote);
        $this->assertSame(600.0, (float) $fresh->total);
        $this->assertSame('quoted', $fresh->deliveryQuoteStatus());
    }

    public function test_marking_the_quote_paid_keeps_the_first_paid_date(): void
    {
        $order = $this->order();
        $order->update(['delivery_quote' => 185.50]);
        $admin = $this->admin();
        $paid = ['delivery_quote' => '185.50', 'delivery_quote_paid' => true];

        $this->actingAs($admin)->put(route('admin.orders.update', $order), $paid);
        $paidAt = $order->fresh()->delivery_quote_paid_at;

        $this->assertNotNull($paidAt);
        $this->assertSame('paid', $order->fresh()->deliveryQuoteStatus());

        // Saving the box again a day later must not move the date.
        $this->travel(1)->days();
        $this->actingAs($admin)->put(route('admin.orders.update', $order), $paid);
        $this->assertTrue($paidAt->equalTo($order->fresh()->delivery_quote_paid_at));

        // Unticking it clears the date.
        $this->actingAs($admin)->put(route('admin.orders.update', $order), ['delivery_quote_paid' => false]);
        $this->assertNull($order->fresh()->delivery_quote_paid_at);
    }

    public function test_delivery_cannot_be_marked_paid_before_it_is_quoted(): void
    {
        $order = $this->order();

        $this->actingAs($this->admin())
            ->put(route('admin.orders.update', $order), ['delivery_quote' => '', 'delivery_quote_paid' => true])
            ->assertSessionHasErrors('delivery_quote');

        $this->assertNull($order->fresh()->delivery_quote_paid_at);
    }

    public function test_an_order_whose_delivery_was_charged_has_no_quote_to_record(): void
    {
        $order = $this->order(PricingService::DELIVERY_SAMPLE_FLAT);

        $this->actingAs($this->admin())
            ->put(route('admin.orders.update', $order), ['delivery_quote' => '50']);

        $this->assertNull($order->fresh()->delivery_quote);
    }
}
