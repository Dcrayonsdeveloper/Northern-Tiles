import BuilderLayout from '@/Layouts/BuilderLayout';
import Container from '@/Components/Container';
import ProductImage from '@/Components/Catalog/ProductImage';
import { Link, usePage } from '@inertiajs/react';

const money = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

function StatCard({ label, value, hint }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-1.5 text-2xl font-bold text-slate-900">{value}</div>
            {hint ? <div className="mt-0.5 text-xs text-gray-500">{hint}</div> : null}
        </div>
    );
}

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function BuilderDashboard({ featuredProducts = [], recentOrders = [], stats, company }) {
    const { auth } = usePage().props;
    const firstName = auth?.user?.name?.split(' ')[0] ?? 'there';

    return (
        <BuilderLayout title="Trade Dashboard">
            <Container className="py-8">
                {/* ── Welcome ── */}
                <div className="rounded-lg bg-slate-900 px-6 py-8 text-white">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                        Builder &amp; Contractor Portal
                    </div>
                    <h1 className="mt-1.5 text-2xl font-bold">Welcome back, {firstName}</h1>
                    <p className="mt-1.5 max-w-2xl text-sm text-white/70">
                        {company
                            ? `${company} — your account is set up with trade pricing. `
                            : 'Your account is set up with trade pricing. '}
                        Everything in this catalogue is charged at your rate, in the cart and at checkout.
                    </p>
                    <Link
                        href={route('builder.shop.index')}
                        className="mt-5 inline-block rounded bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
                    >
                        Browse the trade catalogue →
                    </Link>
                </div>

                {/* ── Stats ── */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard label="Products available" value={stats?.catalogue_size ?? 0} hint="At your trade pricing" />
                    <StatCard label="Your orders" value={stats?.order_count ?? 0} hint="All time" />
                    <StatCard label="Total spent" value={money(stats?.total_spent)} hint="Paid orders only" />
                </div>

                {/* ── Featured ── */}
                {featuredProducts.length > 0 && (
                    <div className="mt-10">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">From your catalogue</h2>
                            <Link href={route('builder.shop.index')} className="text-sm font-semibold text-brand hover:underline">
                                View all →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {featuredProducts.map((p) => {
                                const retail = parseFloat(p.retail_price ?? 0);
                                const trade = parseFloat(p.price ?? 0);
                                return (
                                    <Link
                                        key={p.id}
                                        href={route('builder.products.show', p.slug)}
                                        className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                                            <ProductImage
                                                src={p.image_url}
                                                alt={p.name}
                                                className="absolute inset-0 h-full w-full object-cover"
                                                style={{ transform: 'scale(2.8)', transformOrigin: 'center' }}
                                            />
                                        </div>
                                        <div className="p-3">
                                            <div className="text-[13px] font-semibold text-gray-900 line-clamp-2 group-hover:text-brand">
                                                {p.name}
                                            </div>
                                            <div className="mt-2 flex items-baseline gap-2">
                                                <span className="text-sm font-bold text-slate-900">{money(trade)}</span>
                                                {retail > trade ? (
                                                    <span className="text-[11px] text-gray-400 line-through">{money(retail)}</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Recent orders ── */}
                <div className="mt-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Recent orders</h2>
                        <Link href={route('orders.index')} className="text-sm font-semibold text-brand hover:underline">
                            All orders →
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center">
                            <p className="text-sm font-medium text-gray-900">No orders yet.</p>
                            <p className="mt-1 text-sm text-gray-500">Your trade orders will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Order</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link href={route('orders.show', order.id)} className="font-medium text-brand hover:underline">
                                                    {order.order_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                                {money(order.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Container>
        </BuilderLayout>
    );
}
