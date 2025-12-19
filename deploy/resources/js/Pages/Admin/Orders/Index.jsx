import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';

function Pagination({ links }) {
    if (!links?.length) return null;

    return (
        <div className="flex flex-wrap gap-2 p-3">
            {links.map((l, idx) => (
                <Link
                    key={idx}
                    href={l.url ?? '#'}
                    preserveScroll
                    className={
                        (l.active
                            ? 'bg-brand text-white border-brand'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-brand/10 hover:text-brand') +
                        ' rounded-md border px-2.5 py-1.5 text-xs font-medium' +
                        (!l.url ? ' pointer-events-none opacity-50' : '')
                    }
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </div>
    );
}

export default function Index({ orders }) {
    return (
        <DashboardLayout title="Orders">
            <Head title="Orders" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Orders</div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">#</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Customer</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Total</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Created</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders?.data?.length ? (
                                orders.data.map((o) => (
                                    <tr key={o.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2 text-xs font-medium text-gray-900">
                                            #{o.id}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-700">
                                            <div className="font-medium text-gray-900">{o.customer_name}</div>
                                            <div className="text-[12px] text-gray-500">{o.customer_email}</div>
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-700">
                                            {o.currency} {o.total}
                                        </td>
                                        <td className="px-4 py-2 text-xs">
                                            <span className="badge-muted">
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-600">
                                            {o.created_at}
                                        </td>
                                        <td className="px-4 py-2">
                                            <Link
                                                href={route('admin.orders.show', o.id)}
                                                className="btn-secondary"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="px-4 py-6 text-xs text-gray-600" colSpan={6}>
                                        No orders yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={orders?.links} />
            </div>
        </DashboardLayout>
    );
}
