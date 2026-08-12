<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Cart\Services\CartService;
use App\Domain\Cart\Services\CheckoutService;
use App\Domain\Cart\Services\PricingService;
use App\Domain\Marketing\Services\CouponService;
use App\Http\Controllers\Concerns\HasCartChannel;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    use HasCartChannel;

    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService,
        protected PricingService $pricingService,
        protected CouponService $couponService
    ) {}

    /**
     * Display checkout page.
     * Supports both guest and logged-in users.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId, $this->channel());

        if (!$cart || $cart->isEmpty()) {
            return Redirect::route($this->emptyCartRoute())->with('info', 'Your cart is empty.');
        }

        // Sample minimum gate: 1-3 samples is invalid.
        // Trade carts can't contain samples (CartService::addItem strips
        // is_sample when channel==trade), so this validation is a no-op there.
        $sampleValidation = $this->pricingService->getSampleValidation($cart);
        if (! $sampleValidation['is_valid']) {
            return Redirect::route($this->cartRoute())->with('error', $sampleValidation['message']);
        }

        // Ensure the best eligible coupon is applied regardless of navigation path.
        $cart->load(['items.product', 'items.variant']);
        $this->couponService->autoApplyBestCoupon($cart);

        $summary = $this->checkoutService->getCheckoutSummary($cart);
        $user = $request->user();

        return Inertia::render($this->checkoutInertiaComponent(), [
            'items' => $summary['items'],
            'totals' => $summary['totals'],
            'shippingMethods' => $summary['shipping_methods'],
            'paymentMethods' => $summary['payment_methods'],
            'isGuest' => !$user,
            'user' => $user ? [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
            ] : null,
            'savedAddresses' => $user ? $this->getSavedAddresses($user) : [],
        ]);
    }

    /**
     * Inertia component name for the checkout page. Trade overrides this to
     * its own fork so PO/invoice/site-delivery fields can render.
     */
    protected function checkoutInertiaComponent(): string
    {
        return 'Storefront/Checkout/Index';
    }

    /**
     * Process checkout and create order.
     */
    public function store(Request $request): RedirectResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId, $this->channel());

        if (!$cart || $cart->isEmpty()) {
            return Redirect::route($this->emptyCartRoute())->with('error', 'Your cart is empty.');
        }

        // Sample minimum gate (authoritative, server-side) — trade cart is
        // sample-free by construction, so this branch never fires for trade.
        $sampleValidation = $this->pricingService->getSampleValidation($cart);
        if (! $sampleValidation['is_valid']) {
            return Redirect::route($this->cartRoute())->with('error', $sampleValidation['message']);
        }

        $isGuest = !$userId;

        // Validate checkout data
        $validated = $request->validate(
            $this->checkoutService->validateCheckoutData($request->all(), $isGuest, $this->channel())
        );

        // Trade-only fields on the trade checkout page: prepend to notes so
        // dispatch/invoicing still get them today (proper columns to follow
        // in a separate migration). Retail POSTs simply won't have them.
        $notes = $validated['notes'] ?? null;
        if ($this->channel() === \App\Domain\Cart\Models\Cart::CHANNEL_TRADE) {
            $tradePrefixes = [];
            if (! empty($validated['po_number'])) {
                $tradePrefixes[] = 'PO: ' . $validated['po_number'];
            }
            if ($request->boolean('deliver_to_site')) {
                $tradePrefixes[] = 'Deliver to build site: YES';
            }
            if ($tradePrefixes) {
                $prefix = implode(' · ', $tradePrefixes);
                $notes = $notes ? $prefix . "\n\n" . $notes : $prefix;
            }
        }

        // Prepare checkout data
        $checkoutData = [
            'contact' => [
                'name' => $validated['contact']['name'] ?? $validated['shipping_address']['name'],
                'email' => $validated['contact']['email'],
                'phone' => $validated['contact']['phone'] ?? null,
                'marketing_opt_in' => $request->boolean('marketing_opt_in', false),
            ],
            'shipping_address' => $validated['shipping_address'],
            'billing_address' => $request->boolean('billing_same_as_shipping', true)
                ? $validated['shipping_address']
                : ($validated['billing_address'] ?? $validated['shipping_address']),
            'shipping_method' => $validated['shipping_method'],
            'payment_method' => $validated['payment_method'],
            'notes' => $notes,
        ];

        try {
            $order = $this->checkoutService->processCheckout($cart, $checkoutData);

            // Per-channel session key so a user completing retail checkout in
            // tab A and trade checkout in tab B can revisit BOTH success pages
            // — a single shared key would let the second write clobber the
            // first and lock the earlier one out.
            $request->session()->put($this->orderSuccessTokenKey(), $order->order_number);

            return Redirect::route($this->successRouteName(), ['order' => $order->order_number])
                ->with('success', 'Order placed successfully!');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Checkout failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return Redirect::back()
                ->withErrors(['checkout' => 'Failed to process order. Please try again.'])
                ->withInput();
        }
    }

    /**
     * Session key that binds a completed order to this browser session for
     * guest access to the success page. Overridden per-channel so retail and
     * trade success pages don't overwrite each other's tokens.
     */
    protected function orderSuccessTokenKey(): string
    {
        return 'order_success_token';
    }

    /**
     * Named route to redirect to after checkout. Overridden by the trade
     * controller so trade orders land on /builder/checkout/success/{order}.
     */
    protected function successRouteName(): string
    {
        return 'checkout.success';
    }

    /**
     * Empty-cart redirect. Overridden by the trade controller so a builder
     * whose trade cart is empty gets bounced back to /builder/shop instead
     * of the retail /shop.
     */
    protected function emptyCartRoute(): string
    {
        return 'shop.index';
    }

    /**
     * The channel's cart index route. Used when the sample validation gate
     * bounces the user back one step.
     */
    protected function cartRoute(): string
    {
        return 'cart.index';
    }

    /**
     * The Inertia component the trade success page renders. Overridden so
     * the trade checkout can present a dispatch-note style page instead of
     * a retail receipt.
     */
    protected function successInertiaComponent(): string
    {
        return 'Storefront/Checkout/Success';
    }

    /**
     * Display order confirmation page.
     */
    public function success(Request $request, string $order): Response|RedirectResponse
    {
        $orderModel = \App\Models\Order::where('order_number', $order)->first();

        if (!$orderModel) {
            return Redirect::route($this->emptyCartRoute())->with('error', 'Order not found.');
        }

        // Refuse to render a retail order through the trade success page
        // (or vice versa) even for the right user. The template + CTAs would
        // be wrong; the URL parameter itself has to be gated on channel.
        $isTradeOrder = (bool) $orderModel->is_builder_order;
        $wantsTradeChannel = $this->channel() === \App\Domain\Cart\Models\Cart::CHANNEL_TRADE;
        if ($isTradeOrder !== $wantsTradeChannel) {
            return Redirect::route($this->emptyCartRoute())->with('error', 'Order not found.');
        }

        $userId = $request->user()?->id;

        if ($orderModel->user_id) {
            // Authenticated order: the logged-in user must be the owner.
            if ($orderModel->user_id !== $userId) {
                return Redirect::route($this->emptyCartRoute())->with('error', 'Order not found.');
            }
        } else {
            // Guest order: verify this browser session placed it. session()->pull()
            // reads the token AND removes it in one step — the success page is a
            // one-time view. Trade orders can never be guest orders, but the
            // logic is uniform.
            $sessionToken = $request->session()->pull($this->orderSuccessTokenKey());

            if ($sessionToken !== $order) {
                return Redirect::route($this->emptyCartRoute())->with('error', 'Order not found.');
            }
        }

        $orderModel->load('items');

        return Inertia::render($this->successInertiaComponent(), [
            'order' => [
                'order_number' => $orderModel->order_number,
                'status' => $orderModel->status,
                'customer_name' => $orderModel->customer_name,
                'customer_email' => $orderModel->customer_email,
                'subtotal' => $orderModel->subtotal,
                'tax' => $orderModel->tax,
                'shipping_cost' => $orderModel->shipping_cost,
                'discount' => $orderModel->discount,
                'total' => $orderModel->total,
                'shipping_address' => $orderModel->shipping_address,
                'payment_method' => $orderModel->payment_method,
                'created_at' => $orderModel->created_at->format('M d, Y h:i A'),
                'items' => $orderModel->items->map(function ($item) {
                    return [
                        'name' => $item->name,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'line_total' => $item->price * $item->quantity,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Get saved addresses for logged-in user.
     */
    protected function getSavedAddresses($user): array
    {
        // TODO: Implement address book feature
        // For now, return empty array
        return [];
    }
}
