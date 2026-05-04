import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import api from '@/Support/api';

export default function Cart() {
    const [cart, setCart] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingItems, setUpdatingItems] = useState(new Set());

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const response = await api.cart.index();
            setCart(response.data);
        } catch (error) {
            console.error('Failed to load cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        if (quantity < 1) return;

        setUpdatingItems((prev) => new Set(prev).add(itemId));
        try {
            await api.cart.update(itemId, quantity);
            await loadCart();
            window.dispatchEvent(new CustomEvent('cart-updated'));
        } catch (error) {
            console.error('Failed to update quantity:', error);
        } finally {
            setUpdatingItems((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const removeItem = async (itemId) => {
        setUpdatingItems((prev) => new Set(prev).add(itemId));
        try {
            await api.cart.remove(itemId);
            await loadCart();
            window.dispatchEvent(new CustomEvent('cart-updated'));
        } catch (error) {
            console.error('Failed to remove item:', error);
        } finally {
            setUpdatingItems((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const clearCart = async () => {
        if (!confirm('Are you sure you want to clear your cart?')) return;

        setIsLoading(true);
        try {
            await api.cart.clear();
            await loadCart();
            window.dispatchEvent(new CustomEvent('cart-updated'));
        } catch (error) {
            console.error('Failed to clear cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const items = cart?.items || [];
    const subtotal = cart?.subtotal || 0;
    const total = cart?.total || 0;
    const isEmpty = items.length === 0;

    return (
        <PublicLayout>
            <Head title="Shopping Cart" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                <p className="mt-2 text-gray-600">
                    {isEmpty ? 'Your cart is empty.' : `${items.length} item${items.length !== 1 ? 's' : ''} in your cart.`}
                </p>
            </div>

            {isLoading ? (
                <div className="py-12 text-center">
                    <svg
                        className="mx-auto h-8 w-8 animate-spin text-brand"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <p className="mt-4 text-sm text-gray-500">Loading your cart...</p>
                </div>
            ) : isEmpty ? (
                <div className="py-12 text-center">
                    <svg
                        className="mx-auto h-16 w-16 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    <p className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</p>
                    <p className="mt-2 text-sm text-gray-500">
                        Start shopping to add items to your cart.
                    </p>
                    <Link
                        href="/shop"
                        className="mt-6 inline-block rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand/90"
                    >
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="divide-y divide-gray-200">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex gap-4 p-4 ${
                                            updatingItems.has(item.id) ? 'opacity-50' : ''
                                        }`}
                                    >
                                        {/* Image */}
                                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
                                            {item.product?.image_url ? (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-1 flex-col">
                                            <div className="flex justify-between">
                                                <div>
                                                    <Link
                                                        href={route('products.show', item.product?.slug)}
                                                        className="font-semibold text-gray-900 hover:text-brand"
                                                    >
                                                        {item.product?.name}
                                                    </Link>
                                                    {item.variant && (
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            {item.variant.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="text-base font-semibold text-gray-900">
                                                    ${(item.price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between pt-4">
                                                {/* Quantity */}
                                                <div className="flex items-center rounded-md border border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                                                        className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                        </svg>
                                                    </button>
                                                    <span className="w-10 text-center text-sm font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={updatingItems.has(item.id)}
                                                        className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    disabled={updatingItems.has(item.id)}
                                                    className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Clear Cart */}
                            <div className="border-t border-gray-200 p-4">
                                <button
                                    type="button"
                                    onClick={clearCart}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Clear Cart
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

                            <dl className="mt-6 space-y-4">
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-600">Subtotal</dt>
                                    <dd className="text-sm font-medium text-gray-900">
                                        ${subtotal.toLocaleString()}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-600">Shipping</dt>
                                    <dd className="text-sm font-medium text-gray-900">
                                        Calculated at checkout
                                    </dd>
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between">
                                        <dt className="text-base font-semibold text-gray-900">Total</dt>
                                        <dd className="text-base font-semibold text-gray-900">
                                            ${total.toLocaleString()}
                                        </dd>
                                    </div>
                                </div>
                            </dl>

                            <Link
                                href="/checkout"
                                className="mt-6 block w-full rounded-md bg-brand px-6 py-3 text-center text-sm font-semibold text-white hover:bg-brand/90"
                            >
                                Proceed to Checkout
                            </Link>

                            <Link
                                href="/shop"
                                className="mt-3 block w-full rounded-md border border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
