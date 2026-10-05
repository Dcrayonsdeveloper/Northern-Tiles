<?php

namespace Tests\Feature\Checkout;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Place Order has to take the customer off this site and onto Stripe's hosted
 * page, and that has to work from an Inertia visit — which is how every
 * checkout submission arrives.
 */
class PaymentRedirectTest extends TestCase
{
    use RefreshDatabase;

    private function order(array $overrides = []): Order
    {
        return Order::create(array_merge([
            'order_number' => 'JKR-' . str()->random(8),
            'status' => 'pending',
            'customer_name' => 'Pat Morrow',
            'customer_email' => 'pat@example.test',
            'currency' => 'AUD',
            'subtotal' => 100,
            'total' => 100,
            'payment_method' => 'card',
            'payment_status' => 'pending',
        ], $overrides));
    }

    public function test_an_inertia_visit_is_told_to_leave_the_site(): void
    {
        // Stripe is not configured in tests, so this exercises the branch that
        // runs when it is off — the point here is the response SHAPE under an
        // Inertia request, not the Stripe call.
        $user = User::factory()->create();
        $order = $this->order(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => ''])
            ->get(route('checkout.payment', ['order' => $order->order_number]));

        // Never a plain 302 to an external url: an Inertia XHR cannot follow
        // one off-site. It fetches the other domain's HTML, finds no Inertia
        // payload and discards it, so the button appears to do nothing while
        // the order is created every time. 409 + X-Inertia-Location is how
        // Inertia asks the browser for a real navigation; 302 to an internal
        // route (Stripe disabled) is also fine.
        $this->assertContains($response->getStatusCode(), [302, 409]);

        if ($response->getStatusCode() === 409) {
            $this->assertNotEmpty($response->headers->get('X-Inertia-Location'));
        } else {
            $this->assertStringStartsWith(url('/'), $response->headers->get('Location'));
        }
    }

    public function test_a_builder_order_is_bounced_to_the_trade_success_page(): void
    {
        $user = User::factory()->create();
        $order = $this->order([
            'user_id' => $user->id,
            'is_builder_order' => true,
            'payment_status' => 'paid',
        ]);

        // Already paid: nothing to pay for, and trade must not land on the
        // retail success page.
        $this->actingAs($user)
            ->get(route('checkout.payment', ['order' => $order->order_number]))
            ->assertRedirect(route('builder.checkout.success', ['order' => $order->order_number]));
    }

    public function test_someone_elses_order_is_not_reachable(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $order = $this->order(['user_id' => $owner->id]);

        $this->actingAs($stranger)
            ->get(route('checkout.payment', ['order' => $order->order_number]))
            ->assertRedirect(route('shop.index'));
    }
}
