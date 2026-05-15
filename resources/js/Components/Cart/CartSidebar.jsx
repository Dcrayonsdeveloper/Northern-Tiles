import { Fragment, useEffect, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { router } from '@inertiajs/react';
import CartLineItem from './CartLineItem';
import CartSummary from './CartSummary';
import CartUpsells from './CartUpsells';
import CouponInput from './CouponInput';
import { d } from '@/Support/dictionary';

// Icons
function CloseIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function ShoppingBagIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
    );
}

// Sample status banner — shown above line items when samples are in cart
function SampleBanner({ totals }) {
    const count = totals.sample_count || 0;
    if (count === 0) return null;

    const max = totals.sample_max || 5;
    const remaining = totals.samples_remaining ?? Math.max(0, max - count);
    const isAtMax = totals.is_at_sample_max || count >= max;
    const sampleShipping = parseFloat(totals.sample_shipping || 0).toFixed(2);
    const currency = totals.currency_symbol || '$';
    const pct = Math.min(100, (count / max) * 100);

    // State 1: At maximum
    if (isAtMax) {
        return (
            <div className="mb-4 rounded-lg border-2 border-green-200 bg-green-50 p-3">
                <p className="text-sm font-bold text-green-800">
                    ✅ Maximum samples reached — {count} of {max}
                </p>
                <p className="mt-1 text-[11px] text-green-700">
                    Flat {currency}{sampleShipping} shipping covers all your samples.
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-green-200">
                    <div className="h-full rounded-full bg-green-500" style={{ width: '100%' }} />
                </div>
            </div>
        );
    }

    // State 2: Have samples, room for more
    return (
        <div className="mb-4 rounded-lg border-2 border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-900">
                🎁 {count} of {max} samples · flat {currency}{sampleShipping} shipping
            </p>
            <p className="mt-1 text-[11px] text-amber-800">
                Add up to {remaining} more sample{remaining !== 1 ? 's' : ''} — shipping stays at {currency}{sampleShipping}.
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200">
                <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default function CartSidebar({ open, onClose }) {
    const [cart, setCart] = useState({
        items: [],
        totals: {
            subtotal: 0,
            discount: 0,
            shipping: 0,
            tax: 0,
            grand_total: 0,
            item_count: 0,
            currency: 'AUD',
            currency_symbol: '$',
        },
        shipping_estimate: {
            estimated: 0,
            free_threshold: 999,
            amount_for_free: 999,
            is_free: false,
        },
        upsells: { items: [], title_key: '', type: '' },
        bundles: [],
        coupon: null,
    });
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(null);

    // Fetch cart data when sidebar opens
    const fetchCart = useCallback(async () => {
        if (!open) return;

        setLoading(true);
        try {
            const response = await fetch('/api/cart', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                setCart(data);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    }, [open]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Update item quantity
    const updateQuantity = async (itemId, quantity) => {
        setUpdating(itemId);
        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ quantity }),
            });

            if (response.ok) {
                await fetchCart();
                // Update cart count in header
                window.dispatchEvent(new CustomEvent('cart-updated'));
            }
        } catch (error) {
            console.error('Failed to update quantity:', error);
        } finally {
            setUpdating(null);
        }
    };

    // Remove item
    const removeItem = async (itemId) => {
        setUpdating(itemId);
        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                await fetchCart();
                window.dispatchEvent(new CustomEvent('cart-updated'));
            }
        } catch (error) {
            console.error('Failed to remove item:', error);
        } finally {
            setUpdating(null);
        }
    };

    // Add upsell to cart
    const addUpsell = async (productId) => {
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ product_id: productId, quantity: 1 }),
            });

            if (response.ok) {
                await fetchCart();
                window.dispatchEvent(new CustomEvent('cart-updated'));
            }
        } catch (error) {
            console.error('Failed to add upsell:', error);
        }
    };

    const isEmpty = cart.items.length === 0;

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col bg-white shadow-xl">
                                        {/* Header */}
                                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
                                            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                                <ShoppingBagIcon className="h-5 w-5" />
                                                {d('cart.title', 'Shopping Cart')}
                                                {cart.totals.item_count > 0 && (
                                                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white">
                                                        {cart.totals.item_count}
                                                    </span>
                                                )}
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                                                onClick={onClose}
                                            >
                                                <span className="sr-only">Close</span>
                                                <CloseIcon className="h-5 w-5" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 overflow-y-auto">
                                            {loading ? (
                                                <div className="flex h-full items-center justify-center">
                                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                                                </div>
                                            ) : isEmpty ? (
                                                <div className="flex h-full flex-col items-center justify-center px-4 py-12">
                                                    <ShoppingBagIcon className="h-16 w-16 text-gray-300" />
                                                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                                                        {d('cart.empty.title', 'Your cart is empty')}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {d('cart.empty.description', 'Start shopping to add items to your cart.')}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={onClose}
                                                        className="mt-6 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                                    >
                                                        {d('cart.empty.cta', 'Continue Shopping')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="px-4 py-4">
                                                    {/* Sample pack status banner */}
                                                    <SampleBanner totals={cart.totals} />

                                                    {/* Free shipping progress (non-sample only) */}
                                                    {!cart.shipping_estimate.is_free && cart.shipping_estimate.amount_for_free > 0 && cart.totals.subtotal > 0 && (
                                                        <div className="mb-4 rounded-lg bg-amber-50 p-3">
                                                            <p className="text-sm text-amber-800">
                                                                {d('cart.free_shipping_notice', 'Add')} {cart.totals.currency_symbol}
                                                                {cart.shipping_estimate.amount_for_free.toLocaleString()}{' '}
                                                                {d('cart.free_shipping_notice_suffix', 'more for free shipping!')}
                                                            </p>
                                                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
                                                                <div
                                                                    className="h-full rounded-full bg-amber-500 transition-all"
                                                                    style={{
                                                                        width: `${Math.min(100, (cart.totals.subtotal / cart.shipping_estimate.free_threshold) * 100)}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Cart items */}
                                                    <div className="space-y-4">
                                                        {cart.items.map((item) => (
                                                            <CartLineItem
                                                                key={item.id}
                                                                item={item}
                                                                currency={cart.totals.currency_symbol}
                                                                updating={updating === item.id}
                                                                onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                                                                onRemove={() => removeItem(item.id)}
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* Upsells */}
                                                    {cart.upsells?.items?.length > 0 && (
                                                        <CartUpsells
                                                            upsells={cart.upsells}
                                                            currency={cart.totals.currency_symbol}
                                                            onAdd={addUpsell}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        {!isEmpty && !loading && (
                                            <div className="border-t border-gray-200 px-4 py-4">
                                                {/* Coupon Input */}
                                                <div className="mb-4">
                                                    <CouponInput
                                                        appliedCoupon={cart.coupon}
                                                        currency={cart.totals.currency_symbol}
                                                        onApply={fetchCart}
                                                        onRemove={fetchCart}
                                                    />
                                                </div>

                                                <CartSummary
                                                    totals={cart.totals}
                                                    shippingEstimate={cart.shipping_estimate}
                                                    appliedCoupon={cart.coupon}
                                                />

                                                <div className="mt-4 space-y-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onClose();
                                                            router.visit('/checkout');
                                                        }}
                                                        className="block w-full rounded-md bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
                                                    >
                                                        {d('cart.checkout', 'Checkout')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={onClose}
                                                        className="block w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                                    >
                                                        {d('cart.continue_shopping', 'Continue Shopping')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
