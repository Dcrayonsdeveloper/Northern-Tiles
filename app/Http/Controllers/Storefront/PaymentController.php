<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Payment\Services\StripePaymentService;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(protected StripePaymentService $stripe) {}

    /**
     * The card payment page, shown after the order exists but before it is
     * paid.
     *
     * Creating the order first and paying second is deliberate: the order is
     * durable, so a customer whose card is declined, who closes the tab, or
     * who needs a different card can come back and retry against the same
     * order rather than rebuilding a cart that has already been emptied.
     */
    public function show(Request $request, string $order): Response|RedirectResponse
    {
        $orderModel = Order::where('order_number', $order)->first();

        if (! $orderModel || ! $this->userOwnsOrder($request, $orderModel)) {
            return Redirect::route('shop.index')->with('error', 'Order not found.');
        }

        $successRoute = $orderModel->is_builder_order ? 'builder.checkout.success' : 'checkout.success';

        if ($orderModel->payment_status === 'paid') {
            return Redirect::route($successRoute, ['order' => $orderModel->order_number]);
        }

        if (! $this->stripe->isEnabled()) {
            return Redirect::route($successRoute, ['order' => $orderModel->order_number])
                ->with('error', 'Card payment is currently unavailable. We will contact you to arrange payment.');
        }

        return Inertia::render('Storefront/Checkout/Payment', [
            'order' => [
                'number' => $orderModel->order_number,
                'total' => (float) $orderModel->total,
                'currency' => strtoupper($orderModel->currency),
                'email' => $orderModel->customer_email,
            ],
            'publishableKey' => $this->stripe->publishableKey(),
            'intentUrl' => route('checkout.payment.intent', ['order' => $orderModel->order_number]),
            'returnUrl' => route('checkout.payment.confirm', ['order' => $orderModel->order_number]),
        ]);
    }

    /**
     * Hand the browser a client secret so it can confirm the card payment.
     *
     * Note what is NOT accepted from the request: the amount. The customer
     * supplies only which order they are paying for; the charge is always
     * computed from that order's stored total. Taking an amount from the
     * client would let anyone pay one cent for any order.
     */
    public function intent(Request $request, string $order): JsonResponse
    {
        $orderModel = Order::where('order_number', $order)->first();

        if (! $orderModel || ! $this->userOwnsOrder($request, $orderModel)) {
            // Deliberately identical to the not-found case. Distinguishing
            // "someone else's order" from "no such order" would let an
            // attacker enumerate valid order numbers.
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if (! $this->stripe->isEnabled()) {
            return response()->json(['message' => 'Card payment is unavailable.'], 503);
        }

        if ($orderModel->payment_status === 'paid') {
            return response()->json(['message' => 'This order is already paid.'], 409);
        }

        try {
            $intent = $this->stripe->createOrRetrieveIntent($orderModel);
        } catch (\Throwable $e) {
            Log::error('Stripe: could not create payment intent', [
                'order_number' => $orderModel->order_number,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Could not start the payment. Please try again.'], 502);
        }

        return response()->json([
            'client_secret' => $intent->client_secret,
            'publishable_key' => $this->stripe->publishableKey(),
            'amount' => $intent->amount,
            'currency' => $intent->currency,
        ]);
    }

    /**
     * Landing point after the customer confirms payment in the browser.
     *
     * The browser is never believed: whatever it claims, the intent is
     * re-fetched from Stripe and the amount and currency are checked against
     * the order before anything is marked paid.
     */
    public function confirm(Request $request, string $order): RedirectResponse
    {
        $orderModel = Order::where('order_number', $order)->first();

        if (! $orderModel || ! $this->userOwnsOrder($request, $orderModel)) {
            return Redirect::route('shop.index')->with('error', 'Order not found.');
        }

        $paid = $this->stripe->confirmPayment($orderModel);

        $successRoute = $orderModel->is_builder_order ? 'builder.checkout.success' : 'checkout.success';

        if (! $paid) {
            // The order still exists and is still owed — send them to the
            // confirmation page with the outstanding state visible rather than
            // silently pretending it went through.
            return Redirect::route($successRoute, ['order' => $orderModel->order_number])
                ->with('error', 'We could not confirm your payment. If you were charged, contact us before paying again.');
        }

        return Redirect::route($successRoute, ['order' => $orderModel->order_number])
            ->with('success', 'Payment received. Thank you!');
    }

    /**
     * A guest may only touch the order their own session placed; a logged-in
     * user only their own. Mirrors the rule CheckoutController::success uses,
     * except the session token is read rather than pulled — payment can be
     * retried, so consuming the token here would lock the customer out of
     * their second attempt.
     */
    protected function userOwnsOrder(Request $request, Order $order): bool
    {
        if ($order->user_id) {
            return $request->user()?->id === $order->user_id;
        }

        $key = $order->is_builder_order ? 'builder_order_success_token' : 'order_success_token';

        return $request->session()->get($key) === $order->order_number;
    }
}
