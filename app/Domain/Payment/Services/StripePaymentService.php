<?php

namespace App\Domain\Payment\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Stripe\Event;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;
use Stripe\StripeClient;
use Stripe\Webhook;

/**
 * Stripe card payments.
 *
 * The Stripe account is shared with the Shopify storefront. Nothing here
 * touches Shopify: this application uses its own API keys, its own
 * PaymentIntents, and prefixes every order reference so the two sites can
 * never collide in the dashboard or in Xero reconciliation.
 */
class StripePaymentService
{
    private ?StripeClient $client = null;

    /**
     * Card payment is only offered when a secret key is actually configured.
     * Without this a half-configured gateway would render a card form that
     * fails at the moment of payment — after the customer has entered their
     * details, which is the worst possible place to discover it.
     */
    public function isEnabled(): bool
    {
        return (bool) config('services.stripe.enabled')
            && filled(config('services.stripe.secret'));
    }

    public function publishableKey(): ?string
    {
        return config('services.stripe.key');
    }

    protected function client(): StripeClient
    {
        if ($this->client === null) {
            $secret = config('services.stripe.secret');

            if (blank($secret)) {
                throw new \RuntimeException('Stripe secret key is not configured.');
            }

            $this->client = new StripeClient([
                'api_key' => $secret,
                // Pinning the version means a Stripe-side API change can never
                // alter the shape of what this code receives without a
                // deliberate upgrade here.
                'stripe_version' => '2024-06-20',
            ]);
        }

        return $this->client;
    }

    /**
     * Create (or reuse) the PaymentIntent for an order and return its client
     * secret for the browser to confirm against.
     *
     * Reuse matters: a customer who reloads the payment page, or comes back to
     * a pending order, must land on the SAME intent. Creating a second intent
     * for one order leaves an abandoned authorisation against the customer's
     * card and makes the dashboard read as two attempted payments.
     */
    public function createOrRetrieveIntent(Order $order): PaymentIntent
    {
        if ($order->stripe_payment_intent_id) {
            try {
                $intent = $this->client()->paymentIntents->retrieve($order->stripe_payment_intent_id);

                // A cancelled or already-succeeded intent cannot be confirmed
                // again, so only an in-flight one is worth handing back.
                if (in_array($intent->status, [
                    PaymentIntent::STATUS_REQUIRES_PAYMENT_METHOD,
                    PaymentIntent::STATUS_REQUIRES_CONFIRMATION,
                    PaymentIntent::STATUS_REQUIRES_ACTION,
                ], true)) {
                    // The order total can change between attempts (coupon,
                    // shipping). Keep the intent authoritative to the order.
                    if ($intent->amount !== $this->minorUnits($order->total)) {
                        $intent = $this->client()->paymentIntents->update($intent->id, [
                            'amount' => $this->minorUnits($order->total),
                        ]);
                    }

                    return $intent;
                }
            } catch (ApiErrorException $e) {
                // A stale or foreign id (for example after switching between
                // test and live keys) must not wedge the customer on a dead
                // intent — fall through and create a fresh one.
                Log::warning('Stripe: could not retrieve stored intent, creating a new one', [
                    'order_id' => $order->id,
                    'intent_id' => $order->stripe_payment_intent_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $intent = $this->client()->paymentIntents->create([
            'amount' => $this->minorUnits($order->total),
            'currency' => $this->currency($order),
            'automatic_payment_methods' => ['enabled' => true],
            // Shown on the customer's card statement. Stripe allows 22 chars.
            'statement_descriptor_suffix' => 'NTILED',
            'description' => "Order {$order->order_number}",
            'receipt_email' => $order->customer_email,
            'metadata' => [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                // Distinguishes this site's payments from Shopify's inside a
                // shared Stripe account — essential when reconciling in Xero.
                'source' => 'ntiled-web',
                'channel' => $order->is_builder_order ? 'trade' : 'retail',
            ],
        ]);

        $order->forceFill(['stripe_payment_intent_id' => $intent->id])->save();

        return $intent;
    }

    /**
     * Confirm server-side that an intent really succeeded, and mark the order
     * paid.
     *
     * The browser saying "payment succeeded" is a claim, not proof — it can be
     * forged, and it can be lost when the customer closes the tab mid-redirect.
     * The amount and currency are re-checked against the order here so a
     * tampered or stale intent cannot mark an order paid for the wrong sum.
     */
    public function confirmPayment(Order $order): bool
    {
        if (blank($order->stripe_payment_intent_id)) {
            return false;
        }

        // Already settled — do not bill or re-stamp it.
        if ($order->payment_status === 'paid') {
            return true;
        }

        try {
            $intent = $this->client()->paymentIntents->retrieve($order->stripe_payment_intent_id);
        } catch (ApiErrorException $e) {
            Log::error('Stripe: failed to retrieve intent while confirming', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        if ($intent->status !== PaymentIntent::STATUS_SUCCEEDED) {
            return false;
        }

        if ($intent->amount_received !== $this->minorUnits($order->total)
            || strtolower($intent->currency) !== $this->currency($order)) {
            Log::critical('Stripe: paid amount does not match the order — NOT marking paid', [
                'order_id' => $order->id,
                'order_total_minor' => $this->minorUnits($order->total),
                'order_currency' => $this->currency($order),
                'intent_received' => $intent->amount_received,
                'intent_currency' => $intent->currency,
            ]);

            return false;
        }

        $order->forceFill([
            'payment_status' => 'paid',
            'stripe_charge_id' => $intent->latest_charge ?? null,
            'paid_at' => now(),
            // Leave `status` alone: fulfilment state is the warehouse's to set,
            // and conflating "paid" with "processing" has burned this before.
        ])->save();

        return true;
    }

    /* ---------------------------------------------------------------------
     | Webhooks
     * ------------------------------------------------------------------ */

    /**
     * Webhook handling stays off until a signing secret exists.
     *
     * An unverified webhook endpoint is worse than none: anyone who knows the
     * URL could POST `payment_intent.succeeded` and mark orders paid for free.
     * The route refuses everything while this is blank.
     */
    public function webhookConfigured(): bool
    {
        return filled(config('services.stripe.webhook_secret'));
    }

    /**
     * Verify a webhook's signature and return the parsed event.
     *
     * Throws on a bad signature or a replayed-too-late payload, and the caller
     * turns that into a 400. Never parse the body before this succeeds — the
     * signature is the only thing separating Stripe from an attacker.
     */
    public function constructWebhookEvent(string $payload, ?string $signature): Event
    {
        return Webhook::constructEvent(
            $payload,
            (string) $signature,
            (string) config('services.stripe.webhook_secret')
        );
    }

    /**
     * Find the order an event refers to.
     *
     * Matched on the intent id rather than the metadata order id: the id is
     * unique in our table and is set by us, whereas metadata could in
     * principle be written by anything else using this shared Stripe account.
     */
    public function orderForIntent(string $intentId): ?Order
    {
        return Order::where('stripe_payment_intent_id', $intentId)->first();
    }

    /**
     * Record a failed payment attempt.
     *
     * A failure must never overwrite a payment that already succeeded — events
     * can arrive out of order, and a late `payment_failed` for an earlier
     * declined attempt would otherwise un-pay a good order.
     */
    public function markFailed(Order $order): void
    {
        if ($order->payment_status === 'paid') {
            return;
        }

        $order->forceFill(['payment_status' => 'failed'])->save();
    }

    /**
     * Record a refund.
     *
     * `charge.refunded` fires for partial refunds too, so the status only
     * moves to `refunded` when the whole amount has gone back. A partial
     * refund leaves the order `paid` — it genuinely still is — and is left for
     * a human to reconcile rather than silently mislabelled.
     */
    public function markRefunded(Order $order, int $amountRefunded): void
    {
        if ($amountRefunded < $this->minorUnits($order->total)) {
            Log::info('Stripe: partial refund recorded, order left as paid', [
                'order_number' => $order->order_number,
                'refunded_minor' => $amountRefunded,
                'order_total_minor' => $this->minorUnits($order->total),
            ]);

            return;
        }

        $order->forceFill(['payment_status' => 'refunded'])->save();
    }

    /**
     * Convert a decimal order total to the smallest currency unit.
     *
     * Stripe takes integers, never decimals. Casting 10.10 straight to int
     * yields 1009 in binary floating point, so the value is rounded first —
     * a one-cent-per-order error that is invisible until reconciliation.
     */
    protected function minorUnits(float|string $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }

    protected function currency(Order $order): string
    {
        return strtolower($order->currency ?: config('services.stripe.currency', 'aud'));
    }
}
