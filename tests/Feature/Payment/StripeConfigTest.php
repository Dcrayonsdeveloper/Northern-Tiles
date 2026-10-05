<?php

namespace Tests\Feature\Payment;

use App\Domain\Payment\Services\StripePaymentService;
use Tests\TestCase;

/**
 * Guards the wiring between STRIPE_* and config('services.stripe.*').
 *
 * config/services.php had no stripe block, so every one of these resolved to
 * null: isEnabled() returned false and card payment was hidden at checkout
 * however correct the keys in .env were. Nothing failed loudly — the payment
 * method simply never appeared, which is why it went unnoticed.
 */
class StripeConfigTest extends TestCase
{
    public function test_the_stripe_config_block_exists(): void
    {
        $this->assertIsArray(
            config('services.stripe'),
            'config/services.php is missing its stripe block — StripePaymentService reads every value through it, so card payment is disabled without it.',
        );
    }

    public function test_every_key_the_payment_service_reads_is_mapped(): void
    {
        // Each of these is read somewhere in StripePaymentService. A key absent
        // from the config array reads as null, which fails silently.
        foreach (['enabled', 'key', 'secret', 'webhook_secret', 'currency'] as $key) {
            $this->assertArrayHasKey($key, config('services.stripe'), "services.stripe.{$key} is not mapped");
        }
    }

    public function test_the_configured_currency_is_one_stripe_will_accept(): void
    {
        $currency = config('services.stripe.currency');

        // Never empty: the block defaults to aud when STRIPE_CURRENCY is unset.
        $this->assertNotEmpty($currency, 'services.stripe.currency resolved empty — Stripe would reject the charge.');

        // Stripe's API takes lowercase ISO codes. "AUD" is rejected outright,
        // and it would fail at the moment of payment — after the customer has
        // entered their card, which is the worst place to discover it.
        $this->assertSame(strtolower($currency), $currency, 'Stripe requires a lowercase currency code.');
    }

    public function test_card_payment_needs_both_the_switch_and_a_secret(): void
    {
        $stripe = app(StripePaymentService::class);

        config(['services.stripe.enabled' => true, 'services.stripe.secret' => 'sk_test_x']);
        $this->assertTrue($stripe->isEnabled());

        // Keys present but the switch off — the state you want between
        // configuring Stripe and being ready to take money.
        config(['services.stripe.enabled' => false]);
        $this->assertFalse($stripe->isEnabled());

        config(['services.stripe.enabled' => true, 'services.stripe.secret' => null]);
        $this->assertFalse($stripe->isEnabled());
    }

    public function test_the_webhook_route_is_registered_at_webhook_stripe(): void
    {
        // The setup doc and the controller comment both said /stripe/webhook,
        // which is a 404 — Stripe would have shown the endpoint as active and
        // retried every delivery for three days against nothing.
        $this->assertSame(url('/webhook/stripe'), route('webhook.stripe'));
    }

    /**
     * Asserted against the route's middleware, not by posting to it.
     *
     * Laravel's ValidateCsrfToken returns early under runningUnitTests(), so a
     * feature test posting here passes whether or not CSRF is actually off.
     * That is how the route shipped excluding App\Http\Middleware\
     * VerifyCsrfToken — a Laravel 10 class this application does not have —
     * and answered Stripe with 419 in production while the tests stayed green.
     */
    public function test_the_webhook_route_is_not_behind_csrf_or_sessions(): void
    {
        $route = app('router')->getRoutes()->getByName('webhook.stripe');
        $middleware = app('router')->gatherRouteMiddleware($route);

        foreach ([
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ] as $unwanted) {
            $this->assertNotContains(
                $unwanted,
                $middleware,
                basename(str_replace('\\', '/', $unwanted)) . ' still runs on the Stripe webhook — Stripe sends no token and no cookie, so every delivery is rejected.',
            );
        }
    }

    public function test_every_excluded_middleware_class_actually_exists(): void
    {
        $route = app('router')->getRoutes()->getByName('webhook.stripe');

        // withoutMiddleware() is silent when handed a class that is not in the
        // stack. A typo or a stale Laravel 10 class name removes nothing and
        // leaves no trace — which is the precise failure this file exists for.
        foreach ($route->excludedMiddleware() as $class) {
            $this->assertTrue(
                class_exists($class),
                "{$class} is excluded from the Stripe webhook route but does not exist, so nothing is being excluded.",
            );
        }
    }

    public function test_the_webhook_refuses_to_act_without_a_signing_secret(): void
    {
        config(['services.stripe.webhook_secret' => null]);

        // 503, not 200. An unverified webhook is worse than none: anyone who
        // knew the url could POST payment_intent.succeeded and mark orders
        // paid for free.
        $this->postJson(route('webhook.stripe'), ['type' => 'payment_intent.succeeded'])
            ->assertStatus(503);
    }
}
