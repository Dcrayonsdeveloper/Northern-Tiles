import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Show({ order }) {
    const { data, setData, put, processing } = useForm({
        status: order?.status ?? 'pending',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.orders.update', order.id));
    };

    return (
        <DashboardLayout title={`Order #${order.id}`}>
            <Head title={`Order #${order.id}`} />

            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-gray-900">Order #{order.id}</div>
                    <div className="mt-1 text-xs text-gray-600">
                        {order.customer_name} · {order.customer_email}
                    </div>
                </div>
                <Link
                    href={route('admin.orders.index')}
                    className="btn-secondary"
                >
                    Back
                </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="admin-card lg:col-span-2">
                    <div className="text-sm font-semibold text-gray-900">Items</div>
                    <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Product</th>
                                    <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Price</th>
                                    <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Qty</th>
                                    <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Line total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items?.length ? (
                                    order.items.map((it) => (
                                        <tr key={it.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-2 text-xs font-medium text-gray-900">
                                                {it.name}
                                                {it.product ? (
                                                    <div className="text-[12px] text-gray-500">{it.product.slug}</div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-gray-700">{it.price}</td>
                                            <td className="px-4 py-2 text-xs text-gray-700">{it.quantity}</td>
                                            <td className="px-4 py-2 text-xs text-gray-700">{it.line_total}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-4 py-6 text-xs text-gray-600" colSpan={4}>
                                            No items.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="text-sm font-semibold text-gray-900">Summary</div>

                    <div className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-semibold text-gray-900">
                                {order.currency} {order.subtotal}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-semibold text-gray-900">
                                {order.currency} {order.tax}
                            </span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="text-gray-600">Total</span>
                            <span className="font-semibold text-gray-900">
                                {order.currency} {order.total}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={submit} className="mt-5 space-y-2">
                        <label className="block text-xs font-medium text-gray-700">Status</label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="admin-select"
                        >
                            <option value="pending">pending</option>
                            <option value="paid">paid</option>
                            <option value="processing">processing</option>
                            <option value="shipped">shipped</option>
                            <option value="delivered">delivered</option>
                            <option value="cancelled">cancelled</option>
                        </select>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary mt-3 w-full"
                        >
                            Update Status
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
