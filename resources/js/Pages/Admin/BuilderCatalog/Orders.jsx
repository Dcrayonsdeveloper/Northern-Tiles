import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const money = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const PAYMENT_STYLES = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-amber-100 text-amber-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-200 text-gray-700',
};

export default function BuilderOrders({ orders, filters, stats }) {
    const [search, setSearch] = useState(filters?.q ?? '');
    const rows = orders?.data ?? [];

    const applyFilter = (patch) => {
        router.get(route('admin.builder.orders.index'), { ...filters, ...patch }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <DashboardLayout>
            <Head title="Builder Orders" />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Builder Orders</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Orders placed through the trade portal. These also appear under Store → Orders.
                    </p>
                </div>
                <div className="flex gap-6 text-sm">
                    <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">Orders</div>
                        <div className="text-lg font-bold text-gray-900">{stats?.total ?? 0}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">Paid revenue</div>
                        <div className="text-lg font-bold text-gray-900">{money(stats?.revenue)}</div>
                    </div>
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <form
                    onSubmit={(e) => { e.preventDefault(); applyFilter({ q: search }); }}
                    className="flex-1 min-w-[220px]"
                >
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search order number, name or email…"
                        className="w-full rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                    />
                </form>
                <select
                    value={filters?.status ?? ''}
                    onChange={(e) => applyFilter({ status: e.target.value })}
                    className="rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Order</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Builder</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <p className="text-sm font-medium text-gray-900">No builder orders yet.</p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Orders placed by trade accounts will show up here.
                                        </p>
                                    </td>
                                </tr>
                            ) : rows.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link href={route('admin.orders.show', order.id)} className="font-medium text-brand hover:underline">
                                            {order.order_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">
                                            {order.user?.builder_company || order.customer_name}
                                        </div>
                                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${PAYMENT_STYLES[order.payment_status] ?? 'bg-gray-100 text-gray-700'}`}>
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                        {money(order.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {(orders?.links ?? []).length > 3 && (
                <div className="mt-6 flex flex-wrap justify-center gap-1">
                    {orders.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            preserveScroll
                            className={`rounded px-3 py-1.5 text-sm ${
                                link.active
                                    ? 'bg-brand font-semibold text-white'
                                    : link.url
                                        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        : 'cursor-not-allowed border border-gray-200 bg-white text-gray-300'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
