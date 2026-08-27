import BuilderLayout from '@/Layouts/BuilderLayout';
import Container from '@/Components/Container';
import ProductImage from '@/Components/Catalog/ProductImage';
import { Link, usePage } from '@inertiajs/react';

const money = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

function StatCard({ label, value, hint }) {
    return (
        <div className="rounded-lg border border-gray-200 border-l-4 border-l-gold bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[1.5px] text-gray-500">{label}</div>
            <div className="mt-1.5 font-heading text-3xl font-bold text-navy">{value}</div>
            {hint ? <div className="mt-0.5 text-xs text-gray-500">{hint}</div> : null}
        </div>
    );
}

/* Decorative tile stack for the hero - a gold arc behind four fanned slabs.
   Drawn rather than photographed so it cannot 404 or shift the layout, and
   purely ornamental, hence aria-hidden. */
function TileStackArt({ className = '' }) {
    return (
        <svg className={className} viewBox="0 0 260 200" fill="none" aria-hidden="true">
            <defs>
                <linearGradient id="tsA" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f4f1ea" /><stop offset="100%" stopColor="#cfc7b8" />
                </linearGradient>
                <linearGradient id="tsB" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8f9296" /><stop offset="100%" stopColor="#5d6165" />
                </linearGradient>
                <linearGradient id="tsC" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#d8dade" />
                </linearGradient>
                <linearGradient id="tsD" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7d8590" /><stop offset="100%" stopColor="#4a5158" />
                </linearGradient>
            </defs>
            <path d="M40 170 A95 95 0 0 1 230 170" stroke="#c9a961" strokeWidth="2" fill="none" opacity="0.85" />
            <rect x="58" y="72" width="42" height="104" rx="4" fill="url(#tsA)" transform="rotate(-6 79 124)" />
            <rect x="102" y="58" width="42" height="118" rx="4" fill="url(#tsB)" transform="rotate(-2 123 117)" />
            <rect x="146" y="52" width="42" height="124" rx="4" fill="url(#tsC)" transform="rotate(2 167 114)" />
            <rect x="190" y="66" width="42" height="110" rx="4" fill="url(#tsD)" transform="rotate(6 211 121)" />
        </svg>
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
                <div className="relative overflow-hidden rounded-lg bg-navy px-6 py-10 text-white sm:px-10">
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold uppercase tracking-[2px] text-gold">
                                Builder &amp; Contractor Portal
                            </span>
                            <span className="hidden h-px w-16 bg-gold/50 sm:block" />
                        </div>
                        <h1 className="mt-3 font-heading text-4xl font-bold leading-tight">
                            Welcome back, {firstName}
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-white/75">
                            {company
                                ? `${company} — your account is set up with trade pricing. `
                                : 'Your account is set up with trade pricing. '}
                            Everything in this catalogue is charged at your rate, in the cart and at checkout.
                        </p>
                        <Link
                            href={route('builder.shop.index')}
                            className="mt-6 inline-block rounded bg-gold px-6 py-3 text-sm font-semibold text-navy-dark transition hover:bg-gold-light"
                        >
                            Browse the trade catalogue →
                        </Link>
                    </div>

                    {/* Ornament only - hidden on small screens where it would crowd the copy. */}
                    <TileStackArt className="pointer-events-none absolute -right-4 bottom-0 hidden h-full w-[300px] lg:block" />
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
                        <div className="mb-4 flex items-center gap-4">
                            <h2 className="font-heading text-2xl font-bold text-navy">From your catalogue</h2>
                            <span className="hidden h-px flex-1 bg-gold/40 sm:block" />
                            <Link href={route('builder.shop.index')} className="shrink-0 text-sm font-semibold text-navy hover:text-gold-dark">
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
                                                className="absolute inset-0 h-full w-full object-contain"
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
                        <h2 className="font-heading text-2xl font-bold text-navy">Recent orders</h2>
                        <span className="hidden h-px flex-1 bg-gold/40 sm:block" />
                        <Link href={route('orders.index')} className="shrink-0 text-sm font-semibold text-navy hover:text-gold-dark">
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
