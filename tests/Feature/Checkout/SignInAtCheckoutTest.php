<?php

namespace Tests\Feature\Checkout;

use App\Domain\Cart\Models\Cart;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Signing in is the last step of buying, not the first: a guest fills a cart,
 * presses Checkout, and only then is asked to sign in or sign up. That only
 * works if the cart survives the trip — it is keyed by the guest's session id,
 * and logging in regenerates that id.
 */
class SignInAtCheckoutTest extends TestCase
{
    use RefreshDatabase;

    private string $guestSessionId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        // The test client does not carry cookies from one request to the
        // next, so hold the session cookie the way a browser would — on the
        // JSON calls too, which send it with credentials: 'same-origin'.
        $this->guestSessionId = Str::random(40);
        $this->withCookie(config('session.cookie'), $this->guestSessionId)->withCredentials();
    }

    private function product(): Product
    {
        return Product::create([
            'name' => 'Tile', 'slug' => 'tile-' . Str::random(6),
            'sku' => 'T' . Str::random(6), 'price' => 50,
            'status' => 'published', 'is_active' => true,
            'inventory_quantity' => 0, 'inventory_policy' => 'continue',
        ]);
    }

    private function cartOf(User $user): Cart
    {
        return Cart::where('user_id', $user->id)->where('channel', Cart::CHANNEL_RETAIL)->firstOrFail();
    }

    public function test_a_guest_can_fill_a_cart(): void
    {
        $tile = $this->product();
        $grout = $this->product();

        $this->post(route('cart.store'), ['product_id' => $tile->id, 'quantity' => 2])
            ->assertSessionHas('success');
        $this->postJson(route('api.cart.add'), ['product_id' => $grout->id, 'quantity' => 1])
            ->assertOk()
            ->assertJson(['success' => true]);

        $cart = Cart::where('session_id', $this->guestSessionId)->whereNull('user_id')->firstOrFail();
        $this->assertEqualsCanonicalizing([$tile->id, $grout->id], $cart->items()->pluck('product_id')->all());
        $this->assertGuest();
    }

    public function test_checkout_asks_a_guest_to_sign_in_and_says_why(): void
    {
        $this->get(route('login'))
            ->assertInertia(fn ($page) => $page->where('fromCheckout', false));

        $this->get(route('checkout.index'))->assertRedirect(route('login'));

        $this->get(route('login'))
            ->assertInertia(fn ($page) => $page->component('Auth/Login')->where('fromCheckout', true));
    }

    public function test_signing_in_at_checkout_returns_to_checkout_with_the_cart(): void
    {
        $user = User::factory()->create();
        $tile = $this->product();

        $this->post(route('cart.store'), ['product_id' => $tile->id, 'quantity' => 2]);
        $this->get(route('checkout.index'))->assertRedirect(route('login'));

        $this->post(route('login'), ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('checkout.index'));

        $cart = $this->cartOf($user);
        $this->assertSame([$tile->id], $cart->items->pluck('product_id')->all());
        $this->assertEquals(2, $cart->items->first()->quantity);
        $this->assertFalse(Cart::where('session_id', $this->guestSessionId)->exists());
        // Abandoned-cart recovery can only write to a cart that has an email.
        $this->assertSame($user->email, $cart->email);

        $this->get(route('checkout.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Storefront/Checkout/Index'));
    }

    public function test_signing_up_at_checkout_returns_to_checkout_with_the_cart(): void
    {
        $tile = $this->product();

        $this->post(route('cart.store'), ['product_id' => $tile->id, 'quantity' => 2]);
        $this->get(route('checkout.index'))->assertRedirect(route('login'));

        $this->post(route('register'), [
            'name' => 'Pat Morrow',
            'email' => 'pat@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('checkout.index'));

        $user = User::where('email', 'pat@example.test')->firstOrFail();
        $this->assertSame([$tile->id], $this->cartOf($user)->items->pluck('product_id')->all());
    }

    public function test_a_returning_customer_keeps_what_was_already_in_their_cart(): void
    {
        $user = User::factory()->create();
        $saved = $this->product();
        $tile = $this->product();

        // Left in their account's cart on an earlier visit.
        Cart::getOrCreate($user->id, null)->items()->create([
            'product_id' => $saved->id, 'quantity' => 1, 'price' => 50,
        ]);

        $this->post(route('cart.store'), ['product_id' => $tile->id, 'quantity' => 2]);
        $this->post(route('login'), ['email' => $user->email, 'password' => 'password']);

        $cart = $this->cartOf($user);
        $this->assertEqualsCanonicalizing([$saved->id, $tile->id], $cart->items->pluck('product_id')->all());
        $this->assertFalse(Cart::where('session_id', $this->guestSessionId)->exists());
        $this->assertSame($user->email, $cart->email);
    }

    public function test_a_customer_whose_old_cart_lapsed_still_gets_the_new_one(): void
    {
        $user = User::factory()->create();
        $stale = $this->product();
        $tile = $this->product();

        // A cart from months ago. Expiry is not part of the (user_id, channel)
        // unique key, so this row still holds the customer's one cart slot.
        $old = Cart::getOrCreate($user->id, null);
        $old->items()->create(['product_id' => $stale->id, 'quantity' => 1, 'price' => 50]);
        $old->forceFill(['expires_at' => now()->subDay()])->save();

        $this->post(route('cart.store'), ['product_id' => $tile->id, 'quantity' => 2]);
        $this->post(route('login'), ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('home'));

        $cart = $this->cartOf($user);
        $this->assertSame($old->id, $cart->id);
        $this->assertFalse($cart->isExpired());
        // The lapsed line is dropped, as Cart::revive() does everywhere else.
        $this->assertSame([$tile->id], $cart->items->pluck('product_id')->all());
        $this->assertFalse(Cart::where('session_id', $this->guestSessionId)->exists());
    }
}
