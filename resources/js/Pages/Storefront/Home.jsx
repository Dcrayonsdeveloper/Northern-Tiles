import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import TrustpilotCarousel from '@/Components/Storefront/TrustpilotCarousel';
import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState, useCallback, useEffect } from 'react';

/* ── Icons ─────────────────────────────────────────────────────────────── */
const CL = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const CR = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;

/* ── Scroll hook ───────────────────────────────────────────────────────── */
function useHS(n = 320) {
    const r = useRef(null);
    const [l, sL] = useState(false);
    const [rr, sR] = useState(true);
    const ck = useCallback(() => { if (!r.current) return; const { scrollLeft: s, scrollWidth: w, clientWidth: c } = r.current; sL(s > 10); sR(s < w - c - 10); }, []);
    const go = useCallback(d => { r.current?.scrollBy({ left: d === 'l' ? -n : n, behavior: 'smooth' }); setTimeout(ck, 350); }, [n, ck]);
    return { r, l, rr, ck, go };
}
function SB({ d, off, fn }) {
    return <button type="button" onClick={fn} disabled={off} className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-gray-200 bg-white text-[#333] shadow-sm transition hover:border-brand hover:text-brand disabled:opacity-25 disabled:cursor-not-allowed" aria-label={d === 'l' ? 'Previous' : 'Next'}>{d === 'l' ? <CL c="h-5 w-5" /> : <CR c="h-5 w-5" />}</button>;
}

/* ═══════════════════════════════════════════════════════════════════════
   1. HERO SLIDER — full width, ~80vh, minimal
   ═══════════════════════════════════════════════════════════════════════ */
const FALLBACK_SLIDES = [
    {
        image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=1080&fit=crop&q=80',
        image_alt_key: 'Modern tiled living space',
        h1_key: 'Premium Tiles & Flooring',
        p_key: 'Melbourne\'s trusted wholesale supplier of tiles, stone, timber and hybrid flooring.',
        cta_primary_label_key: 'Shop Now',
        cta_primary_href: '/shop',
        cta_secondary_label_key: 'Visit Showroom',
        cta_secondary_href: '/pages/contact',
        overlay_style: 'dark',
        align: 'left',
    },
    {
        image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&h=1080&fit=crop&q=80',
        image_alt_key: 'Luxury bathroom tile design',
        h1_key: 'New Season Collections',
        p_key: 'Discover our latest range of porcelain, ceramic and natural stone tiles.',
        cta_primary_label_key: 'Browse Collections',
        cta_primary_href: '/shop',
        overlay_style: 'dark',
        align: 'left',
    },
    {
        image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop&q=80',
        image_alt_key: 'Contemporary home interior with premium flooring',
        h1_key: 'Trade & Wholesale Pricing',
        p_key: 'Exclusive rates for builders, architects and designers. Open to the public.',
        cta_primary_label_key: 'Get a Quote',
        cta_primary_href: '/pages/contact',
        overlay_style: 'dark',
        align: 'left',
    },
];

function HeroSlider({ heroSlider }) {
    const slides = heroSlider?.slides?.length ? heroSlider.slides : FALLBACK_SLIDES;
    const [i, setI] = useState(0);
    const n = slides.length;
    useEffect(() => { if (n <= 1) return; const t = setInterval(() => setI(p => (p + 1) % n), 6000); return () => clearInterval(t); }, [n]);

    return (
        <section className="relative w-full overflow-hidden bg-[#f0efed]" style={{ height: '80vh', minHeight: '480px', maxHeight: '900px' }}>
            {slides.map((s, idx) => (
                <div key={idx} className={`transition-opacity duration-700 ${idx === i ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <img src={s.image_url} alt={s.image_alt_key || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading={idx === 0 ? 'eager' : 'lazy'} />
                    {/* Overlay + text content */}
                    {(s.h1_key || s.p_key || s.cta_primary_label_key) && (
                        <div className={`absolute inset-0 flex items-center ${s.align === 'center' ? 'justify-center text-center' : s.align === 'right' ? 'justify-end text-right' : 'justify-start text-left'}`}>
                            <div className={`${s.overlay_style === 'dark' ? 'bg-black/40' : s.overlay_style === 'light' ? 'bg-white/40' : ''} absolute inset-0`} />
                            <div className="relative z-10 max-w-2xl px-8 sm:px-16">
                                {s.h1_key && <h2 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-lg leading-tight font-heading">{s.h1_key}</h2>}
                                {s.p_key && <p className="mt-4 text-base sm:text-lg text-white/90 drop-shadow">{s.p_key}</p>}
                                <div className="mt-6 flex flex-wrap gap-3">
                                    {s.cta_primary_label_key && s.cta_primary_href && (
                                        <Link href={s.cta_primary_href} className="inline-block rounded bg-brand px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-dark">{s.cta_primary_label_key}</Link>
                                    )}
                                    {s.cta_secondary_label_key && s.cta_secondary_href && (
                                        <Link href={s.cta_secondary_href} className="inline-block rounded border border-white/60 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-white/20">{s.cta_secondary_label_key}</Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <h1 className="sr-only">Northern TILE Distributors — Melbourne Tile &amp; Flooring Wholesaler</h1>
            {n > 1 && (
                <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 flex gap-2">{slides.map((_, idx) => <button key={idx} type="button" onClick={() => setI(idx)} className={`h-2 rounded-full transition-all ${idx === i ? 'w-7 bg-brand' : 'w-2 bg-white/60'}`} aria-label={`Slide ${idx + 1}`} />)}</div>
            )}
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   2. TRENDING PRODUCTS — 4-across carousel, AGL style
   ═══════════════════════════════════════════════════════════════════════ */
function TrendingProducts({ products = [] }) {
    const { r, l, rr, ck, go } = useHS(280);
    if (!products.length) return null;

    const addToCart = (e, productId) => {
        e.preventDefault();
        e.stopPropagation();
        router.post(route('cart.store'), { product_id: productId, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => { window.dispatchEvent(new CustomEvent('cart-updated')); window.dispatchEvent(new CustomEvent('open-cart-sidebar')); },
        });
    };

    return (
        <section className="py-16 bg-white">
            <Container>
                <div className="text-center mb-10">
                    <h2 className="text-[28px] font-light text-[#222] tracking-[2px] uppercase font-heading">Trending <span className="font-semibold">Products</span></h2>
                    <div className="mx-auto mt-3 h-[2px] w-12 bg-brand" />
                </div>
                <div className="relative">
                    <div ref={r} onScroll={ck} className="flex gap-4 overflow-x-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none' }}>
                        {products.map(p => {
                            const disc = p.compare_at_price > p.price ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100) : 0;
                            return (
                                <div key={p.id} className="group flex-shrink-0 w-[220px] sm:w-[240px] rounded-none border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <Link href={route('products.show', p.slug)} className="block">
                                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                                            <img src={p.image_url || '/images/placeholder-product.svg'} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                            {disc > 0 && (
                                                <div className="absolute left-0 top-3">
                                                    <span className="rounded-r-full bg-brand px-3 py-1 text-[11px] font-bold text-white shadow-sm">{disc}% off</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="p-3">
                                        <Link href={route('products.show', p.slug)} className="text-[13px] font-semibold text-[#333] group-hover:text-brand transition-colors line-clamp-2 block min-h-[36px]">{p.name}</Link>
                                        <div className="mt-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[16px] font-bold text-gray-900">${parseFloat(p.price || 0).toFixed(2)}</span>
                                                <span className="text-[11px] text-gray-400">/ sqm</span>
                                                {disc > 0 && <span className="text-[13px] text-gray-400 line-through">${parseFloat(p.compare_at_price || 0).toFixed(2)}</span>}
                                            </div>
                                            {disc > 0 && <p className="mt-0.5 text-[12px] font-medium text-green-600">Save {disc}%</p>}
                                        </div>
                                        <button type="button" onClick={(e) => addToCart(e, p.id)} className="mt-3 w-full rounded-none bg-brand px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-dark transition">
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-center gap-3 mt-6">
                        <SB d="l" off={!l} fn={() => go('l')} />
                        <SB d="r" off={!rr} fn={() => go('r')} />
                    </div>
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   3. TILE VISUALIZER — two-column (text left, visual right)
   ═══════════════════════════════════════════════════════════════════════ */
function TileVisualizer() {
    return (
        <section className="py-20 bg-[#f7f7f5]">
            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[3px] text-brand mb-3">Experience</p>
                        <h2 className="text-[32px] font-light text-[#222] leading-tight font-heading">View Our Tiles <span className="font-semibold">In Your Space</span></h2>
                        <p className="mt-5 text-[14px] leading-[1.8] text-[#4a4a4a]">
                            Experience how our tiles, flooring and stone products look in your home with our interactive visualiser. Browse hundreds of options and preview them in realistic room settings before you purchase.
                        </p>
                        <Link href="/shop" className="mt-8 inline-block bg-brand px-8 py-3 text-[12px] font-semibold uppercase tracking-[1.5px] text-white transition hover:bg-brand-dark">
                            Open Tile View
                        </Link>
                    </div>
                    <div className="flex justify-center">
                        <div className="relative w-[280px]">
                            <div className="rounded-[32px] border-[6px] border-[#222] bg-white p-3 shadow-2xl">
                                <div className="aspect-[9/16] rounded-[24px] bg-gradient-to-b from-[#f0efed] to-[#e8e6e2] flex flex-col items-center justify-center">
                                    <svg className="h-14 w-14 text-brand/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <p className="mt-3 text-[12px] font-semibold text-[#595959]">Tile Visualizer</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   4. CHOOSE BY — tabbed filter section with color circles/cards
   ═══════════════════════════════════════════════════════════════════════ */
function ChooseBy() {
    const [tab, setTab] = useState(0);
    const tabs = ['By Colour', 'By Space', 'By Size', 'By Material', 'By Finish', 'By Style'];

    const colors = [
        { name: 'White', hex: '#f5f5f5', q: 'white' },
        { name: 'Beige', hex: '#d4c5a9', q: 'beige' },
        { name: 'Grey', hex: '#a0a0a0', q: 'grey' },
        { name: 'Dark Grey', hex: '#555555', q: 'dark-grey' },
        { name: 'Black', hex: '#222222', q: 'black' },
        { name: 'Brown', hex: '#8b6b3d', q: 'brown' },
        { name: 'Blue', hex: '#4a7c9b', q: 'blue' },
        { name: 'Green', hex: '#6b8e6b', q: 'green' },
        { name: 'Terracotta', hex: '#c75b39', q: 'terracotta' },
        { name: 'Cream', hex: '#f0e6d2', q: 'cream' },
    ];

    const spaces = [
        { name: 'Bathroom', img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop&q=80', q: 'bathroom' },
        { name: 'Kitchen', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&q=80', q: 'kitchen' },
        { name: 'Living Room', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=80', q: 'living-room' },
        { name: 'Outdoor', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&q=80', q: 'outdoor' },
        { name: 'Pool Area', img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop&q=80', q: 'pool' },
        { name: 'Commercial', img: 'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=400&h=300&fit=crop&q=80', q: 'commercial' },
    ];

    const sizes = [
        { name: '300x300', label: '300×300mm', img: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=300&h=300&fit=crop&q=80', q: '300x300' },
        { name: '300x600', label: '300×600mm', img: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=300&h=300&fit=crop&q=80', q: '300x600' },
        { name: '600x600', label: '600×600mm', img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=300&h=300&fit=crop&q=80', q: '600x600' },
        { name: '600x900', label: '600×900mm', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&h=300&fit=crop&q=80', q: '600x900' },
        { name: '600x1200', label: '600×1200mm', img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=300&h=300&fit=crop&q=80', q: '600x1200' },
        { name: '800x800', label: '800×800mm', img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=300&h=300&fit=crop&q=80', q: '800x800' },
    ];

    const materials = [
        { name: 'Porcelain', img: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&h=300&fit=crop&q=80', q: 'porcelain', desc: 'Durable, low maintenance' },
        { name: 'Ceramic', img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop&q=80', q: 'ceramic', desc: 'Classic & versatile' },
        { name: 'Natural Stone', img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop&q=80', q: 'natural-stone', desc: 'Unique natural beauty' },
        { name: 'Hybrid', img: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop&q=80', q: 'hybrid', desc: 'Waterproof rigid core' },
        { name: 'Timber', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=80', q: 'timber', desc: 'Warm natural wood' },
        { name: 'Engineered', img: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&h=300&fit=crop&q=80', q: 'engineered', desc: 'Stable & sustainable' },
    ];

    const finishes = [
        { name: 'Matt', img: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&h=300&fit=crop&q=80', q: 'matt', desc: 'Subtle & contemporary' },
        { name: 'Gloss', img: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop&q=80', q: 'gloss', desc: 'Sleek & reflective' },
        { name: 'Honed', img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop&q=80', q: 'honed', desc: 'Smooth satin feel' },
        { name: 'Textured', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=80', q: 'textured', desc: 'Grip & character' },
        { name: 'Polished', img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop&q=80', q: 'polished', desc: 'Mirror-like shine' },
        { name: 'Lappato', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop&q=80', q: 'lappato', desc: 'Semi-polished finish' },
    ];

    const styles = [
        { name: 'Marble Look', img: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop&q=80', q: 'marble-look', desc: 'Luxurious veining' },
        { name: 'Wood Look', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=80', q: 'wood-look', desc: 'Natural timber grain' },
        { name: 'Concrete Look', img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop&q=80', q: 'concrete-look', desc: 'Industrial aesthetic' },
        { name: 'Stone Look', img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop&q=80', q: 'stone-look', desc: 'Natural elegance' },
        { name: 'Terrazzo Look', img: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&h=300&fit=crop&q=80', q: 'terrazzo-look', desc: 'Retro & modern' },
        { name: 'Geometric', img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop&q=80', q: 'geometric', desc: 'Bold patterns' },
    ];

    return (
        <section className="py-16 bg-white">
            <Container>
                <div className="text-center mb-8">
                    <h2 className="text-[28px] font-light text-[#222] tracking-[2px] uppercase font-heading">Find Your <span className="font-semibold">Perfect Tile</span></h2>
                    <div className="mx-auto mt-3 h-[2px] w-12 bg-brand" />
                </div>
                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-0 mb-10 border-b border-gray-200">
                    {tabs.map((t, idx) => (
                        <button key={idx} type="button" onClick={() => setTab(idx)} className={`px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[1px] transition-all border-b-2 ${idx === tab ? 'border-brand text-brand' : 'border-transparent text-[#4a4a4a] hover:text-[#333]'}`}>{t}</button>
                    ))}
                </div>

                {/* Tab 0: Colours */}
                {tab === 0 && (
                    <div className="flex flex-wrap justify-center gap-6">
                        {colors.map(c => (
                            <Link key={c.name} href={`/shop?color=${c.q}`} className="group flex flex-col items-center gap-2 w-[80px]">
                                <div className="h-[60px] w-[60px] rounded-full shadow-md border-2 border-white transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg" style={{ backgroundColor: c.hex }} />
                                <span className="text-[11px] font-medium text-[#4a4a4a] group-hover:text-brand transition-colors">{c.name}</span>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Tab 1: Spaces — image cards */}
                {tab === 1 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {spaces.map(s => (
                            <Link key={s.name} href={`/shop?space=${s.q}`} className="group relative overflow-hidden rounded-lg aspect-[4/3]">
                                <img src={s.img} alt={s.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/70" />
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <span className="text-[13px] font-semibold text-white">{s.name}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Tab 2: Sizes — image cards with size overlay */}
                {tab === 2 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {sizes.map(s => (
                            <Link key={s.name} href={`/shop?size=${s.q}`} className="group relative overflow-hidden rounded-lg aspect-square">
                                <img src={s.img} alt={s.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/50" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[18px] font-bold text-white">{s.name}</span>
                                    <span className="text-[11px] text-white/80 mt-1">mm</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Tab 3: Materials — image cards with description */}
                {tab === 3 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {materials.map(m => (
                            <Link key={m.name} href={`/shop?material=${m.q}`} className="group relative overflow-hidden rounded-lg aspect-[3/4]">
                                <img src={m.img} alt={m.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <span className="text-[14px] font-bold text-white block">{m.name}</span>
                                    <span className="text-[11px] text-white/70 mt-0.5 block">{m.desc}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Tab 4: Finishes — image cards with description */}
                {tab === 4 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {finishes.map(f => (
                            <Link key={f.name} href={`/shop?finish=${f.q}`} className="group relative overflow-hidden rounded-lg aspect-[3/4]">
                                <img src={f.img} alt={f.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <span className="text-[14px] font-bold text-white block">{f.name}</span>
                                    <span className="text-[11px] text-white/70 mt-0.5 block">{f.desc}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Tab 5: Styles — image cards with description */}
                {tab === 5 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {styles.map(st => (
                            <Link key={st.name} href={`/shop?style=${st.q}`} className="group relative overflow-hidden rounded-lg aspect-[3/4]">
                                <img src={st.img} alt={st.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <span className="text-[14px] font-bold text-white block">{st.name}</span>
                                    <span className="text-[11px] text-white/70 mt-0.5 block">{st.desc}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   5. OUR SHOWROOM — two-column (image + text)
   ═══════════════════════════════════════════════════════════════════════ */
function OurShowroom() {
    return (
        <section className="py-20 bg-[#f7f7f5]">
            <Container>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="aspect-[4/3] bg-[#e8e6e2] rounded-lg overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop&q=80" alt="Northern Tile Distributors showroom" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[3px] text-brand mb-3">Visit Us</p>
                        <h2 className="text-[32px] font-light text-[#222] leading-tight font-heading">Our <span className="font-semibold">Showroom</span></h2>
                        <p className="mt-5 text-[14px] leading-[1.8] text-[#4a4a4a]">
                            Visit our extensive showroom at 19/324 Settlement Road, Thomastown VIC 3074. Browse thousands of tile, timber, hybrid flooring, and stone samples. Our experienced team is available to provide expert advice for your residential or commercial project.
                        </p>
                        <div className="mt-6 space-y-2 text-[13px] text-[#4a4a4a]">
                            <p><span className="font-semibold text-[#333]">Hours:</span> Mon–Fri 9:00 AM – 5:00 PM | Sat 9:00 AM – 1:00 PM</p>
                            <p><span className="font-semibold text-[#333]">Phone:</span> 03 9464 6623 | 0416 924 324</p>
                        </div>
                        <Link href="/contact" className="mt-8 inline-block border-2 border-brand px-8 py-3 text-[12px] font-semibold uppercase tracking-[1.5px] text-brand transition hover:bg-brand hover:text-white">
                            Get Directions
                        </Link>
                    </div>
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   6. OUR SERVICES — 4-column icon cards
   ═══════════════════════════════════════════════════════════════════════ */
function OurServices() {
    const services = [
        {
            title: 'Expert Advice',
            desc: 'Professional guidance from our experienced team on product selection and installation.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Chat bubble */}
                    <rect x="4" y="6" width="30" height="22" rx="4" stroke="currentColor" strokeWidth="2.2" className="transition-all duration-500 group-hover:stroke-[2.8]" />
                    <path d="M12 34v6l8-6" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                    {/* Lightbulb inside */}
                    <circle cx="19" cy="15" r="5" stroke="currentColor" strokeWidth="2" className="origin-center transition-transform duration-500 group-hover:scale-110" />
                    <path d="M17 20v2h4v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M19 10v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <path d="M14.5 11.5l-.7-.7M23.5 11.5l.7-.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {/* Sparkle */}
                    <circle cx="38" cy="10" r="1.5" fill="currentColor" className="opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                    <circle cx="42" cy="18" r="1" fill="currentColor" className="opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '200ms' }} />
                </svg>
            ),
        },
        {
            title: 'Wholesale Pricing',
            desc: 'Trade prices for builders, contractors, and renovation professionals.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Tag shape */}
                    <path d="M6 8h18l16 16-18 18L6 26V8z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="transition-transform duration-500 origin-center group-hover:rotate-[-8deg]" />
                    <circle cx="16" cy="18" r="3" stroke="currentColor" strokeWidth="2" className="transition-all duration-500 group-hover:fill-current group-hover:opacity-30" />
                    {/* Percent sign */}
                    <circle cx="24" cy="22" r="2" stroke="currentColor" strokeWidth="1.8" className="group-hover:animate-pulse" />
                    <circle cx="30" cy="28" r="2" stroke="currentColor" strokeWidth="1.8" className="group-hover:animate-pulse" style={{ animationDelay: '150ms' }} />
                    <path d="M32 20l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    {/* Down arrow */}
                    <path d="M42 6v10m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition-all duration-500" />
                </svg>
            ),
        },
        {
            title: 'Quality Guarantee',
            desc: 'All products meet Australian standards with our quality promise.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Shield */}
                    <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="transition-transform duration-500 origin-bottom group-hover:scale-[1.04]" />
                    {/* Checkmark — animated stroke */}
                    <path d="M16 24l6 6 10-12" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray="30" strokeDashoffset="30"
                        className="transition-all duration-700 group-hover:[stroke-dashoffset:0]"
                    />
                    {/* Shine effect */}
                    <path d="M36 8l2-2m2 6h2m-4 6l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                </svg>
            ),
        },
        {
            title: 'Fast Delivery',
            desc: 'Reliable delivery service across Melbourne and regional Victoria.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Box */}
                    <path d="M6 18l18-10 18 10v16L24 44 6 34V18z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="transition-transform duration-500 origin-center group-hover:-translate-y-1" />
                    <path d="M6 18l18 10 18-10M24 28v16" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                    {/* Clock */}
                    <circle cx="38" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="white" className="transition-transform duration-500 origin-center group-hover:scale-110" />
                    <path d="M38 6v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="origin-[38px_10px] group-hover:animate-[ticktock_1s_ease-in-out_infinite]" />
                    {/* Motion lines */}
                    <path d="M2 22h3M1 28h4M2 34h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="opacity-0 group-hover:opacity-50 transition-all duration-400 group-hover:-translate-x-1" />
                </svg>
            ),
        },
        {
            title: 'Price Beat Guarantee',
            desc: 'Found a lower price? We\'ll beat it. Best value on tiles and flooring guaranteed.',
            icon: (
                <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    {/* Trophy / cup */}
                    <path d="M14 8h20v14c0 6-4 10-10 10s-10-4-10-10V8z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" className="transition-transform duration-500 origin-bottom group-hover:scale-[1.04]" />
                    {/* Handles */}
                    <path d="M14 12H8c0 6 3 8 6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M34 12h6c0 6-3 8-6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Base */}
                    <path d="M20 32v4h8v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 36h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    {/* Dollar sign */}
                    <path d="M24 14v12M20 18c0-2 2-3 4-3s4 1 4 3-2 2.5-4 3-4 1-4 3 2 3 4 3 4-1 4-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="transition-all duration-500 group-hover:stroke-[2.5]" />
                    {/* Sparkles */}
                    <circle cx="8" cy="6" r="1.5" fill="currentColor" className="opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                    <circle cx="40" cy="4" r="1" fill="currentColor" className="opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '200ms' }} />
                </svg>
            ),
        },
    ];

    return (
        <section className="py-16 bg-white">
            {/* Inline keyframes for clock animation */}
            <style>{`@keyframes ticktock{0%,100%{transform:rotate(0deg)}50%{transform:rotate(20deg)}}`}</style>
            <Container>
                <div className="text-center mb-12">
                    <h2 className="text-[28px] font-light text-[#222] tracking-[2px] uppercase font-heading">Our <span className="font-semibold">Services</span></h2>
                    <div className="mx-auto mt-3 h-[2px] w-12 bg-brand" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
                    {services.map((s, i) => (
                        <div key={i} className="text-center group cursor-default">
                            <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-brand/5 text-brand transition-all duration-500 group-hover:bg-brand group-hover:text-white group-hover:shadow-xl group-hover:shadow-brand/20 group-hover:-translate-y-2 group-hover:rotate-[-3deg]">
                                {s.icon}
                            </div>
                            <h3 className="mt-5 text-[15px] font-semibold text-[#222]">{s.title}</h3>
                            <p className="mt-2 text-[13px] leading-[1.7] text-[#555] max-w-[240px] mx-auto">{s.desc}</p>
                            <div className="mx-auto mt-4 h-[2px] w-0 bg-brand transition-all duration-500 group-hover:w-10" />
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   7. FEATURED COLLECTIONS — editorial carousel with red circle badges
   ═══════════════════════════════════════════════════════════════════════ */
function FeaturedCollections() {
    const items = [
        { num: '01', name: 'SWARD Collection', desc: 'Premium Italian-inspired porcelain tiles', img: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=600&h=800&fit=crop&q=80' },
        { num: '02', name: 'Hybrid Flooring', desc: 'Waterproof rigid core in timber oak', img: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&h=800&fit=crop&q=80' },
        { num: '03', name: 'BALTIC STONE', desc: 'Natural stone look porcelain', img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=800&fit=crop&q=80' },
        { num: '04', name: 'External 20mm', desc: 'Heavy-duty outdoor pavers', img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=800&fit=crop&q=80' },
        { num: '05', name: 'Solid Oak Timber', desc: 'Sustainably sourced flooring', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=800&fit=crop&q=80' },
        { num: '06', name: 'Trade Supplies', desc: 'Mapei, ARDEX, Soudal products', img: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600&h=800&fit=crop&q=80' },
    ];
    const { r, l, rr, ck, go } = useHS(380);

    return (
        <section className="py-20 bg-[#f7f7f5]">
            <Container>
                <div className="text-center mb-10">
                    <p className="text-[11px] font-semibold uppercase tracking-[3px] text-brand mb-2">Featured</p>
                    <h2 className="text-[28px] font-light text-[#222] tracking-[2px] uppercase font-heading">Product <span className="font-semibold">Showcase</span></h2>
                    <div className="mx-auto mt-3 h-[2px] w-12 bg-brand" />
                </div>
                <div className="relative group/carousel">
                    {/* Left arrow */}
                    <button type="button" onClick={() => go('l')} disabled={!l} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 hidden sm:flex h-[48px] w-[48px] items-center justify-center rounded-full border border-gray-200 bg-white text-[#333] shadow-md transition hover:border-brand hover:text-brand disabled:opacity-0" aria-label="Previous"><CL c="h-5 w-5" /></button>
                    {/* Right arrow */}
                    <button type="button" onClick={() => go('r')} disabled={!rr} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 hidden sm:flex h-[48px] w-[48px] items-center justify-center rounded-full border border-gray-200 bg-white text-[#333] shadow-md transition hover:border-brand hover:text-brand disabled:opacity-0" aria-label="Next"><CR c="h-5 w-5" /></button>

                    <div ref={r} onScroll={ck} className="flex gap-5 overflow-x-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none' }}>
                        {items.map(item => (
                            <Link key={item.num} href="/shop" className="group relative flex-shrink-0 w-[300px] sm:w-[350px]">
                                <div className="aspect-[3/4] bg-[#e8e6e2] overflow-hidden relative">
                                    <img src={item.img} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                                    {/* Red circle badge */}
                                    <div className="absolute top-4 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg">
                                        <span className="text-[15px] font-bold">{item.num}</span>
                                    </div>
                                    {/* Content at bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                                        <h3 className="text-[18px] font-semibold text-white">{item.name}</h3>
                                        <p className="mt-1 text-[12px] text-white/80">{item.desc}</p>
                                        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1px] text-white/80 group-hover:text-white transition">
                                            Explore <CR c="h-3 w-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {/* Mobile arrows below */}
                    <div className="flex justify-center gap-3 mt-6 sm:hidden">
                        <SB d="l" off={!l} fn={() => go('l')} />
                        <SB d="r" off={!rr} fn={() => go('r')} />
                    </div>
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   8. SHOP BY COLLECTION — horizontal carousel
   ═══════════════════════════════════════════════════════════════════════ */
function ShopByCollection() {
    const collections = [
        {
            name: 'Tiles',
            desc: 'Porcelain, subway, terrazzo & more',
            img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop&q=80',
            href: '/shop?category=tiles',
            count: '120+',
        },
        {
            name: 'External',
            desc: 'Outdoor pavers & alfresco surfaces',
            img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop&q=80',
            href: '/shop?category=external',
            count: '40+',
        },
        {
            name: 'Timber',
            desc: 'Engineered & solid oak flooring',
            img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80',
            href: '/shop?category=timber',
            count: '45+',
        },
        {
            name: 'Hybrid',
            desc: 'Waterproof rigid core planks',
            img: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop&q=80',
            href: '/shop?category=hybrid',
            count: '80+',
        },
        {
            name: 'Trade Products',
            desc: 'Adhesives, grout & installation gear',
            img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop&q=80',
            href: '/shop?category=trade-products',
            count: '60+',
        },
        {
            name: 'Subway',
            desc: 'Classic subway & metro tiles',
            img: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=800&h=600&fit=crop&q=80',
            href: '/shop?category=subway',
            count: '50+',
        },
    ];

    const { r, l, rr, ck, go } = useHS(320);

    useEffect(() => { ck(); }, [ck]);

    return (
        <section className="py-20 bg-white">
            <Container>
                <div className="mb-12 flex flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[3px] text-brand mb-2">Collections</p>
                        <h2 className="text-[28px] font-light text-[#222] tracking-[2px] uppercase font-heading">Shop by <span className="font-semibold">Category</span></h2>
                        <div className="mt-3 h-[2px] w-12 bg-brand sm:mx-0 mx-auto" />
                    </div>
                    <div className="mt-5 hidden gap-2 sm:flex">
                        <SB d="l" off={!l} fn={() => go('l')} />
                        <SB d="r" off={!rr} fn={() => go('r')} />
                    </div>
                </div>
                <div
                    ref={r}
                    onScroll={ck}
                    className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {collections.map((c) => (
                        <Link
                            key={c.name}
                            href={c.href}
                            className="group relative block flex-shrink-0 snap-start overflow-hidden bg-gray-900 w-[280px] sm:w-[300px]"
                            style={{ aspectRatio: '3/4' }}
                        >
                            {/* Image with zoom on hover */}
                            <img
                                src={c.img}
                                alt={c.name}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                loading="lazy"
                            />

                            {/* Dark overlay — lighter on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-500 group-hover:from-black/80 group-hover:via-black/40" />

                            {/* Product count badge */}
                            <div className="absolute top-4 right-4 z-10">
                                <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-white border border-white/20">
                                    {c.count} Products
                                </span>
                            </div>

                            {/* Content — slides up on hover */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 z-10 transition-transform duration-500 ease-out group-hover:-translate-y-2">
                                <h3 className="text-[22px] font-bold text-white tracking-wide">{c.name}</h3>
                                <p className="mt-1 text-[13px] text-white/70 transition-colors duration-300 group-hover:text-white/90">{c.desc}</p>

                                {/* Explore link — fades in on hover */}
                                <div className="mt-4 flex items-center gap-2 opacity-0 translate-y-3 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                                    <span className="text-[12px] font-semibold uppercase tracking-[1.5px] text-white">Explore</span>
                                    <svg className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>

                                {/* Animated underline */}
                                <div className="mt-3 h-[2px] bg-brand w-0 transition-all duration-500 ease-out group-hover:w-16" />
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="mt-5 flex justify-center gap-2 sm:hidden">
                    <SB d="l" off={!l} fn={() => go('l')} />
                    <SB d="r" off={!rr} fn={() => go('r')} />
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   9. PROUD CUSTOMERS — Instagram reel-style carousel
   ═══════════════════════════════════════════════════════════════════════ */
function ProudCustomers() {
    const { r, l, rr, ck, go } = useHS(200);

    const reels = [
        { img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=700&fit=crop&q=80', caption: 'Beautiful living room tiled with our SWARD collection', hasVideo: true },
        { img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=700&fit=crop&q=80', caption: 'Bathroom renovation using Baltic Stone porcelain', hasVideo: false },
        { img: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&h=700&fit=crop&q=80', caption: 'Kitchen splashback with Italian subway tiles', hasVideo: true },
        { img: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=700&fit=crop&q=80', caption: 'Hybrid flooring install — waterproof & stunning', hasVideo: false },
        { img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=700&fit=crop&q=80', caption: 'Outdoor entertaining area with 20mm porcelain', hasVideo: true },
        { img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=700&fit=crop&q=80', caption: 'Our Thomastown showroom tile display wall', hasVideo: false },
        { img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=700&fit=crop&q=80', caption: 'Marble-look porcelain in a modern ensuite', hasVideo: true },
        { img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=700&fit=crop&q=80', caption: 'Engineered timber throughout open plan home', hasVideo: false },
    ];

    return (
        <section className="py-16 bg-[#fafafa]">
            <Container>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        {/* Instagram-style gradient icon */}
                        <div className="flex-shrink-0 h-14 w-14 rounded-full p-[3px]" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                            <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-[20px] font-bold text-[#222] font-heading">Proud Customers of NTD</h2>
                            <p className="text-[13px] text-[#555]">Watch, explore, and shop instantly</p>
                        </div>
                    </div>
                    <a href="https://www.instagram.com/northern.tile.distributors/" target="_blank" rel="noreferrer noopener" className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-[#333] hover:text-brand transition-colors">
                        View All
                        <CR c="h-4 w-4" />
                    </a>
                </div>

                {/* Reel carousel */}
                <div className="relative group/reel">
                    {/* Left arrow */}
                    <button type="button" onClick={() => go('l')} disabled={!l} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#333] shadow-lg border border-gray-200 transition hover:bg-gray-50 disabled:opacity-0" aria-label="Previous">
                        <CL c="h-5 w-5" />
                    </button>
                    {/* Right arrow */}
                    <button type="button" onClick={() => go('r')} disabled={!rr} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#333] shadow-lg border border-gray-200 transition hover:bg-gray-50 disabled:opacity-0" aria-label="Next">
                        <CR c="h-5 w-5" />
                    </button>

                    <div ref={r} onScroll={ck} className="flex gap-3 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                        {reels.map((reel, i) => (
                            <div key={i} className="group flex-shrink-0 w-[180px] sm:w-[200px] cursor-pointer relative overflow-hidden rounded-xl">
                                {/* Image */}
                                <div className="aspect-[9/16] overflow-hidden bg-gray-200">
                                    <img
                                        src={reel.img}
                                        alt={reel.caption}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Play button for video reels */}
                                {reel.hasVideo && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                                            <svg className="h-5 w-5 text-gray-900 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21" />
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                {/* Caption at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                                    <p className="text-[11px] leading-snug text-white/90 line-clamp-2">{reel.caption}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Follow CTA */}
                <div className="mt-8 flex justify-center">
                    <a
                        href="https://www.instagram.com/northern.tile.distributors/"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-[14px] font-semibold text-white shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                        style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                        Follow @northerntile
                    </a>
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   10. BRAND PARTNERS — logo text row
   ═══════════════════════════════════════════════════════════════════════ */
function BrandPartners() {
    const brands = ['Mapei', 'ARDEX', 'Soudal', 'SWARD', 'BALTIC STONE', 'TUNDRA', 'ENZO', 'Lauxes', 'Australian Tiling Adhesive (ATA)'];
    return (
        <section className="py-12 bg-white border-t border-b border-gray-100">
            <Container>
                <div className="flex flex-wrap items-center justify-center gap-10">
                    {brands.map(b => <span key={b} className="text-[16px] font-bold text-[#595959] tracking-[2px] uppercase hover:text-brand transition-colors cursor-default">{b}</span>)}
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   11. STATS COUNTER — animated number counters
   ═══════════════════════════════════════════════════════════════════════ */
function useCountUp(end, duration = 2000, start = 0) {
    const [count, setCount] = useState(start);
    const [started, setStarted] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;
        let raf;
        const startTime = performance.now();
        const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(start + (end - start) * eased));
            if (progress < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [started, end, duration, start]);

    return { count, ref };
}

function StatsSection() {
    const stats = [
        { value: 15, suffix: '+', label: 'Years Experience', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { value: 5000, suffix: '+', label: 'Happy Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { value: 450, suffix: '+', label: 'Products Available', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { value: 98, suffix: '%', label: 'Customer Satisfaction', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ];

    return (
        <section className="py-20 bg-[#222] text-white relative overflow-hidden">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            <Container>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {stats.map((s, i) => {
                        const { count, ref: cRef } = useCountUp(s.value, 2200);
                        return (
                            <div key={i} ref={cRef} className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-white/10">
                                    <svg className="h-7 w-7 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                                    </svg>
                                </div>
                                <div className="text-[40px] font-bold leading-none tracking-tight font-heading">
                                    {count.toLocaleString()}{s.suffix}
                                </div>
                                <p className="mt-2 text-[13px] font-medium text-white/60 uppercase tracking-[1.5px]">{s.label}</p>
                            </div>
                        );
                    })}
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   12. CUSTOMER REVIEWS — testimonial carousel
   ═══════════════════════════════════════════════════════════════════════ */
function CustomerReviews() {
    const businessUnitId = import.meta.env.VITE_TRUSTPILOT_BUSINESS_UNIT_ID;

    if (!businessUnitId) return null;

    return (
        <section className="py-20 bg-[#f7f7f5]">
            <Container>
                <div className="mb-10">
                    <p className="text-[11px] font-semibold uppercase tracking-[3px] text-brand mb-2">Testimonials</p>
                    <h2 className="text-[28px] font-light text-[#222] tracking-[2px] uppercase font-heading">What Our <span className="font-semibold">Customers Say</span></h2>
                    <div className="mt-3 h-[2px] w-12 bg-brand" />
                </div>

                <TrustpilotCarousel businessUnitId={businessUnitId} />
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN HOME
   ═══════════════════════════════════════════════════════════════════════ */
export default function Home({ hero_slider, category_carousel, new_arrivals, video_section, discount_tile_carousel, gallery }) {
    const products = new_arrivals?.products || discount_tile_carousel?.products || [];
    return (
        <PublicLayout>
            <Head title="Home" />
            <HeroSlider heroSlider={hero_slider} />
            <ShopByCollection />
            <TrendingProducts products={products} />
            <TileVisualizer />
            <ChooseBy />
            <OurShowroom />
            <OurServices />
            <FeaturedCollections />
            <ProudCustomers />
            <StatsSection />
            <CustomerReviews />
            <BrandPartners />
        </PublicLayout>
    );
}
