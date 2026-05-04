<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Cart\Services\CartService;
use App\Domain\Cart\Services\CheckoutService;
use App\Domain\Cart\Services\PricingService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService,
        protected PricingService $pricingService
    ) {}

    /**
     * Display checkout page.
     * Supports both guest and logged-in users.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if (!$cart || $cart->isEmpty()) {
            return Redirect::route('shop.index')->with('info', 'Your cart is empty.');
        }

        // Sample minimum gate: 1-3 samples is invalid
        $sampleValidation = $this->pricingService->getSampleValidation($cart);
        if (! $sampleValidation['is_valid']) {
            return Redirect::route('cart.index')->with('error', $sampleValidation['message']);
        }

        $summary = $this->checkoutService->getCheckoutSummary($cart);
        $user = $request->user();

        return Inertia::render('Storefront/Checkout/Index', [
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
     * Process checkout and create order.
     */
    public function store(Request $request): RedirectResponse
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId);

        if (!$cart || $cart->isEmpty()) {
            return Redirect::route('shop.index')->with('error', 'Your cart is empty.');
        }

        // Sample minimum gate (authoritative, server-side)
        $sampleValidation = $this->pricingService->getSampleValidation($cart);
        if (! $sampleValidation['is_valid']) {
            return Redirect::route('cart.index')->with('error', $sampleValidation['message']);
        }

        $isGuest = !$userId;

        // Validate checkout data
        $validated = $request->validate(
            $this->checkoutService->validateCheckoutData($request->all(), $isGuest)
        );

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
            'notes' => $validated['notes'] ?? null,
        ];

        try {
            $order = $this->checkoutService->processCheckout($cart, $checkoutData);

            return Redirect::route('checkout.success', ['order' => $order->order_number])
                ->with('success', 'Order placed successfully!');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return Redirect::back()
                ->withErrors(['checkout' => 'Failed to process order. Please try again.'])
                ->withInput();
        }
    }

    /**
     * Display order confirmation page.
     */
    public function success(Request $request, string $order): Response|RedirectResponse
    {
        $orderModel = \App\Models\Order::where('order_number', $order)->first();

        if (!$orderModel) {
            return Redirect::route('shop.index')->with('error', 'Order not found.');
        }

        // Only show order to owner or if recently placed (within session)
        $userId = $request->user()?->id;
        if ($orderModel->user_id && $orderModel->user_id !== $userId) {
            return Redirect::route('shop.index')->with('error', 'Order not found.');
        }

        $orderModel->load('items');

        return Inertia::render('Storefront/Checkout/Success', [
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
