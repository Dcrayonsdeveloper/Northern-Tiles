import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';

// ── Status badge config ───────────────────────────────────────────────────────

const ORDER_STATUS = {
    pending:    { label: 'Pending',    cls: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
    processing: { label: 'Processing', cls: 'bg-blue-50   text-blue-700   ring-blue-200'   },
    shipped:    { label: 'Shipped',    cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
    delivered:  { label: 'Delivered',  cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    cancelled:  { label: 'Cancelled',  cls: 'bg-red-50    text-red-700    ring-red-200'    },
    refunded:   { label: 'Refunded',   cls: 'bg-gray-50   text-gray-600   ring-gray-200'   },
};

const PAYMENT_STATUS = {
    pending:  { label: 'Unpaid',   cls: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
    paid:     { label: 'Paid',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    failed:   { label: 'Failed',   cls: 'bg-red-50    text-red-700    ring-red-200'    },
    refunded: { label: 'Refunded', cls: 'bg-gray-50   text-gray-600   ring-gray-200'   },
};

function StatusBadge({ map, value }) {
    const cfg = map[value] ?? { label: value, cls: 'bg-gray-50 text-gray-600 ring-gray-200' };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
            <svg
                className="mb-3 h-10 w-10 text-gray-300"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
            >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="12" y2="17" />
            </svg>
            <p className="text-sm font-medium text-gray-700">No orders yet</p>
            <p className="mt-1 text-xs text-gray-400">Your order history will appear here once you place an order.</p>
            <Link href={route('shop.index')} className="btn-primary mt-5 text-xs">
                Browse Products
            </Link>
        </div>
    );
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({ order }) {
    const currencySymbol = order.currency === 'AUD' ? 'A$' : order.currency;

    return (
        <div className="admin-card group transition-shadow hover:shadow-md">
            {/* Card header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <Link
                        href={route('orders.show', order.id)}
                        className="text-sm font-semibold text-gray-900 hover:text-brand transition-colors"
                    >
                        {order.order_number ?? `#${order.id}`}
                    </Link>
                    <div className="mt-0.5 text-xs text-gray-400">{order.created_at}</div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge map={ORDER_STATUS}   value={order.status}         />
                    <StatusBadge map={PAYMENT_STATUS} value={order.payment_status} />
                </div>
            </div>

            {/* Item preview */}
            <div className="mt-3 space-y-1.5">
                {order.items_preview.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                        <span className="truncate pr-4">{item.name}</span>
                        <span className="shrink-0 tabular-nums text-gray-400">×{item.quantity}</span>
                    </div>
                ))}
                {order.item_count > 3 && (
                    <div className="text-[11px] text-gray-400">
                        +{order.item_count - 3} more item{order.item_count - 3 !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="text-sm font-bold tabular-nums text-gray-900">
                    {currencySymbol}{order.total.toFixed(2)}
                </div>
                <Link
                    href={route('orders.show', order.id)}
                    className="btn-secondary text-xs"
                >
                    View Details →
                </Link>
            </div>
        </div>
    );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ links }) {
    if (!links || links.length <= 3) return null;

    return (
        <div className="flex flex-wrap items-center justify-center gap-1">
            {links.map((link, i) => {
                if (link.url === null) {
                    return (
                        <span
                            key={i}
                            className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs text-gray-300"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }
                return (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs transition-colors duration-100 ${
                            link.active
                                ? 'bg-gray-900 font-semibold text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderHistoryIndex({ orders }) {
    const { data, links, from, to, total } = orders;

    return (
        <DashboardLayout title="Order History">
            <Head title="Order History" />

            {/* Page header */}
            <div className="mb-6 border-b border-gray-100 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-gray-900">
                            Order History
                        </h1>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {total > 0
                                ? `Showing ${from}–${to} of ${total} order${total !== 1 ? 's' : ''}`
                                : 'All your past orders in one place'}
                        </p>
                    </div>
                    <Link href={route('dashboard')} className="btn-secondary text-xs">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>

            {/* Content */}
            {data.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>

                    {links && links.length > 3 && (
                        <div className="mt-8">
                            <Pagination links={links} />
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
