<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Payment\Services\StripePaymentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;

/**
 * Stripe webhook receiver.
 *
 * This exists because the browser redirect is not a reliable delivery
 * mechanism. A customer who pays and then closes the tab, loses signal, or is
 * interrupted during a 3-D Secure step never reaches the confirm route — their
 * money is taken and the order would sit `pending` forever. Stripe retries
 * this endpoint for up to three days, so it is what actually guarantees an
 * order reaches its final state.
 *
 * SETUP (see the README section added alongside this file):
 *   1. Stripe Dashboard -> Developers -> Webhooks -> Add endpoint
 *   2. URL:    https://besttiles.shop/stripe/webhook
 *   3. Events: payment_intent.succeeded
 *              payment_intent.payment_failed
 *              charge.refunded
 *   4. Copy the signing secret (whsec_...) into STRIPE_WEBHOOK_SECRET
 *   5. php artisan config:cache && sudo systemctl reload php8.3-fpm
 */
class StripeWebhookController extends Controller
{
    public function __construct(protected StripePaymentService $stripe) {}

    public function handle(Request $request): JsonResponse
    {
        // Refuse to act on anything until a signing secret is configured.
        // Without verification this endpoint would let anyone mark any order
        // paid by posting a JSON body.
        if (! $this->stripe->webhookConfigured()) {
            Log::warning('Stripe webhook hit while STRIPE_WEBHOOK_SECRET is unset — ignoring.');

            return response()->json(['message' => 'Webhook not configured.'], 503);
        }

        try {
            // The RAW body must be used. Laravel's parsed input re-encodes the
            // JSON, which changes the bytes and breaks the signature.
            $event = $this->stripe->constructWebhookEvent(
                $request->getContent(),
                $request->header('Stripe-Signature')
            );
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook: signature verification failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Invalid signature.'], 400);
        } catch (\UnexpectedValueException $e) {
            return response()->json(['message' => 'Invalid payload.'], 400);
        }

        try {
            $this->dispatch($event);
        } catch (\Throwable $e) {
            // A 500 makes Stripe retry, which is what we want for a transient
            // fault — but the error must be visible, not swallowed into a 200.
            Log::error('Stripe webhook: handler threw', [
                'event_id' => $event->id,
                'type' => $event->type,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Handler error.'], 500);
        }

        // Anything we do not handle still gets a 200. Returning an error for an
        // event type we simply do not care about would make Stripe retry it for
        // three days and eventually disable the endpoint.
        return response()->json(['received' => true]);
    }

    protected function dispatch(\Stripe\Event $event): void
    {
        switch ($event->type) {
            case 'payment_intent.succeeded':
                $intent = $event->data->object;
                $order = $this->stripe->orderForIntent($intent->id);

                if (! $order) {
                    // Expected, not an error: the shared Stripe account also
                    // serves Shopify, so a payment that belongs to that site
                    // has no order here. Logged at info so it is visible
                    // without looking like a fault.
                    Log::info('Stripe webhook: no local order for intent (likely another site on this account)', [
                        'intent' => $intent->id,
                        'source' => $intent->metadata->source ?? 'unknown',
                    ]);
                    break;
                }

                // Re-fetches the intent from Stripe and re-checks amount and
                // currency before marking paid. Deliberately the same path the
                // browser redirect uses, so whichever arrives first wins and
                // the second is a no-op.
                $this->stripe->confirmPayment($order);
                break;

            case 'payment_intent.payment_failed':
                $intent = $event->data->object;

                if ($order = $this->stripe->orderForIntent($intent->id)) {
                    $this->stripe->markFailed($order);
                }
                break;

            case 'charge.refunded':
                $charge = $event->data->object;

                if ($charge->payment_intent
                    && $order = $this->stripe->orderForIntent($charge->payment_intent)) {
                    $this->stripe->markRefunded($order, (int) $charge->amount_refunded);
                }
                break;

            default:
                Log::debug('Stripe webhook: unhandled event type', ['type' => $event->type]);
        }
    }
}
