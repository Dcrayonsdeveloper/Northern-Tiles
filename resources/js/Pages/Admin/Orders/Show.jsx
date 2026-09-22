import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

/* ── Icons ─────────────────────────────────────────────────────────── */
const Icon = ({ path, className = 'h-4 w-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
    </svg>
);

const CheckPath = 'M5 13l4 4L19 7';
const TruckPath = 'M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 100-4 2 2 0 000 4zM18 19a2 2 0 100-4 2 2 0 000 4z';
const BoxPath = 'M21 8l-9-5-9 5m18 0l-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5';
const NotePath = 'M9 12h6M9 16h4M8 4h8a2 2 0 012 2v13l-3-2-3 2-3-2-3 2V6a2 2 0 012-2z';
const ClockPath = 'M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z';
const PinPath = 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z';
const UserPath = 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6';
const CardPath = 'M3 7h18v10H3zM3 11h18';
const MailPath = 'M3 6h18v12H3zM3 7l9 6 9-6';
const PhonePath = 'M4 5c0 8.3 6.7 15 15 15v-3.5l-4-1.5-2 2a12 12 0 01-6-6l2-2L7.5 5z';

/* ── Money / dates ─────────────────────────────────────────────────── */
const money = (value, currency = 'AUD') =>
    `${currency} ${parseFloat(value || 0).toFixed(2)}`;

const when = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
};

/* ── Order Tracking ────────────────────────────────────────────────── */
/**
 * The stages are the statuses this system can actually be in — not a longer
 * courier timeline it has no way to fill. Every dot is reachable from the
 * Update Status box beside it, so nothing here can be permanently grey.
 */
function OrderTracking({ order }) {
    const stages = [
        { key: 'pending', label: 'Ordered', at: order.created_at, icon: CheckPath },
        { key: 'processing', label: 'Processing', at: null, icon: BoxPath },
        { key: 'shipped', label: 'Shipped', at: order.shipped_at, icon: TruckPath },
        { key: 'delivered', label: 'Delivered', at: order.delivered_at, icon: PinPath },
    ];

    const order_ = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = order_.indexOf(order.status);
    const halted = order.status === 'cancelled' || order.status === 'refunded';

    return (
        <div className="admin-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">Order Tracking</div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Order</span>
                    <span className="font-mono font-semibold text-gray-900">{order.order_number}</span>
                    {order.shipping_method ? (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium capitalize text-blue-700">
                            {order.shipping_method}
                        </span>
                    ) : null}
                </div>
            </div>

            {halted ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <div className="text-sm font-semibold capitalize text-red-800">Order {order.status}</div>
                    <p className="mt-0.5 text-xs text-red-700">
                        This order is no longer progressing. Set a status below to resume it.
                    </p>
                </div>
            ) : (
                <div className="mt-6 flex items-start">
                    {stages.map((stage, i) => {
                        const done = currentIndex >= i;
                        const isCurrent = currentIndex === i;
                        return (
                            <div key={stage.key} className="flex flex-1 flex-col items-center">
                                <div className="flex w-full items-center">
                                    {/* Connector rails, drawn either side so the
                                        dots stay evenly spaced at any width. */}
                                    <div className={`h-[3px] flex-1 rounded ${i === 0 ? 'bg-transparent' : done ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                    <div
                                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition ${
                                            done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                                        } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                                    >
                                        <Icon path={done && !isCurrent ? CheckPath : stage.icon} className="h-[18px] w-[18px]" />
                                    </div>
                                    <div className={`h-[3px] flex-1 rounded ${i === stages.length - 1 ? 'bg-transparent' : currentIndex > i ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                </div>
                                <div className={`mt-2 text-center text-xs font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {stage.label}
                                </div>
                                {when(stage.at) ? (
                                    <div className="mt-0.5 text-center text-[11px] text-gray-500">{when(stage.at)}</div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Item Details ──────────────────────────────────────────────────── */
function ItemDetails({ order }) {
    const items = order.items ?? [];
    const count = items.reduce((n, it) => n + Number(it.quantity || 0), 0);

    return (
        <div className="admin-card">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon path={BoxPath} className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">Item Details</span>
                </div>
                <span className="text-xs text-gray-500">{count} item{count === 1 ? '' : 's'}</span>
            </div>

            <div className="mt-3 space-y-2">
                {items.length ? items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                            {it.image_url ? (
                                <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
                            ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-gray-900">{it.name}</div>
                            <div className="mt-0.5 text-[11px] text-gray-500">
                                {it.sku ? <span>SKU: <span className="font-mono">{it.sku}</span></span> : null}
                                {it.is_sample ? <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">Sample</span> : null}
                            </div>
                            {it.product ? (
                                <Link href={`/products/${it.product.slug}`} className="text-[11px] text-brand hover:underline">
                                    View product →
                                </Link>
                            ) : null}
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] text-gray-500">Qty: {it.quantity}</div>
                            <div className="text-xs font-bold text-gray-900">{money(it.line_total, order.currency)}</div>
                            <div className="text-[11px] text-gray-400">@ {money(it.price, order.currency)}</div>
                        </div>
                    </div>
                )) : (
                    <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-xs text-gray-500">No items.</p>
                )}
            </div>
        </div>
    );
}

/* ── Customer Details ──────────────────────────────────────────────── */
function Address({ address }) {
    if (!address) return null;
    const a = typeof address === 'string' ? null : address;
    if (!a) return <p className="text-xs text-gray-700">{address}</p>;

    return (
        <p className="text-xs leading-5 text-gray-700">
            {a.name ? <span className="block font-medium text-gray-900">{a.name}</span> : null}
            {a.address_line_1 ? <span className="block">{a.address_line_1}</span> : null}
            {a.address_line_2 ? <span className="block">{a.address_line_2}</span> : null}
            <span className="block">
                {[a.city, a.state, a.postal_code].filter(Boolean).join(', ')}
            </span>
            {a.country ? <span className="block">{a.country}</span> : null}
            {a.phone ? <span className="block text-gray-500">{a.phone}</span> : null}
        </p>
    );
}

function CustomerDetails({ order }) {
    const shipping = order.shipping_address;
    const billing = order.billing_address;
    // Only worth a second panel when it differs from the delivery address.
    const billingDiffers = billing && JSON.stringify(billing) !== JSON.stringify(shipping);

    return (
        <div className="admin-card">
            <div className="flex items-center gap-2">
                <Icon path={UserPath} className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900">Customer Details</span>
            </div>

            <div className="mt-3 text-sm font-semibold text-gray-900">{order.customer_name}</div>

            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {order.customer_email ? (
                    <div className="flex items-start gap-2">
                        <Icon path={MailPath} className="mt-0.5 h-3.5 w-3.5 text-gray-400" />
                        <div>
                            <div className="text-[11px] text-gray-500">Email</div>
                            <a href={`mailto:${order.customer_email}`} className="text-xs text-gray-900 hover:text-brand">{order.customer_email}</a>
                        </div>
                    </div>
                ) : null}
                {order.customer_phone ? (
                    <div className="flex items-start gap-2">
                        <Icon path={PhonePath} className="mt-0.5 h-3.5 w-3.5 text-gray-400" />
                        <div>
                            <div className="text-[11px] text-gray-500">Phone</div>
                            <a href={`tel:${order.customer_phone}`} className="text-xs text-gray-900 hover:text-brand">{order.customer_phone}</a>
                        </div>
                    </div>
                ) : null}
            </div>

            {shipping ? (
                <div className="mt-4">
                    <div className="mb-1 flex items-center gap-1.5">
                        <Icon path={PinPath} className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-900">Shipping Address</span>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                        <Address address={shipping} />
                    </div>
                </div>
            ) : null}

            {billingDiffers ? (
                <div className="mt-3">
                    <div className="mb-1 text-xs font-semibold text-gray-900">Billing Address</div>
                    <div className="rounded-lg bg-gray-50 p-3">
                        <Address address={billing} />
                    </div>
                </div>
            ) : null}

            {/* Delivery instructions the customer typed at checkout — the one
                thing on this page that changes how the order is packed. */}
            {order.notes ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                        Order notes from customer
                    </div>
                    <p className="mt-1 whitespace-pre-line text-xs text-amber-900">{order.notes}</p>
                </div>
            ) : null}
        </div>
    );
}

/* ── Payment Summary ───────────────────────────────────────────────── */
function PaymentSummary({ order }) {
    const rows = [
        { label: 'Subtotal', value: order.subtotal },
        { label: 'Discount', value: order.discount, negative: true },
        { label: 'Shipping', value: order.shipping_cost },
        { label: 'Tax', value: order.tax },
    ].filter((r) => parseFloat(r.value || 0) !== 0 || r.label === 'Subtotal');

    return (
        <div className="admin-card">
            <div className="flex items-center gap-2">
                <Icon path={CardPath} className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900">Payment Summary</span>
            </div>

            <div className="mt-3 space-y-2">
                {rows.map((r) => (
                    <div key={r.label} className="flex justify-between text-xs">
                        <span className="text-gray-600">{r.label}</span>
                        <span className={`font-medium ${r.negative ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {r.negative ? '−' : ''}{money(r.value, order.currency)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                <span className="text-base font-bold text-gray-900">{money(order.total, order.currency)}</span>
            </div>
        </div>
    );
}

/* ── Admin Note ────────────────────────────────────────────────────── */
/**
 * Staff-only note. Kept apart from the customer's checkout note, which is
 * shown in the customer card — merging the two would put internal remarks in
 * front of whoever reads the order and lose the delivery instruction.
 */
function AdminNote({ order }) {
    const { data, setData, put, processing } = useForm({
        admin_note: order?.admin_note ?? '',
    });

    const [saved, setSaved] = useState(false);
    const dirty = (data.admin_note ?? '') !== (order?.admin_note ?? '');

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.orders.update', order.id), {
            preserveScroll: true,
            onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
        });
    };

    return (
        <div className="admin-card">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon path={NotePath} className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">Admin Note</span>
                </div>
                {saved ? <span className="text-[11px] text-emerald-600">Saved</span> : null}
            </div>

            <p className="mt-0.5 text-[11px] text-gray-500">Internal only — the customer never sees this.</p>

            <form onSubmit={submit} className="mt-3">
                <textarea
                    value={data.admin_note}
                    onChange={(e) => setData('admin_note', e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Called customer, delivery moved to Friday…"
                    className="admin-input w-full text-xs"
                />
                <button type="submit" disabled={processing || !dirty} className="btn-primary mt-2 w-full disabled:opacity-50">
                    {processing ? 'Saving…' : data.admin_note ? 'Save note' : 'Add note'}
                </button>
            </form>
        </div>
    );
}

/* ── Update Status ─────────────────────────────────────────────────── */
function UpdateStatus({ order, statuses, paymentStatuses }) {
    const { data, setData, put, processing } = useForm({
        status: order?.status ?? 'pending',
        payment_status: order?.payment_status ?? 'pending',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.orders.update', order.id));
    };

    const dirty = data.status !== order.status || data.payment_status !== order.payment_status;

    return (
        <div className="admin-card">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Update Status</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-700">
                    {order.status}
                </span>
            </div>

            <form onSubmit={submit} className="mt-3 space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Order Status</label>
                    <select
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="mt-1 admin-select w-full capitalize"
                    >
                        {(statuses ?? []).map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700">Payment Status</label>
                    <select
                        value={data.payment_status}
                        onChange={(e) => setData('payment_status', e.target.value)}
                        className="mt-1 admin-select w-full capitalize"
                    >
                        {(paymentStatuses ?? []).map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <button type="submit" disabled={processing || !dirty} className="btn-primary w-full disabled:opacity-50">
                    {processing ? 'Updating…' : 'Update Status'}
                </button>
            </form>
        </div>
    );
}

/* ── Order Info ────────────────────────────────────────────────────── */
function OrderInfo({ order }) {
    const paymentLabel = {
        cod: 'Cash on Delivery',
        upi: 'UPI',
        card: 'Credit/Debit Card',
    }[order.payment_method] ?? order.payment_method;

    const rows = [
        { label: 'Order Date', value: when(order.created_at) },
        {
            label: 'Payment Status',
            badge: order.payment_status,
            tone: order.payment_status === 'paid'
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : order.payment_status === 'failed'
                    ? 'bg-red-50 text-red-700 ring-red-200'
                    : 'bg-yellow-50 text-yellow-700 ring-yellow-200',
        },
        { label: 'Payment Method', value: paymentLabel },
        { label: 'Shipping Method', value: order.shipping_method, capitalize: true },
        { label: 'Shipped', value: when(order.shipped_at) },
        { label: 'Delivered', value: when(order.delivered_at) },
        { label: 'Customer', value: order.user ? 'Account' : 'Guest checkout' },
    ].filter((r) => r.badge || r.value);

    return (
        <div className="admin-card">
            <div className="flex items-center gap-2">
                <Icon path={ClockPath} className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900">Order Info</span>
            </div>

            <div className="mt-3 space-y-2">
                {rows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-gray-600">{r.label}</span>
                        {r.badge ? (
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ${r.tone}`}>
                                {r.badge}
                            </span>
                        ) : (
                            <span className={`font-medium text-gray-900 ${r.capitalize ? 'capitalize' : ''}`}>{r.value}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function Show({ order, statuses, paymentStatuses }) {
    return (
        <DashboardLayout title={`Order ${order.order_number}`}>
            <Head title={`Order ${order.order_number}`} />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="text-[11px] text-gray-500">
                        <Link href={route('admin.orders.index')} className="hover:text-brand">Orders</Link>
                        <span className="mx-1">/</span>
                        <span className="font-mono">{order.order_number}</span>
                    </div>
                    <h1 className="mt-0.5 text-base font-semibold text-gray-900">Order {order.order_number}</h1>
                </div>
                <Link href={route('admin.orders.index')} className="btn-secondary">Back</Link>
            </div>

            <div className="mt-4">
                <OrderTracking order={order} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <ItemDetails order={order} />
                    <CustomerDetails order={order} />
                    <PaymentSummary order={order} />
                </div>

                <div className="space-y-4">
                    <AdminNote order={order} />
                    <UpdateStatus order={order} statuses={statuses} paymentStatuses={paymentStatuses} />
                    <OrderInfo order={order} />
                </div>
            </div>
        </DashboardLayout>
    );
}
