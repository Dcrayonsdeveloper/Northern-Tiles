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

        // Stripe's own hosted page, rather than an embedded form. It brings
        // Apple Pay, Google Pay, Link and anything enabled on the account
        // later without this application rendering any of it -- the embedded
        // Payment Element only ever showed what it was explicitly given.
        try {
            return Redirect::away($this->stripe->createCheckoutSession($orderModel));
        } catch (\Throwable $e) {
            Log::error('Stripe: could not open a checkout session', [
                'order_id' => $orderModel->id,
                'error' => $e->getMessage(),
            ]);

            // The order is placed and still owed; say so rather than leaving
            // the customer on a blank page wondering whether they paid.
            return Redirect::route($successRoute, ['order' => $orderModel->order_number])
                ->with('error', 'We could not open the payment page. Your order is saved — please contact us to pay.');
        }
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

        // Checkout Sessions create the payment intent, so the order does not
        // know which one to verify until the session is resolved. The webhook
        // does the same thing from its own copy of the session.
        if ($sessionId = $request->string('session_id')->toString()) {
            $this->stripe->attachIntentFromSession($orderModel, $sessionId);
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
