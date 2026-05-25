import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

// ── Status configs (mirrors Index.jsx) ───────────────────────────────────────

const ORDER_STATUS = {
    pending:    { label: 'Pending',    cls: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
    confirmed:  { label: 'Confirmed',  cls: 'bg-blue-50   text-blue-700   ring-blue-200'   },
    processing: { label: 'Processing', cls: 'bg-blue-50   text-blue-700   ring-blue-200'   },
    shipped:    { label: 'Shipped',    cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
    delivered:  { label: 'Delivered',  cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    cancelled:  { label: 'Cancelled',  cls: 'bg-red-50    text-red-700    ring-red-200'    },
    refunded:   { label: 'Refunded',   cls: 'bg-gray-50   text-gray-600   ring-gray-200'   },
};

const PAYMENT_STATUS = {
    pending:  { label: 'Pending', cls: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
    paid:     { label: 'Paid',    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    failed:   { label: 'Failed',  cls: 'bg-red-50    text-red-700    ring-red-200'    },
    refunded: { label: 'Refunded',cls: 'bg-gray-50   text-gray-600   ring-gray-200'   },
};

const PAYMENT_METHOD_LABELS = {
    cod:  'Cash on Delivery',
    upi:  'UPI',
    card: 'Credit / Debit Card',
};

const SHIPPING_METHOD_LABELS = {
    standard: 'Standard Shipping (5–7 business days)',
    express:  'Express Shipping (2–3 business days)',
};

// ── Timeline definition ───────────────────────────────────────────────────────

const TIMELINE_STEPS = [
    { key: 'placed',     label: 'Order Placed',     statuses: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] },
    { key: 'confirmed',  label: 'Confirmed',         statuses: ['confirmed', 'processing', 'shipped', 'delivered'] },
    { key: 'processing', label: 'Processing',        statuses: ['processing', 'shipped', 'delivered'] },
    { key: 'shipped',    label: 'Shipped',           statuses: ['shipped', 'delivered'] },
    { key: 'delivered',  label: 'Delivered',         statuses: ['delivered'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(currency, amount) {
    const symbol = currency === 'AUD' ? 'A$' : (currency ?? '$');
    return `${symbol}${Number(amount ?? 0).toFixed(2)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ map, value }) {
    const cfg = map[value] ?? { label: value, cls: 'bg-gray-50 text-gray-600 ring-gray-200' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

function SectionCard({ title, children, className = '' }) {
    return (
        <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
            {title && (
                <div className="border-b border-gray-100 px-5 py-3">
                    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                </div>
            )}
            <div className="px-5 py-4">{children}</div>
        </div>
    );
}

// ── Order Status Timeline ─────────────────────────────────────────────────────

function OrderTimeline({ status }) {
    const isCancelled = status === 'cancelled' || status === 'refunded';

    if (isCancelled) {
        return (
            <SectionCard title="Order Status">
                <div className="flex items-center gap-3 rounded-lg bg-red-50 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-red-700 capitalize">{status}</p>
                        <p className="text-xs text-red-500">This order has been {status}.</p>
                    </div>
                </div>
            </SectionCard>
        );
    }

    return (
        <SectionCard title="Order Status">
            <div className="relative flex items-start justify-between gap-2 overflow-x-auto pb-1 sm:justify-start sm:gap-0">
                {TIMELINE_STEPS.map((step, idx) => {
                    const isActive   = step.statuses.includes(status);
                    const isCurrent  = step.key === status || (step.key === 'placed' && status === 'pending');
                    const isLast     = idx === TIMELINE_STEPS.length - 1;

                    return (
                        <div key={step.key} className="relative flex flex-1 flex-col items-center last:flex-none sm:flex-1">
                            {/* Connector line */}
                            {!isLast && (
                                <div className="absolute left-1/2 top-4 h-0.5 w-full">
                                    <div className={`h-full transition-colors duration-300 ${isActive && TIMELINE_STEPS[idx + 1]?.statuses.includes(status) ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                </div>
                            )}

                            {/* Circle */}
                            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                                isActive
                                    ? 'border-emerald-500 bg-emerald-500'
                                    : 'border-gray-200 bg-white'
                            }`}>
                                {isActive ? (
                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                                )}
                            </div>

                            {/* Label */}
                            <p className={`mt-2 whitespace-nowrap text-center text-[11px] font-medium ${
                                isActive ? 'text-emerald-700' : 'text-gray-400'
                            }`}>
                                {step.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </SectionCard>
    );
}

// ── Order Items ───────────────────────────────────────────────────────────────

function OrderItems({ items, currency }) {
    return (
        <SectionCard title="Items Ordered">
            <div className="divide-y divide-gray-100">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        {/* Product image */}
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                            {item.product ? (
                                <img
                                    src={item.product.image_url}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => { e.target.src = '/images/placeholder-product.svg'; }}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-300">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Product info */}
                        <div className="flex flex-1 flex-col gap-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                    {item.product ? (
                                        <Link
                                            href={`/products/${item.product.slug}`}
                                            className="text-sm font-semibold text-gray-900 hover:text-brand transition-colors line-clamp-2"
                                        >
                                            {item.name}
                                        </Link>
                                    ) : (
                                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.name}</p>
                                    )}

                                    {item.variant && (
                                        <p className="mt-0.5 text-xs text-gray-500">{item.variant.name}</p>
                                    )}

                                    {item.is_sample && (
                                        <span className="mt-1 inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 ring-1 ring-inset ring-purple-200">
                                            Sample
                                        </span>
                                    )}
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-gray-900">{fmt(currency, item.line_total)}</p>
                                    <p className="text-xs text-gray-400">{fmt(currency, item.price)} × {item.quantity}</p>
                                </div>
                            </div>

                            {/* Meta row */}
                            <div className="flex flex-wrap gap-3 text-[11px] text-gray-400">
                                {(item.sku || item.variant?.sku) && (
                                    <span>SKU: {item.variant?.sku ?? item.sku}</span>
                                )}
                                {item.product?.sqm_per_box && (
                                    <span>{item.product.sqm_per_box} m²/box</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}

// ── Order Summary ─────────────────────────────────────────────────────────────

function OrderSummary({ order }) {
    const { currency, subtotal, discount, shipping_cost, tax, total } = order;

    return (
        <SectionCard title="Order Summary">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">{fmt(currency, subtotal)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Discount</span>
                        <span className="font-medium text-emerald-600">−{fmt(currency, discount)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-medium text-gray-900">
                        {shipping_cost > 0 ? fmt(currency, shipping_cost) : 'Free'}
                    </span>
                </div>
                {tax > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Tax</span>
                        <span className="font-medium text-gray-900">{fmt(currency, tax)}</span>
                    </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-base font-bold text-gray-900">{fmt(currency, total)}</span>
                </div>
            </div>
        </SectionCard>
    );
}

// ── Payment Info ──────────────────────────────────────────────────────────────

function PaymentInfo({ order }) {
    return (
        <SectionCard title="Payment">
            <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status</span>
                    <StatusBadge map={PAYMENT_STATUS} value={order.payment_status} />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-500">Method</span>
                    <span className="font-medium text-gray-900">
                        {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method ?? '—'}
                    </span>
                </div>
                {order.shipping_method && (
                    <div className="flex items-start justify-between gap-4">
                        <span className="shrink-0 text-gray-500">Shipping</span>
                        <span className="text-right font-medium text-gray-900">
                            {SHIPPING_METHOD_LABELS[order.shipping_method] ?? order.shipping_method}
                        </span>
                    </div>
                )}
            </div>
        </SectionCard>
    );
}

// ── Shipping Address ──────────────────────────────────────────────────────────

function ShippingAddress({ address }) {
    if (!address) return null;

    return (
        <SectionCard title="Shipping Address">
            <address className="space-y-0.5 text-sm not-italic text-gray-700">
                {address.name      && <p className="font-semibold text-gray-900">{address.name}</p>}
                {address.phone     && <p className="text-gray-500">{address.phone}</p>}
                {address.address_line_1 && <p>{address.address_line_1}</p>}
                {address.address_line_2 && <p>{address.address_line_2}</p>}
                {(address.city || address.state || address.postal_code) && (
                    <p>
                        {[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}
                    </p>
                )}
                {address.country   && <p>{address.country}</p>}
            </address>
        </SectionCard>
    );
}

// ── Order Metadata ────────────────────────────────────────────────────────────

function OrderMeta({ order }) {
    return (
        <SectionCard title="Order Details">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Order No.</span>
                    <span className="font-mono font-semibold text-gray-900">{order.order_number ?? `#${order.id}`}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Date</span>
                    <span className="text-gray-900">{order.created_at}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Time</span>
                    <span className="text-gray-900">{order.created_time}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Order Status</span>
                    <StatusBadge map={ORDER_STATUS} value={order.status} />
                </div>
            </div>
        </SectionCard>
    );
}

// ── Cancel Order ──────────────────────────────────────────────────────────────

function CancelButton({ orderId }) {
    const [confirming, setConfirming] = useState(false);
    const [loading,    setLoading]    = useState(false);

    const handleCancel = () => {
        setLoading(true);
        router.patch(
            `/orders/${orderId}/cancel`,
            {},
            {
                onFinish: () => { setLoading(false); setConfirming(false); },
                onError:  () => { setLoading(false); setConfirming(false); },
            },
        );
    };

    if (confirming) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Cancel this order?</span>
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                    {loading ? 'Cancelling…' : 'Yes, cancel'}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Keep order
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
            Cancel Order
        </button>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderShow({ order, canCancel = false }) {
    const isPending   = order.status === 'pending';
    const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

    return (
        <DashboardLayout title={`Order ${order.order_number ?? '#' + order.id}`}>
            <Head title={`Order ${order.order_number ?? '#' + order.id}`} />

            {/* Page header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-5">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-base font-bold tracking-tight text-gray-900">
                            {order.order_number ?? `Order #${order.id}`}
                        </h1>
                        <StatusBadge map={ORDER_STATUS}   value={order.status}         />
                        <StatusBadge map={PAYMENT_STATUS} value={order.payment_status} />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Placed on {order.created_at} at {order.created_time}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {isPending && canCancel && <CancelButton orderId={order.id} />}
                    <Link href={route('orders.index')} className="btn-secondary text-xs">
                        ← All Orders
                    </Link>
                </div>
            </div>

            {/* Timeline */}
            <div className="mb-5">
                <OrderTimeline status={order.status} />
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Left column — items + notes */}
                <div className="space-y-5 lg:col-span-2">
                    <OrderItems items={order.items} currency={order.currency} />

                    {order.notes && (
                        <SectionCard title="Order Notes">
                            <p className="text-sm text-gray-600">{order.notes}</p>
                        </SectionCard>
                    )}
                </div>

                {/* Right column — meta, summary, payment, address */}
                <div className="space-y-5">
                    <OrderMeta    order={order} />
                    <OrderSummary order={order} />
                    <PaymentInfo  order={order} />
                    <ShippingAddress address={order.shipping_address} />
                </div>
            </div>

            {/* Bottom actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
                <Link href={route('shop.index')} className="btn-primary text-xs">
                    Continue Shopping
                </Link>
                <Link href={route('orders.index')} className="btn-secondary text-xs">
                    View All Orders
                </Link>
            </div>
        </DashboardLayout>
    );
}
