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

    public function test_the_list_shows_website_orders_by_default_and_trade_on_request(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->order('online', 'pending', ['is_builder_order' => false]);
        $this->order('online', 'pending', ['is_builder_order' => true]);
        $this->order('online', 'pending', ['is_builder_order' => true]);

        // Trade is a separate book with its own pricing; mixing the two made
        // either impossible to scan.
        $this->actingAs($admin)
            ->get(route('admin.orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('source', 'website')
                ->where('orders.total', 1)
                ->where('sourceCounts.website', 1)
                ->where('sourceCounts.builder', 2));

        $this->actingAs($admin)
            ->get(route('admin.orders.index', ['source' => 'builder']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('source', 'builder')
                ->where('orders.total', 2));
    }

    public function test_the_sidebar_counts_each_source_separately(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->order('online', 'pending', ['is_builder_order' => false]);
        $this->order('online', 'pending', ['is_builder_order' => true]);
        // Abandoned: work nobody has to do, so it is in neither badge.
        $this->order('card', 'pending', ['is_builder_order' => true]);

        $alerts = app(\App\Domain\Dashboard\Services\AdminAlertService::class)->forUser($admin);

        $this->assertSame(1, $alerts['orders']);
        $this->assertSame(1, $alerts['builder-orders']);
    }
}
