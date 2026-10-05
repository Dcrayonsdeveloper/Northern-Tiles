<?php

namespace Tests\Feature\Admin;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A card order is created `pending` before the customer is sent to Stripe, so
 * every abandoned attempt leaves a row behind. Those are hidden from the admin
 * lists — but only those.
 */
class AbandonedCheckoutVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private function order(string $method, string $paymentStatus, array $overrides = []): Order
    {
        return Order::create(array_merge([
            'order_number' => 'JKR-' . str()->random(8),
            'status' => 'pending',
            'customer_name' => 'Pat Morrow',
            'customer_email' => 'pat@example.test',
            'currency' => 'AUD',
            'subtotal' => 100,
            'total' => 100,
            'payment_method' => $method,
            'payment_status' => $paymentStatus,
        ], $overrides));
    }

    public function test_an_abandoned_card_checkout_is_hidden(): void
    {
        $this->order('card', 'pending');

        $this->assertSame(0, Order::excludingAbandonedCheckouts()->count());
        $this->assertSame(1, Order::abandonedCheckoutCount());
    }

    public function test_a_paid_card_order_is_shown(): void
    {
        $this->order('card', 'paid');

        $this->assertSame(1, Order::excludingAbandonedCheckouts()->count());
    }

    public function test_a_trade_order_awaiting_payment_by_invoice_is_still_shown(): void
    {
        // The reason the filter keys on payment_method and not just status.
        // Trade customers buy on invoice; those orders sit `pending`
        // indefinitely and legitimately. Hiding every unpaid order would have
        // emptied the Builder Orders screen completely.
        $this->order('online', 'pending', ['is_builder_order' => true]);

        $this->assertSame(1, Order::excludingAbandonedCheckouts()->count());
        $this->assertSame(0, Order::abandonedCheckoutCount());
    }

    public function test_a_failed_card_payment_is_still_shown(): void
    {
        // The customer tried and the card was declined — worth chasing, unlike
        // someone who never reached the payment screen.
        $this->order('card', 'failed');

        $this->assertSame(1, Order::excludingAbandonedCheckouts()->count());
    }

    public function test_the_admin_list_hides_them_but_can_reveal_them(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->order('card', 'pending');
        $this->order('card', 'paid');

        $this->actingAs($admin)
            ->get(route('admin.orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('abandonedCount', 1)
                ->where('orders.total', 1));

        // Nothing is deleted — a payment that lands late is still reachable.
        $this->actingAs($admin)
            ->get(route('admin.orders.index', ['abandoned' => 1]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('orders.total', 2));
    }
}
