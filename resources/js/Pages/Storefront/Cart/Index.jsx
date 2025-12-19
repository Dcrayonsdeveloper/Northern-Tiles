import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';

export default function Index({ items: initialItems, subtotal: initialSubtotal }) {
    const [items, setItems] = useState(initialItems ?? []);
    const [subtotal, setSubtotal] = useState(initialSubtotal ?? 0);
    const [updating, setUpdating] = useState(null);

    // Fetch fresh cart data
    const fetchCart = useCallback(async () => {
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
                setItems(data.items || []);
                setSubtotal(data.totals?.subtotal || 0);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        }
    }, []);

    // Update quantity via API
    const updateQty = async (itemId, quantity) => {
        if (quantity < 1 || quantity > 99) return;

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
                window.dispatchEvent(new CustomEvent('cart-updated'));
            }
        } catch (error) {
            console.error('Failed to update quantity:', error);
        } finally {
            setUpdating(null);
        }
    };

    // Remove item via API
    const remove = async (itemId) => {
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

    return (
        <PublicLayout>
            <Head title="Cart" />
            <Container>
                <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cart</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Review items before checkout.
                    </p>
                </div>
                <Link
                    href={route('shop.index')}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                    Continue shopping
                </Link>
            </div>

            {items.length === 0 ? (
                <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow-sm">
                    <div className="text-sm text-gray-700">
                        Your cart is empty.
                    </div>
                    <Link
                        href={route('shop.index')}
                        className="mt-4 inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        Go to shop
                    </Link>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                            <div className="divide-y">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-4 p-4 transition-opacity ${updating === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <div className="h-16 w-20 overflow-hidden rounded bg-gray-100">
                                            {item.product?.image_url ? (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product?.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : null}
                                        </div>

                                        <div className="flex-1">
                                            <Link
                                                href={route(
                                                    'products.show',
                                                    item.product?.slug,
                                                )}
                                                className="text-sm font-semibold text-gray-900 hover:underline"
                                            >
                                                {item.product?.name}
                                            </Link>
                                            <div className="mt-1 text-sm text-gray-600">
                                                ₹{item.price?.toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Quantity stepper */}
                                            <div className="flex items-center rounded-md border border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.id, item.quantity - 1)}
                                                    disabled={updating === item.id || item.quantity <= 1}
                                                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                    </svg>
                                                </button>
                                                <span className="min-w-[2.5rem] text-center text-sm font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.id, item.quantity + 1)}
                                                    disabled={updating === item.id || item.quantity >= 99}
                                                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => remove(item.id)}
                                                disabled={updating === item.id}
                                                className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="w-24 text-right text-sm font-semibold text-gray-900">
                                            ₹{item.line_total?.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-gray-900">
                            Summary
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-semibold text-gray-900">
                                ₹{subtotal?.toLocaleString()}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-semibold text-gray-900">Calculated at checkout</span>
                        </div>
                        <div className="mt-4 border-t pt-4 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">
                                Total
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                                ₹{subtotal?.toLocaleString()}
                            </span>
                        </div>
                        <Link
                            href={route('checkout.index')}
                            className="mt-4 block rounded-md bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-800"
                        >
                            Checkout
                        </Link>
                    </div>
                </div>
            )}
            </Container>
        </PublicLayout>
    );
}
