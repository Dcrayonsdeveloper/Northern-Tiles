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

/* Hero artwork: four tile slabs standing in a fan behind a thin gold arc.
   Drawn rather than shipped as a photo, so the portal has its artwork with no
   binary asset to manage. If a real banner is dropped at
   public/images/builder/hero-banner.png the controller passes it through and it
   replaces this automatically — see heroBanner below. */
function TileStackArt({ className = '' }) {
    return (
        <svg className={className} viewBox="0 0 520 420" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
            <defs>
                {/* Front faces */}
                <linearGradient id="hbMarble" x1="0" y1="0" x2="0.7" y2="1">
                    <stop offset="0%" stopColor="#ffffff" /><stop offset="55%" stopColor="#f4f5f7" /><stop offset="100%" stopColor="#dfe2e6" />
                </linearGradient>
                <linearGradient id="hbConcrete" x1="0" y1="0" x2="0.7" y2="1">
                    <stop offset="0%" stopColor="#8d8781" /><stop offset="60%" stopColor="#7a746e" /><stop offset="100%" stopColor="#615c57" />
                </linearGradient>
                <linearGradient id="hbBeige" x1="0" y1="0" x2="0.7" y2="1">
                    <stop offset="0%" stopColor="#e6ded1" /><stop offset="60%" stopColor="#d8cfc0" /><stop offset="100%" stopColor="#c2b8a8" />
                </linearGradient>
                <linearGradient id="hbGrey" x1="0" y1="0" x2="0.7" y2="1">
                    <stop offset="0%" stopColor="#e9ebee" /><stop offset="60%" stopColor="#d6d9dd" /><stop offset="100%" stopColor="#bcc0c5" />
                </linearGradient>
                {/* Cut edges catch the light, which is what reads as thickness */}
                <linearGradient id="hbEdge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#cdd1d6" />
                </linearGradient>
                <clipPath id="hbMarbleClip">
                    <rect x="150" y="196" width="118" height="188" rx="2" />
                </clipPath>
            </defs>

            {/* Gold arc, behind everything */}
            <path d="M 152 356 A 150 150 0 0 1 452 356" stroke="#c9a961" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Back to front, so the nearest slab overlaps the ones behind it */}

            {/* 4 — light grey, furthest back */}
            <g>
                <rect x="392" y="176" width="74" height="208" rx="2" fill="url(#hbGrey)" />
                <rect x="384" y="176" width="9" height="208" rx="1" fill="url(#hbEdge)" />
                <rect x="384" y="176" width="82" height="4" rx="1" fill="#ffffff" opacity="0.85" />
            </g>

            {/* 3 — beige */}
            <g>
                <rect x="322" y="160" width="82" height="224" rx="2" fill="url(#hbBeige)" />
                <rect x="313" y="160" width="10" height="224" rx="1" fill="url(#hbEdge)" />
                <rect x="313" y="160" width="91" height="4" rx="1" fill="#ffffff" opacity="0.8" />
            </g>

            {/* 2 — concrete */}
            <g>
                <rect x="246" y="184" width="86" height="200" rx="2" fill="url(#hbConcrete)" />
                <rect x="236" y="184" width="11" height="200" rx="1" fill="url(#hbEdge)" />
                <rect x="236" y="184" width="96" height="4" rx="1" fill="#ffffff" opacity="0.7" />
            </g>

            {/* 1 — white marble, nearest */}
            <g>
                <rect x="150" y="196" width="118" height="188" rx="2" fill="url(#hbMarble)" />
                <g clipPath="url(#hbMarbleClip)" stroke="#b9c0c9" fill="none" strokeLinecap="round">
                    <path d="M158 268 C 186 250, 200 292, 232 272 S 262 300, 276 288" strokeWidth="2.1" opacity="0.75" />
                    <path d="M152 316 C 178 306, 196 330, 224 318 S 254 336, 272 328" strokeWidth="1.5" opacity="0.5" />
                    <path d="M170 226 C 190 218, 206 238, 232 230" strokeWidth="1.2" opacity="0.4" />
                    <path d="M198 352 C 218 344, 236 360, 258 352" strokeWidth="1.1" opacity="0.35" />
                </g>
                <rect x="140" y="196" width="11" height="188" rx="1" fill="url(#hbEdge)" />
                <rect x="140" y="196" width="128" height="4" rx="1" fill="#ffffff" opacity="0.9" />
            </g>
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

export default function BuilderDashboard({ featuredProducts = [], recentOrders = [], stats, company, heroBanner = null, heroBannerEdge = null }) {
    const { auth } = usePage().props;
    const firstName = auth?.user?.name?.split(' ')[0] ?? 'there';

    return (
        <BuilderLayout title="Trade Dashboard">
            <Container className="py-8">
                {/* ── Welcome ── */}
                <div
                    className="relative overflow-hidden rounded-lg bg-navy px-6 py-10 text-white sm:px-10"
                    style={heroBannerEdge ? {
                        // Stretched to the box, so the card carries the artwork's
                        // exact gradient and the join is invisible at every height.
                        backgroundImage: `url(${heroBannerEdge})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                    } : undefined}
                >
                    <div className="relative z-10 max-w-2xl lg:min-h-[220px]">
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

                    {/* Ornament only — hidden below lg where it would crowd the copy.
                        A real banner saved to public/images/builder/hero-banner.png
                        is passed through by the controller and wins; until then the
                        drawn version renders, so the hero is never empty. */}
                    {heroBanner ? (
                        <img
                            src={heroBanner}
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 hidden h-full w-full object-contain object-right lg:block"
                        />
                    ) : (
                        <TileStackArt className="pointer-events-none absolute -bottom-10 right-4 hidden h-[125%] w-[420px] lg:block" />
                    )}
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
