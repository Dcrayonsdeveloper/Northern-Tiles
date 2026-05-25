import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useCallback, useRef } from 'react';
import ProductImage from '@/Components/Catalog/ProductImage';

function CartCrossSell({ products, onAdd, disabled }) {
    const ref = useRef(null);
    if (!products || products.length === 0) return null;

    return (
        <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">You May Also Like</h2>
            <div ref={ref} className="flex gap-4 overflow-x-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none' }}>
                {products.map(p => (
                    <div key={p.id} className="flex-shrink-0 w-[180px] rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                        <Link href={route('products.show', p.slug)}>
                            <div className="aspect-square overflow-hidden rounded-md bg-gray-50">
                                <ProductImage src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                            </div>
                        </Link>
                        <p className="mt-2 text-[12px] font-medium text-gray-900 line-clamp-2">{p.name}</p>
                        <p className="mt-1 text-[13px] font-semibold text-gray-900">${parseFloat(p.price || 0).toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">/ sqm</span></p>
                        <button
                            type="button"
                            onClick={() => !disabled && onAdd(p.id)}
                            disabled={disabled}
                            className={`mt-2 w-full rounded px-3 py-1.5 text-[12px] font-semibold text-white transition ${disabled ? 'cursor-not-allowed bg-gray-300' : 'bg-brand hover:bg-brand/90'}`}
                        >
                            {disabled ? 'Unavailable' : 'Add to Cart'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Index({ items: initialItems, subtotal: initialSubtotal, crossSellProducts }) {
    const { auth } = usePage().props;
    const isInactive = !!auth?.user && auth.user.is_active === false;

    const [items, setItems] = useState(initialItems ?? []);
    const [subtotal, setSubtotal] = useState(initialSubtotal ?? 0);
    const [updating, setUpdating] = useState(null);

    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content;

    // Fetch fresh cart from API and sync local state
    const fetchCart = useCallback(async () => {
        try {
            const response = await fetch('/api/cart', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (response.status === 401) {
                window.location.href = route('login');
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setItems(data.items || []);
                setSubtotal(data.totals?.subtotal || 0);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        }
    }, []);

    // Update quantity — optimistic: update local state immediately, roll back on failure
    const updateQty = async (itemId, newQty) => {
        // Ensure numeric — item.quantity is a decimal string from Laravel's decimal:2 cast
        const qty = parseFloat(newQty);
        if (!isFinite(qty) || qty < 1 || qty > 99) return;

        // Snapshot current state for rollback
        const prevItems    = items;
        const prevSubtotal = subtotal;

        // Optimistic update
        setUpdating(itemId);
        setItems(prev =>
            prev.map(it =>
                it.id === itemId
                    ? { ...it, quantity: qty, line_total: parseFloat(it.price) * qty }
                    : it
            )
        );
        setSubtotal(prev => {
            const target = items.find(it => it.id === itemId);
            if (!target) return prev;
            const diff = (qty - parseFloat(target.quantity)) * parseFloat(target.price);
            return parseFloat(prev) + diff;
        });

        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ quantity: qty }),
            });

            if (response.ok) {
                // Sync server-authoritative totals (coupons, shipping etc.)
                await fetchCart();
                window.dispatchEvent(new CustomEvent('cart-updated'));
            } else {
                // Roll back on server error
                setItems(prevItems);
                setSubtotal(prevSubtotal);
            }
        } catch (error) {
            console.error('Failed to update quantity:', error);
            setItems(prevItems);
            setSubtotal(prevSubtotal);
        } finally {
            setUpdating(null);
        }
    };

    // Remove item — optimistic: remove from local state immediately, roll back on failure
    const remove = async (itemId) => {
        const prevItems    = items;
        const prevSubtotal = subtotal;

        // Optimistic removal
        setUpdating(itemId);
        setItems(prev => prev.filter(it => it.id !== itemId));

        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                await fetchCart();
                window.dispatchEvent(new CustomEvent('cart-updated'));
            } else {
                setItems(prevItems);
                setSubtotal(prevSubtotal);
            }
        } catch (error) {
            console.error('Failed to remove item:', error);
            setItems(prevItems);
            setSubtotal(prevSubtotal);
        } finally {
            setUpdating(null);
        }
    };

    const addCrossSell = async (productId) => {
        try {
            await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ product_id: productId, quantity: 1 }),
            });
            await fetchCart();
            window.dispatchEvent(new CustomEvent('cart-updated'));
        } catch (e) {
            console.error('Failed to add item:', e);
        }
    };

    return (
        <PublicLayout>
            <Head title="Cart" />
            <Container>
                {isInactive && (
                    <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <p className="text-sm text-amber-800">Your account is inactive. Ordering is disabled.</p>
                    </div>
                )}
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
                                {items.map((item) => {
                                    const qty = parseFloat(item.quantity);
                                    const isUpdating = updating === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-4 p-4 transition-opacity ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            <div className="h-16 w-20 overflow-hidden rounded bg-gray-100">
                                                <ProductImage
                                                    src={item.product?.image_url}
                                                    alt={item.product?.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <Link
                                                    href={route('products.show', item.product?.slug)}
                                                    className="text-sm font-semibold text-gray-900 hover:underline"
                                                >
                                                    {item.product?.name}
                                                </Link>
                                                <div className="mt-1 text-sm text-gray-600">
                                                    ${parseFloat(item.price || 0).toFixed(2)} / sqm
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Quantity stepper */}
                                                <div className="flex items-center rounded-md border border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(item.id, qty - 1)}
                                                        disabled={isUpdating || qty <= 1}
                                                        className="px-3 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                        </svg>
                                                    </button>
                                                    <span className="min-w-[2.5rem] text-center text-sm font-medium">
                                                        {item.is_sample ? qty : `${qty.toFixed(2)} m²`}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(item.id, qty + 1)}
                                                        disabled={isUpdating || qty >= 99}
                                                        className="px-3 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(item.id)}
                                                    disabled={isUpdating}
                                                    className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Remove
                                                </button>
                                            </div>

                                            <div className="w-24 text-right text-sm font-semibold text-gray-900">
                                                ${parseFloat(item.line_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    );
                                })}
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
                                ${parseFloat(subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                ${parseFloat(subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        {isInactive ? (
                            <button
                                type="button"
                                disabled
                                className="mt-4 block w-full cursor-not-allowed rounded-md bg-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-400"
                            >
                                Checkout unavailable
                            </button>
                        ) : (
                            <Link
                                href={route('checkout.index')}
                                className="mt-4 block rounded-md bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                Checkout
                            </Link>
                        )}
                    </div>
                </div>
            )}

                {/* Cross-sell / Upsell */}
                <CartCrossSell products={crossSellProducts} onAdd={addCrossSell} disabled={isInactive} />
            </Container>
        </PublicLayout>
    );
}
