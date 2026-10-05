<?php

namespace Tests\Feature\Admin;

use App\Domain\Cart\Models\Cart;
use App\Domain\Dashboard\Services\AdminAlertService;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Being able to SEE an unbought cart and being able to EMAIL about it are
 * different questions. The screen used to ask the second one and so showed
 * almost nothing — 1 of 26 on production.
 */
class UnpurchasedCartsTest extends TestCase
{
    use RefreshDatabase;

    private function cartWithItem(array $overrides = []): Cart
    {
        $product = Product::create([
            'name' => 'Tile', 'slug' => 'tile-' . str()->random(6),
            'sku' => 'T' . str()->random(6), 'price' => 50, 'status' => 'published', 'is_active' => true,
        ]);

        $cart = Cart::create(array_merge([
            'session_id' => str()->random(20),
            'last_activity_at' => now()->subHours(3),
        ], $overrides));

        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
            'price' => 50,
        ]);

        return $cart->refresh();
    }

    public function test_a_guest_cart_with_no_email_is_still_listed(): void
    {
        // The whole point. eligibleForAbandonment() demands an email because
        // it drives recovery emails; most unbought carts are guests who never
        // reached the email field, so that rule hid them from the admin too.
        $this->cartWithItem(['email' => null]);

        $this->assertSame(1, Cart::unpurchased()->count());
        $this->assertSame(0, Cart::eligibleForAbandonment()->count());
    }

    public function test_a_purchased_cart_is_not_listed(): void
    {
        $order = \App\Models\Order::create([
            'order_number' => 'JKR-' . str()->random(8),
            'status' => 'pending',
            'customer_name' => 'Pat Morrow',
            'customer_email' => 'pat@example.test',
            'currency' => 'AUD',
            'subtotal' => 100,
            'total' => 100,
        ]);

        $this->cartWithItem(['recovered_order_id' => $order->id]);

        $this->assertSame(0, Cart::unpurchased()->count());
    }

    public function test_an_empty_cart_is_not_listed(): void
    {
        Cart::create(['session_id' => str()->random(20), 'last_activity_at' => now()->subHours(3)]);

        $this->assertSame(0, Cart::unpurchased()->count());
    }

    public function test_a_live_shopping_session_is_not_listed(): void
    {
        // Without the activity threshold every open browser tab would read as
        // a lost sale.
        $this->cartWithItem(['last_activity_at' => now()->subMinutes(5)]);

        $this->assertSame(0, Cart::unpurchased()->count());
    }

    public function test_the_sidebar_badge_counts_them(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->cartWithItem(['email' => null]);
        $this->cartWithItem(['email' => 'someone@example.test']);

        $alerts = app(AdminAlertService::class)->forUser($admin);

        $this->assertSame(2, $alerts['abandoned-carts']);
    }

    public function test_the_admin_page_lists_them(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->cartWithItem(['email' => null]);

        $this->actingAs($admin)
            ->get(route('admin.abandoned-carts.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('carts.total', 1));
    }
}
