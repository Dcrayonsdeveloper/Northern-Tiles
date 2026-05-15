import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import MetaTags from '@/Components/SEO/MetaTags';
import SchemaOrg from '@/Components/SEO/SchemaOrg';
import AuthorBio from '@/Components/CMS/AuthorBio';

// ─── Section renderers (used by generic pages) ──────────────────────────────

function TextContentSection({ data, width }) {
    const maxWidth = { narrow: 'max-w-2xl', medium: 'max-w-4xl', full: 'max-w-none' }[width] ?? 'max-w-4xl';
    return (
        <section className={`mx-auto ${maxWidth} py-6`}>
            {data.heading && <h2 className="mb-4 text-2xl font-bold text-gray-900">{data.heading}</h2>}
            {data.content && (
                <div className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-brand"
                    dangerouslySetInnerHTML={{ __html: data.content }} />
            )}
        </section>
    );
}

function SectionRenderer({ section }) {
    const { section_key, data_json: data = {} } = section;
    if (section_key === 'text_content') return <TextContentSection data={data} width={data.width} />;
    return null;
}

// ─── About Page Icons ────────────────────────────────────────────────────────

const IconTile = () => (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="18" height="18" rx="2" /><rect x="26" y="4" width="18" height="18" rx="2" />
        <rect x="4" y="26" width="18" height="18" rx="2" /><rect x="26" y="26" width="18" height="18" rx="2" />
    </svg>
);
const IconFloor = () => (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="40" height="8" rx="1" /><rect x="4" y="16" width="40" height="8" rx="1" />
        <rect x="4" y="28" width="40" height="8" rx="1" /><rect x="4" y="40" width="40" height="4" rx="1" />
    </svg>
);
const IconTree = () => (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.5">
        <path d="M24 4L8 24h8v4L8 40h32L32 28v-4h8L24 4z" />
    </svg>
);
const IconStone = () => (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.5">
        <polygon points="24,4 44,18 38,40 10,40 4,18" />
    </svg>
);
const IconTrowel = () => (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 42l8-8M14 34L34 8a4 4 0 015.6 5.6L14 34zM10 38l4-4" />
        <path d="M28 12l8 8" />
    </svg>
);
const IconGrid = () => (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="12" height="12" rx="1" /><rect x="20" y="4" width="12" height="12" rx="1" />
        <rect x="36" y="4" width="8" height="12" rx="1" /><rect x="4" y="20" width="12" height="24" rx="1" />
        <rect x="20" y="20" width="24" height="10" rx="1" /><rect x="20" y="34" width="24" height="10" rx="1" />
    </svg>
);
const IconLocation = () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);
const IconClock = () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const IconPhone = () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);
const IconEmail = () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);
const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

// ─── About Page Template ─────────────────────────────────────────────────────

function AboutTemplate({ page }) {
    const hasContent = page.content && page.content.trim() !== '';

    const products = [
        { icon: <IconTile />, name: 'Porcelain & Ceramic Tiles', desc: 'Premium wall and floor tiles for every application' },
        { icon: <IconFloor />, name: 'Hybrid Flooring', desc: '100% waterproof hybrid planks, 7–9.5mm thick ranges' },
        { icon: <IconTree />, name: 'Timber Flooring', desc: 'Engineered and solid oak in a range of finishes' },
        { icon: <IconStone />, name: 'Natural Stone', desc: 'Marble, travertine, slate and stone pavers' },
        { icon: <IconTrowel />, name: 'Trade Supplies', desc: 'Mapei, ARDEX, Soudal adhesives and levelling systems' },
        { icon: <IconGrid />, name: 'Specialty Collections', desc: 'Subway, terrazzo, herringbone and Italian porcelain' },
    ];

    const stats = [
        { value: '20+', label: 'Years Experience' },
        { value: '5,000+', label: 'Products In Stock' },
        { value: '50+', label: 'Premium Brands' },
        { value: '10,000+', label: 'Trade Customers' },
    ];

    const highlights = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
                </svg>
            ),
            title: 'Wholesale Trade Pricing',
            desc: 'Competitive trade rates for builders, developers, and contractors. Volume pricing and trade accounts available.',
            points: ['No minimum order required', 'Volume discounts available', 'Trade account with 30-day terms'],
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            ),
            title: 'Expert Advice',
            desc: 'Our experienced team has decades of knowledge in tiles, flooring, and installation products to guide your project.',
            points: ['Product selection guidance', 'Calculation and estimating help', 'Installation product advice'],
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                </svg>
            ),
            title: "Melbourne's Local Supplier",
            desc: 'Based in Thomastown, we serve builders and contractors across metropolitan Melbourne and regional Victoria.',
            points: ['Walk-in warehouse showroom', 'Same-day stock availability', 'Click & collect available'],
        },
    ];

    return (
        <div>
            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section
                className="relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #063d6b 0%, #085a9c 50%, #0b6fbf 100%)' }}
            >
                {/* Decorative tile grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
                    <div className="max-w-3xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                            Thomastown, Melbourne VIC
                        </div>
                        <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                            Melbourne's Wholesale Tile &amp; Flooring Specialists
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-white/80 sm:text-xl">
                            Northern TILE Distributors — supplying premium tiles, timber flooring, hybrid flooring
                            and stone products to builders and contractors across Victoria since 2004.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link
                                href={route('shop.index')}
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand shadow-lg transition hover:bg-gray-50"
                            >
                                Shop Our Range
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                            <Link
                                href={route('pages.contact')}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="h-12 w-full">
                        <path d="M0 48V24C240 0 480 0 720 24C960 48 1200 48 1440 24V48H0Z" fill="#f9fafb" />
                    </svg>
                </div>
            </section>

            {/* ── Our Story ─────────────────────────────────────────────── */}
            <section className="bg-gray-50 py-16 lg:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                        {/* Text */}
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-brand">Our Story</p>
                            <h2 className="font-heading mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                                About Northern TILE Distributors
                            </h2>

                            {hasContent ? (
                                <div
                                    className="prose prose-lg mt-6 max-w-none text-gray-600 prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-brand prose-strong:text-gray-900"
                                    dangerouslySetInnerHTML={{ __html: page.content }}
                                />
                            ) : (
                                <div className="mt-6 space-y-4 text-gray-600">
                                    <p className="text-lg leading-relaxed">
                                        Northern TILE Distributors is a Melbourne-based wholesale supplier of premium tiles,
                                        timber flooring, hybrid flooring, and natural stone products. We've been serving
                                        builders and contractors across Victoria from our Thomastown warehouse since 2004.
                                    </p>
                                    <p className="leading-relaxed">
                                        Our extensive range includes porcelain and ceramic tiles, engineered and solid oak
                                        timber flooring, hybrid flooring, natural stone pavers, and professional trade
                                        supplies from brands like Mapei, ARDEX, and Soudal.
                                    </p>
                                    <p className="leading-relaxed">
                                        Whether you're a builder, developer, tiler, or interior designer, we stock
                                        everything you need to complete your project — at trade prices.
                                    </p>
                                </div>
                            )}

                            <ul className="mt-8 space-y-3">
                                {[
                                    'Melbourne\'s largest wholesale tile showroom',
                                    'Over 5,000 products available in stock',
                                    'Trade accounts with 30-day payment terms',
                                    'Expert team with decades of industry experience',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-gray-700">
                                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                                            <IconCheck />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Visual panel */}
                        <div className="relative">
                            <div className="overflow-hidden rounded-2xl shadow-2xl">
                                {/* Tile pattern visual */}
                                <div
                                    className="relative flex h-96 items-center justify-center bg-brand-dark"
                                    style={{ background: 'linear-gradient(160deg, #063d6b, #085a9c)' }}
                                >
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                                            backgroundSize: '48px 48px',
                                        }}
                                    />
                                    <div className="relative text-center text-white">
                                        <div className="font-heading text-6xl font-bold">NTD</div>
                                        <div className="mt-2 text-sm font-medium uppercase tracking-[0.3em] text-white/70">
                                            Northern TILE Distributors
                                        </div>
                                        <div className="mt-6 flex justify-center gap-3">
                                            {['#085a9c', '#0b6fbf', '#063d6b', '#1a7abf'].map((c, i) => (
                                                <div key={i} className="h-10 w-10 rounded border border-white/20" style={{ background: c }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Floating badge */}
                            <div className="absolute -bottom-5 -right-5 rounded-2xl bg-white px-5 py-4 shadow-xl">
                                <div className="font-heading text-3xl font-bold text-brand">20+</div>
                                <div className="text-xs font-medium text-gray-500">Years in Business</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── What We Stock ─────────────────────────────────────────── */}
            <section className="bg-white py-16 lg:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Our Range</p>
                        <h2 className="font-heading mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                            What We Stock
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-gray-500">
                            From premium porcelain tiles to engineered timber flooring, we carry everything
                            your project needs — all available from our Thomastown warehouse.
                        </p>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <div
                                key={product.name}
                                className="group flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-6 transition hover:border-brand/20 hover:bg-brand/5 hover:shadow-md"
                            >
                                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm group-hover:bg-brand group-hover:text-white transition">
                                    {product.icon}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{product.name}</div>
                                    <div className="mt-1 text-sm text-gray-500">{product.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Link
                            href={route('shop.index')}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                            Browse Full Range
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Why Choose Us ─────────────────────────────────────────── */}
            <section className="bg-gray-50 py-16 lg:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Why NTD</p>
                        <h2 className="font-heading mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                            Why Choose Northern TILE
                        </h2>
                    </div>

                    <div className="mt-12 grid gap-8 lg:grid-cols-3">
                        {highlights.map((h) => (
                            <div key={h.title} className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand/10 text-brand">
                                    {h.icon}
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-gray-900">{h.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-500">{h.desc}</p>
                                <ul className="mt-5 space-y-2">
                                    {h.points.map((pt) => (
                                        <li key={pt} className="flex items-center gap-2 text-sm text-gray-700">
                                            <span className="text-brand"><IconCheck /></span>
                                            {pt}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Stats ─────────────────────────────────────────────────── */}
            <section style={{ background: 'linear-gradient(135deg, #063d6b 0%, #085a9c 100%)' }} className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="font-heading text-4xl font-bold text-white sm:text-5xl">
                                    {stat.value}
                                </div>
                                <div className="mt-2 text-sm font-medium text-white/70">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Visit Us ──────────────────────────────────────────────── */}
            <section className="bg-white py-16 lg:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
                        {/* Info */}
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-brand">Find Us</p>
                            <h2 className="font-heading mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                                Visit Our Warehouse
                            </h2>
                            <p className="mt-4 text-gray-500">
                                Walk in and see our extensive range of tiles, flooring, and trade supplies in person.
                                Our team is ready to help with your next project.
                            </p>

                            <div className="mt-8 space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                        <IconLocation />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">Address</div>
                                        <div className="mt-0.5 text-sm text-gray-500">19/324 Settlement Road</div>
                                        <div className="text-sm text-gray-500">Thomastown VIC 3074</div>
                                        <a
                                            href="https://maps.google.com/?q=19/324+Settlement+Road+Thomastown+VIC+3074"
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                        >
                                            Get Directions
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                        <IconClock />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">Trading Hours</div>
                                        <div className="mt-1 space-y-0.5 text-sm text-gray-500">
                                            <div className="flex justify-between gap-8"><span>Monday – Friday</span><span className="font-medium text-gray-700">9:00am – 5:00pm</span></div>
                                            <div className="flex justify-between gap-8"><span>Saturday</span><span className="font-medium text-gray-700">9:00am – 1:00pm</span></div>
                                            <div className="flex justify-between gap-8"><span>Sunday</span><span className="font-medium text-gray-700">Closed</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                        <IconPhone />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">Phone</div>
                                        <div className="mt-0.5 space-y-0.5">
                                            <a href="tel:0394646623" className="block text-sm text-gray-500 hover:text-brand">03 9464 6623</a>
                                            <a href="tel:0416924324" className="block text-sm text-gray-500 hover:text-brand">0416 924 324</a>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                        <IconEmail />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">Email</div>
                                        <a href="mailto:info@ntiled.com.au" className="mt-0.5 block text-sm text-gray-500 hover:text-brand">
                                            info@ntiled.com.au
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA card */}
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 lg:sticky lg:top-24">
                            <h3 className="font-heading text-2xl font-bold text-gray-900">Ready to Start Your Project?</h3>
                            <p className="mt-3 text-sm leading-relaxed text-gray-500">
                                Get in touch with our team for pricing, stock availability, or to open a trade account.
                                We're here to help make your project a success.
                            </p>
                            <div className="mt-6 space-y-3">
                                <Link
                                    href={route('pages.contact')}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                                >
                                    <IconEmail />
                                    Send Us a Message
                                </Link>
                                <a
                                    href="tel:0394646623"
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-brand/30 hover:text-brand"
                                >
                                    <IconPhone />
                                    Call 03 9464 6623
                                </a>
                            </div>
                            <div className="mt-6 rounded-xl bg-brand/5 p-4">
                                <div className="text-xs font-semibold text-brand">Trade Accounts Available</div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Open a trade account for 30-day payment terms, volume discounts, and dedicated account management.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

// ─── Generic Page Template ────────────────────────────────────────────────────

function GenericTemplate({ page }) {
    const hasSections = page.sections?.length > 0;
    const hasBodyContent = page.content && page.content.trim() !== '';

    const updatedAt = page.updated_at
        ? new Date(page.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    return (
        <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm">
                <ol className="flex items-center gap-2 text-gray-500">
                    <li><Link href="/" className="hover:text-brand">Home</Link></li>
                    <li>/</li>
                    <li className="text-gray-900">{page.title}</li>
                </ol>
            </nav>

            <header className="mb-8">
                <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl">{page.title}</h1>
                {page.subtitle && <p className="mt-4 text-lg text-gray-600">{page.subtitle}</p>}
                {updatedAt && (
                    <p className="mt-4 text-sm text-gray-500">
                        Last updated: <time dateTime={page.updated_at}>{updatedAt}</time>
                    </p>
                )}
            </header>

            {page.featured_image_url && (
                <div className="mb-8 overflow-hidden rounded-lg">
                    <img src={page.featured_image_url} alt={page.title} className="h-auto w-full object-cover" />
                </div>
            )}

            {hasSections && (
                <div className="space-y-6">
                    {page.sections.map((section) => (
                        <SectionRenderer key={section.id} section={section} />
                    ))}
                </div>
            )}

            {!hasSections && hasBodyContent && (
                <div
                    className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-brand prose-img:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            )}

            {page.author && (
                <div className="mt-12 border-t border-gray-200 pt-8">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Page Author</h3>
                    <AuthorBio author={page.author} variant="compact" />
                </div>
            )}
        </article>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Page({ page, seoMeta, pageSchema }) {
    const isAbout = page.template === 'about';

    return (
        <PublicLayout>
            <MetaTags meta={seoMeta} />
            <SchemaOrg schema={pageSchema} />
            <Head title={page.title} />

            {isAbout ? (
                <AboutTemplate page={page} />
            ) : (
                <GenericTemplate page={page} />
            )}
        </PublicLayout>
    );
}
