import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRef, useState, useCallback } from 'react';
import { StarRating } from '@/Components/Catalog/StarRating';
import ProductImage from '@/Components/Catalog/ProductImage';
import TrustpilotCarousel from '@/Components/Storefront/TrustpilotCarousel';


/* ── Utility: strip HTML ──────────────────────────────────────────── */
function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    let text = tmp.textContent || tmp.innerText || '';
    text = text.replace(/✅\s*/g, '• ');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
}

function parseDescription(html) {
    if (!html) return { text: '', features: [] };
    const stripped = stripHtml(html);
    const lines = stripped.split('\n').map(l => l.trim()).filter(Boolean);
    const features = [];
    const textParts = [];
    for (const line of lines) {
        if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('✓ ')) {
            features.push(line.replace(/^[•\-✓]\s*/, ''));
        } else {
            textParts.push(line);
        }
    }
    return { text: textParts.join('\n'), features };
}


/* ── Icons ─────────────────────────────────────────────────────────── */
const CL = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const CR = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const Minus = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>;
const Plus = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const Check = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const Heart = ({ c, filled }) => filled
    ? <svg className={c} fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
    : <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const Share = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
const Tag = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
const Star = ({ c, filled }) => <svg className={c} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;

/* ── Scroll Arrow Button ──────────────────────────────────────────── */
function SBtn({ dir, disabled, onClick }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled} className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed" aria-label={dir === 'l' ? 'Previous' : 'Next'}>
            {dir === 'l' ? <CL c="h-4 w-4" /> : <CR c="h-4 w-4" />}
        </button>
    );
}

/* ── Available Coupons ────────────────────────────────────────────── */
function AvailableCoupons({ coupons = [] }) {
    if (!coupons?.length) return null;
    return (
        <div className="mt-6 rounded-lg border border-dashed border-green-300 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-3">
                <Tag c="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Available Offers</span>
            </div>
            <div className="space-y-2">
                {coupons.map((coupon, i) => (
                    <div key={coupon.code || i} className="flex items-start gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <code className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">{coupon.code}</code>
                                {coupon.type === 'free_shipping' && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">Free Shipping</span>}
                            </div>
                            <p className="mt-1 text-xs text-green-700">
                                {coupon.title || coupon.description || (coupon.type === 'percentage' ? `Get ${coupon.value}% off` : coupon.type === 'fixed_amount' ? `Get $${coupon.value} off` : coupon.type === 'free_shipping' ? 'Free shipping' : `Save with ${coupon.code}`)}
                                {coupon.minimum_purchase > 0 && <span className="text-green-600"> (Min. ${coupon.minimum_purchase?.toLocaleString()})</span>}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION: Image Gallery with Thumbnails
   ═══════════════════════════════════════════════════════════════════ */
function ImageGallery({ product, discountPercent }) {
    // Build image list: always start with the main image_url (e.g. Shopify CDN),
    // then append any media entries that are real external URLs (not local storage paths).
    const rawImages = [];
    if (product.image_url) rawImages.push(product.image_url);
    if (product.media?.length) {
        product.media
            .filter(m => m.type === 'image')
            .map(m => m.url || m.path)
            .filter(u => u && /^https?:\/\//i.test(u) && !u.includes('localhost') && !u.includes('127.0.0.1'))
            .forEach(u => { if (!rawImages.includes(u)) rawImages.push(u); });
    }
    const images = rawImages.filter(Boolean).length ? rawImages.filter(Boolean) : [null];

    const [active, setActive] = useState(0);

    return (
        <div>
            {/* Main image */}
            <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <ProductImage src={images[active]} alt={product.name} className="h-full w-full object-contain" />
                {discountPercent > 0 && (
                    <div className="absolute left-3 top-3 rounded-md bg-brand px-3 py-1 text-sm font-bold text-white">
                        -{discountPercent}%
                    </div>
                )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {images.map((img, i) => (
                        <button key={i} type="button" onClick={() => setActive(i)} className={`flex-shrink-0 h-16 w-16 overflow-hidden rounded-lg border-2 bg-white transition ${i === active ? 'border-brand' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                            <ProductImage src={img} alt="" className="h-full w-full object-contain" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION: Frequently Bought Together
   ═══════════════════════════════════════════════════════════════════ */
function FrequentlyBoughtTogether({ products, currentProduct }) {
    const [selected, setSelected] = useState(() => (products || []).slice(0, 3).map(p => p.id));
    const [adding, setAdding] = useState(false);

    if (!products?.length) return null;

    const items = products.slice(0, 3);
    const selectedItems = items.filter(p => selected.includes(p.id));
    const total = selectedItems.reduce((s, p) => s + (parseFloat(p.price) || 0), 0) + (parseFloat(currentProduct.price) || 0);

    const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const addAll = () => {
        setAdding(true);
        const ids = [currentProduct.id, ...selectedItems.map(p => p.id)];
        const addNext = (i) => {
            if (i >= ids.length) { setAdding(false); window.dispatchEvent(new CustomEvent('cart-updated')); window.dispatchEvent(new CustomEvent('open-cart-sidebar')); return; }
            fetch('/api/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content }, credentials: 'same-origin', body: JSON.stringify({ product_id: ids[i], quantity: 1 }) }).then(() => addNext(i + 1)).catch(() => addNext(i + 1));
        };
        addNext(0);
    };

    return (
        <section className="py-10 bg-gray-50 border-t border-gray-200">
            <Container>
                <h2 className="text-lg font-bold text-gray-900 mb-6 font-heading">Frequently Bought Together</h2>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                        {/* Product cards with + signs */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* This item */}
                            <div className="text-center w-[130px]">
                                <div className="aspect-square overflow-hidden rounded-lg border-2 border-brand bg-gray-50">
                                    <ProductImage src={currentProduct.image_url} alt={currentProduct.name} className="h-full w-full object-cover" />
                                </div>
                                <p className="mt-2 text-[11px] text-gray-500">This item</p>
                                <p className="text-[12px] font-medium text-gray-900 line-clamp-2">{currentProduct.name}</p>
                                <p className="text-[13px] font-bold text-gray-900 mt-1">${parseFloat(currentProduct.price || 0).toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">/ sqm</span></p>
                            </div>

                            {items.map((p) => (
                                <div key={p.id} className="flex items-center gap-2">
                                    <span className="text-3xl font-extralight text-gray-300">+</span>
                                    <div className="text-center w-[130px]">
                                        <button type="button" onClick={() => toggle(p.id)} className={`aspect-square w-full overflow-hidden rounded-lg border-2 bg-gray-50 transition ${selected.includes(p.id) ? 'border-brand' : 'border-gray-200 opacity-40'}`}>
                                            <ProductImage src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                        </button>
                                        <label className="mt-2 flex items-center justify-center gap-1 cursor-pointer">
                                            <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="h-3.5 w-3.5 rounded border-gray-300 text-brand focus:ring-brand" />
                                            <span className="text-[11px] text-gray-500">Add this</span>
                                        </label>
                                        <p className="text-[12px] font-medium text-gray-900 line-clamp-2">{p.name}</p>
                                        <p className="text-[13px] font-bold text-gray-900 mt-0.5">${parseFloat(p.price || 0).toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">/ sqm</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total + Add all */}
                        <div className="flex-shrink-0 lg:ml-auto text-center lg:text-left">
                            <p className="text-sm text-gray-500">Total price</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">${total.toFixed(2)}</p>
                            <button type="button" onClick={addAll} disabled={adding || selected.length === 0} className="mt-3 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition disabled:opacity-50 whitespace-nowrap">
                                {adding ? 'Adding...' : `Add All ${selectedItems.length + 1} to Cart`}
                            </button>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION: Compare with Similar Items
   ═══════════════════════════════════════════════════════════════════ */
function CompareWithSimilar({ currentProduct, products }) {
    if (!products?.length) return null;

    const compareItems = [currentProduct, ...products.slice(0, 3)];

    const addToCart = (productId) => {
        router.post(route('cart.store'), { product_id: productId, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => { window.dispatchEvent(new CustomEvent('cart-updated')); window.dispatchEvent(new CustomEvent('open-cart-sidebar')); },
        });
    };

    return (
        <section className="py-10 border-t border-gray-200">
            <Container>
                <h2 className="text-lg font-bold text-gray-900 mb-6 font-heading">Compare with Similar Items</h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] table-fixed">
                        <colgroup>
                            {compareItems.map(p => <col key={p.id} style={{ width: `${100 / compareItems.length}%` }} />)}
                        </colgroup>
                        {/* Images row */}
                        <thead>
                            <tr>
                                {compareItems.map((p, i) => (
                                    <th key={p.id} className="p-3 align-top">
                                        <div className="flex flex-col items-center">
                                            <Link href={route('products.show', p.slug)} className="block w-full aspect-square overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
                                                <ProductImage src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                            </Link>
                                            <Link href={route('products.show', p.slug)} className="mt-2 text-[13px] font-medium text-brand hover:underline text-center line-clamp-2">
                                                {p.name}
                                            </Link>
                                            {i === 0 && <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 uppercase">Current</span>}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Price */}
                            <tr className="bg-gray-50/50">
                                {compareItems.map((p, i) => (
                                    <td key={p.id} className="px-3 py-2 text-[12px] font-semibold text-gray-500 uppercase tracking-wide">{i === 0 ? 'Price' : ''}</td>
                                ))}
                            </tr>
                            <tr>
                                {compareItems.map(p => (
                                    <td key={p.id} className="p-3 text-center">
                                        <span className="text-[15px] font-bold text-gray-900">${parseFloat(p.price || 0).toFixed(2)}</span>
                                        {p.compare_at_price > p.price && <span className="ml-1 text-[12px] text-gray-400 line-through">${parseFloat(p.compare_at_price || 0).toFixed(2)}</span>}
                                    </td>
                                ))}
                            </tr>
                            {/* Brand */}
                            <tr className="bg-gray-50/50">
                                {compareItems.map((p, i) => (
                                    <td key={p.id} className="px-3 py-2 text-[12px] font-semibold text-gray-500 uppercase tracking-wide">{i === 0 ? 'Brand' : ''}</td>
                                ))}
                            </tr>
                            <tr>
                                {compareItems.map(p => (
                                    <td key={p.id} className="p-3 text-center text-[13px] text-gray-700">{p.brand || 'Northern Tile'}</td>
                                ))}
                            </tr>
                            {/* Category */}
                            <tr className="bg-gray-50/50">
                                {compareItems.map((p, i) => (
                                    <td key={p.id} className="px-3 py-2 text-[12px] font-semibold text-gray-500 uppercase tracking-wide">{i === 0 ? 'Category' : ''}</td>
                                ))}
                            </tr>
                            <tr>
                                {compareItems.map(p => (
                                    <td key={p.id} className="p-3 text-center text-[13px] text-gray-700">{p.category?.name || p.product_type || '—'}</td>
                                ))}
                            </tr>
                            {/* Availability */}
                            <tr className="bg-gray-50/50">
                                {compareItems.map((p, i) => (
                                    <td key={p.id} className="px-3 py-2 text-[12px] font-semibold text-gray-500 uppercase tracking-wide">{i === 0 ? 'Availability' : ''}</td>
                                ))}
                            </tr>
                            <tr>
                                {compareItems.map(p => (
                                    <td key={p.id} className="p-3 text-center">
                                        <span className="text-[13px] font-medium text-green-600">In Stock</span>
                                    </td>
                                ))}
                            </tr>
                            {/* Add to Cart */}
                            <tr>
                                {compareItems.map((p, i) => (
                                    <td key={p.id} className="p-3 text-center">
                                        <button type="button" onClick={() => addToCart(p.id)} className={`rounded-none px-4 py-2 text-[13px] font-semibold transition ${i === 0 ? 'bg-brand text-white hover:bg-brand-dark' : 'border border-brand text-brand hover:bg-brand hover:text-white'}`}>
                                            Add to Cart
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION: Products Related to This Item (carousel with Add to Cart)
   ═══════════════════════════════════════════════════════════════════ */
function RelatedProducts({ products }) {
    const ref = useRef(null);
    const [cl, setCl] = useState(false);
    const [cr, setCr] = useState(true);
    const ck = useCallback(() => { if (!ref.current) return; const { scrollLeft: s, scrollWidth: w, clientWidth: c } = ref.current; setCl(s > 10); setCr(s < w - c - 10); }, []);
    const go = (d) => { ref.current?.scrollBy({ left: d === 'l' ? -280 : 280, behavior: 'smooth' }); setTimeout(ck, 350); };

    if (!products?.length) return null;

    const addToCart = (productId) => {
        router.post(route('cart.store'), { product_id: productId, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => { window.dispatchEvent(new CustomEvent('cart-updated')); window.dispatchEvent(new CustomEvent('open-cart-sidebar')); },
        });
    };

    return (
        <section className="py-10 border-t border-gray-200">
            <Container>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Products Related to This Item</h2>
                    <div className="flex items-center gap-2">
                        <SBtn dir="l" disabled={!cl} onClick={() => go('l')} />
                        <SBtn dir="r" disabled={!cr} onClick={() => go('r')} />
                    </div>
                </div>
                <div ref={ref} onScroll={ck} className="flex gap-4 overflow-x-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none' }}>
                    {products.map((p) => {
                        const disc = p.compare_at_price > p.price ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100) : 0;
                        return (
                            <div key={p.id} className="flex-shrink-0 w-[200px] rounded-none border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                                <Link href={route('products.show', p.slug)} className="block">
                                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                                        <ProductImage src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />
                                        {disc > 0 && (
                                            <div className="absolute left-0 top-3">
                                                <span className="rounded-r-full bg-brand px-3 py-1 text-[11px] font-bold text-white shadow-sm">{disc}% off</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <div className="p-3">
                                    <Link href={route('products.show', p.slug)} className="text-[13px] font-semibold text-gray-900 hover:text-brand line-clamp-2 block min-h-[36px]">{p.name}</Link>
                                    <div className="mt-2">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-[16px] font-bold text-gray-900">${parseFloat(p.price || 0).toFixed(2)}</span>
                                            <span className="text-[11px] text-gray-400">/ sqm</span>
                                            {disc > 0 && <span className="text-[13px] text-gray-400 line-through">${parseFloat(p.compare_at_price || 0).toFixed(2)}</span>}
                                        </div>
                                        {disc > 0 && <p className="mt-0.5 text-[12px] font-medium text-green-600">Save {disc}%</p>}
                                    </div>
                                    <button type="button" onClick={() => addToCart(p.id)} className="mt-3 w-full rounded-none bg-brand px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-dark transition">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function Show({ product, relatedProducts, availableCoupons = [] }) {
    const { settings } = usePage().props;
    const [quantity, setQuantity] = useState(1);
    const [area, setArea] = useState(1);
    const [wastage, setWastage] = useState(true);
    const [showWastageModal, setShowWastageModal] = useState(false);
    const [showSampleModal, setShowSampleModal] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [addingSample, setAddingSample] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);

    const generateJsonLd = () => {
        const baseUrl = window.location.origin;
        const productUrl = `${baseUrl}${route('products.show', product.slug, false)}`;
        const jsonLd = {
            '@context': 'https://schema.org', '@type': 'Product', name: product.name,
            description: product.description || product.short_description || '',
            image: product.image_url ? [product.image_url] : [],
            sku: product.sku || `PROD-${product.id}`, mpn: product.sku || `PROD-${product.id}`,
            brand: { '@type': 'Brand', name: settings?.site_name || 'Northern TILE Distributors' },
            offers: { '@type': 'Offer', url: productUrl, priceCurrency: 'AUD', price: product.price, priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@type': 'Organization', name: settings?.site_name || 'Northern TILE Distributors' } },
        };

        if (product.category) jsonLd.category = product.category.name;
        return jsonLd;
    };

    const sqmPerBox = parseFloat(product?.sqm_per_box) || 0;
    const hasBoxes = sqmPerBox > 0;
    const requiredArea = wastage ? area * 1.1 : area;
    const boxCount = hasBoxes ? Math.max(1, Math.ceil(requiredArea / sqmPerBox)) : 0;
    // Boxed products round up to the nearest full box; sold-by-m² products
    // keep the decimal (cart_items.quantity is decimal(10,2) post-migration).
    const billedSqm = hasBoxes
        ? Math.max(sqmPerBox, parseFloat((boxCount * sqmPerBox).toFixed(2)))
        : Math.max(0.01, parseFloat(requiredArea.toFixed(2)));

    const cartQuantity = () => billedSqm;

    const addToCart = () => {
        setAddingToCart(true);
        router.post(route('cart.store'), { product_id: product.id, quantity: cartQuantity() }, {
            preserveScroll: true,
            onSuccess: () => { window.dispatchEvent(new CustomEvent('cart-updated')); window.dispatchEvent(new CustomEvent('open-cart-sidebar')); },
            onFinish: () => setAddingToCart(false),
        });
    };

    const buyNow = () => {
        setBuyingNow(true);
        router.post(route('cart.store'), { product_id: product.id, quantity: cartQuantity() }, {
            preserveScroll: true,
            onSuccess: () => { window.dispatchEvent(new CustomEvent('cart-updated')); router.visit('/checkout'); },
            onFinish: () => setBuyingNow(false),
        });
    };

    const doAddSample = () => {
        setAddingSample(true);
        router.post(route('cart.store'), { product_id: product.id, quantity: 1, is_sample: true }, {
            preserveScroll: true,
            onSuccess: () => { window.dispatchEvent(new CustomEvent('cart-updated')); window.dispatchEvent(new CustomEvent('open-cart-sidebar')); },
            onFinish: () => setAddingSample(false),
        });
    };

    const addSample = () => {
        // Show the explainer modal on first-time click per browser
        const seen = typeof window !== 'undefined' && window.localStorage?.getItem('nt_sample_modal_seen');
        if (!seen) {
            setShowSampleModal(true);
            return;
        }
        doAddSample();
    };

    const confirmSampleFromModal = () => {
        if (typeof window !== 'undefined') {
            window.localStorage?.setItem('nt_sample_modal_seen', '1');
        }
        setShowSampleModal(false);
        doAddSample();
    };

    const adjustArea = (delta) => {
        setArea(prev => Math.max(1, prev + delta));
    };

    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discountPercent = hasDiscount ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;

    return (
        <PublicLayout>
            <Head title={product.name}>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJsonLd()) }} />
            </Head>

            {/* Breadcrumb */}
            <section className="py-3 border-b border-gray-100 bg-gray-50/50">
                <Container>
                    <nav className="flex items-center gap-2 text-[13px] text-gray-500">
                        <Link href={route('home')} className="hover:text-gray-900">Home</Link>
                        <span>/</span>
                        <Link href={route('shop.index')} className="hover:text-gray-900">Shop</Link>
                        {product.category && <><span>/</span><Link href={route('shop.category', product.category.slug)} className="hover:text-gray-900">{product.category.name}</Link></>}
                        <span>/</span>
                        <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
                    </nav>
                </Container>
            </section>

            {/* Product Details */}
            <section className="py-8">
                <Container>
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 items-start">
                        {/* Left: Image Gallery */}
                        <div className="lg:sticky lg:top-4">
                            <ImageGallery product={product} discountPercent={discountPercent} />
                        </div>

                        {/* Right: Product Info */}
                        <div>
                            {/* Brand */}
                            {product.brand && <p className="text-[13px] font-medium text-brand">{product.brand}</p>}

                            {/* Category */}
                            {product.category && !product.brand && (
                                <Link href={route('shop.category', product.category.slug)} className="text-[13px] font-medium text-brand hover:underline">{product.category.name}</Link>
                            )}

                            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl leading-tight font-heading">{product.name}</h1>


                            {/* Price block */}
                            <div className="mt-4 rounded-lg bg-gray-50 p-4">
                                {hasDiscount && <span className="inline-block rounded bg-brand/10 px-2 py-0.5 text-[12px] font-bold text-brand mb-2">-{discountPercent}% Limited Deal</span>}
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-bold text-gray-900">${parseFloat(product.price || 0).toFixed(2)}</span>
                                    <span className="text-sm text-gray-500">/ sqm</span>
                                    {hasDiscount && (
                                        <span className="text-lg text-gray-400 line-through">${parseFloat(product.compare_at_price || 0).toFixed(2)}</span>
                                    )}
                                </div>
                                <p className="mt-1 text-[12px] text-gray-500">Inclusive of all taxes · Total calculated in cart</p>
                            </div>

                            {/* Stock status */}
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-[13px] font-medium text-green-700">In Stock</span>
                            </div>

                            {/* Area Calculator */}
                            <div className="mt-5">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5">
                                        <span className="text-[13px] font-semibold text-gray-700">Area</span>
                                        <button type="button" onClick={() => adjustArea(-1)} disabled={area <= 1} className="text-gray-500 hover:text-brand disabled:opacity-30 transition"><Minus c="h-4 w-4" /></button>
                                        <span className="min-w-[2rem] text-center text-[15px] font-bold text-gray-900">{area}</span>
                                        <span className="text-[13px] text-gray-500">M<sup>2</sup></span>
                                        <button type="button" onClick={() => adjustArea(1)} className="text-gray-500 hover:text-brand transition"><Plus c="h-4 w-4" /></button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-semibold text-brand">Please add 10% wastage</span>
                                        <button type="button" onClick={() => { if (wastage) { setShowWastageModal(true); } else { setWastage(true); } }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${wastage ? 'bg-brand' : 'bg-gray-300'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${wastage ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                {hasBoxes && <p className="mt-1.5 text-[11px] text-gray-400">We round up to the full box</p>}
                                {hasBoxes ? (
                                    <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-700">
                                        <span className="font-semibold text-gray-900">{boxCount} {boxCount === 1 ? 'Box' : 'Boxes'}</span>
                                        <span className="text-gray-500"> = {billedSqm.toFixed(2)} m²</span>
                                        <span className="ml-2 text-[12px] font-bold text-gray-900">${(parseFloat(product.price || 0) * billedSqm).toFixed(2)}</span>
                                        {wastage && <span className="ml-2 text-[11px] text-brand">(incl. 10% wastage)</span>}
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-700">
                                        <span className="font-semibold text-gray-900">{billedSqm.toFixed(2)} m²</span>
                                        <span className="ml-2 text-[12px] font-bold text-gray-900">${(parseFloat(product.price || 0) * billedSqm).toFixed(2)}</span>
                                        {wastage && <span className="ml-2 text-[11px] text-brand">(incl. 10% wastage)</span>}
                                    </div>
                                )}
                            </div>

                            {/* Add to Cart + Get a Sample */}
                            <div className="mt-4 flex flex-wrap gap-3">
                                <button type="button" onClick={addToCart} disabled={addingToCart || buyingNow} className="flex-1 rounded-lg bg-brand px-8 py-3 text-sm font-bold text-white uppercase tracking-wide hover:bg-brand-dark transition disabled:opacity-50">
                                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                                </button>
                                <button type="button" onClick={addSample} disabled={addingSample} className="flex-1 rounded-lg border-2 border-gray-800 px-8 py-3 text-sm font-bold text-gray-800 uppercase tracking-wide hover:bg-gray-800 hover:text-white transition disabled:opacity-50">
                                    {addingSample ? 'Adding...' : 'Get a Sample'}
                                </button>
                            </div>
                            <p className="mt-1.5 text-[11px] text-gray-400">Free samples · Max 5 per order · Flat $9.99 shipping</p>

                            {/* Wishlist + Share */}
                            <div className="mt-4 flex items-center gap-4">
                                <button type="button" onClick={() => setWishlisted(!wishlisted)} className="flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-brand transition">
                                    <Heart c="h-5 w-5" filled={wishlisted} />
                                    {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                                </button>
                                <button type="button" onClick={() => navigator.share?.({ title: product.name, url: window.location.href }).catch(() => {})} className="flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-brand transition">
                                    <Share c="h-5 w-5" />
                                    Share
                                </button>
                            </div>

                            {/* Coupons */}
                            <AvailableCoupons coupons={availableCoupons} />

                            {/* Description */}
                            {product.description && (
                                <div className="mt-6 border-t border-gray-200 pt-5">
                                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-1">Description</h2>
                                    <div
                                        className="product-description"
                                        dangerouslySetInnerHTML={{ __html: product.description }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </Container>
            </section>

            {/* Frequently Bought Together */}
            <FrequentlyBoughtTogether products={relatedProducts} currentProduct={product} />

            {/* Compare with Similar Items */}
            <CompareWithSimilar currentProduct={product} products={relatedProducts} />

            {/* Products Related to This Item */}
            <RelatedProducts products={relatedProducts} />

            {/* Trustpilot Reviews */}
            {import.meta.env.VITE_TRUSTPILOT_BUSINESS_UNIT_ID && (
                <section className="py-10 border-t border-gray-200">
                    <Container>
                        <div className="mb-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[3px] text-brand mb-2">Verified Reviews</p>
                            <h2 className="text-[22px] font-light text-[#222] tracking-[2px] uppercase font-heading">What Our <span className="font-semibold">Customers Say</span></h2>
                            <div className="mt-3 h-[2px] w-12 bg-brand" />
                        </div>
                        <TrustpilotCarousel
                            businessUnitId={import.meta.env.VITE_TRUSTPILOT_BUSINESS_UNIT_ID}
                            templateId="53aa8912dec7e10d38f59f36"
                            height="140px"
                        />
                    </Container>
                </section>
            )}

            {/* Wastage Warning Modal */}
            {showWastageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowWastageModal(false)}>
                    <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => setShowWastageModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="flex flex-col sm:flex-row gap-6 p-6">
                            {/* Tile illustration */}
                            <div className="flex-shrink-0 flex items-center justify-center">
                                <svg className="w-40 h-40" viewBox="0 0 160 160" fill="none">
                                    {/* Floor outline */}
                                    <rect x="10" y="10" width="120" height="120" rx="2" stroke="#d4a853" strokeWidth="2.5" fill="#fdf8ee" />
                                    {/* Grid tiles */}
                                    {[0,1,2,3].map(r => [0,1,2,3].map(c => (
                                        <rect key={`${r}-${c}`} x={14 + c*28} y={14 + r*28} width="24" height="24" rx="1" fill="#f5ead0" stroke="#d4a853" strokeWidth="1" />
                                    )))}
                                    {/* L-shaped cutout overlay (wastage area) */}
                                    <path d="M130 10 L130 80 L90 80 L90 130 L10 130 L10 10 Z" fill="none" stroke="#d4a853" strokeWidth="2.5" />
                                    <path d="M130 80 L130 130 L90 130 L90 80 Z" fill="#f5ead0" stroke="#e8a030" strokeWidth="2" strokeDasharray="4 3" />
                                    {/* Extra tiles outside (wastage pieces) */}
                                    <rect x="135" y="14" width="18" height="18" rx="1" fill="#fce8c0" stroke="#e8a030" strokeWidth="1.5" />
                                    <rect x="135" y="38" width="18" height="18" rx="1" fill="#fce8c0" stroke="#e8a030" strokeWidth="1.5" />
                                    <rect x="135" y="62" width="18" height="18" rx="1" fill="#fce8c0" stroke="#e8a030" strokeWidth="1.5" />
                                </svg>
                            </div>
                            {/* Text content */}
                            <div className="flex-1">
                                <h3 className="text-xl font-extrabold text-gray-900">WAIT! NO WASTAGE?</h3>
                                <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                                    Unless you've already allowed for it, we <strong className="text-gray-900">HIGHLY</strong> recommend adding extra tiles.
                                </p>
                                <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                                    Wastage covers offcuts, errors, and a couple spares at the end.
                                </p>
                                <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
                                    After guiding 10,000+ tile projects, we've found 10% wastage to be the sweet spot.
                                </p>
                                <div className="mt-5 flex gap-3">
                                    <button type="button" onClick={() => setShowWastageModal(false)} className="flex-1 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white uppercase tracking-wide hover:bg-blue-700 transition">
                                        Keep Wastage
                                    </button>
                                    <button type="button" onClick={() => { setWastage(false); setShowWastageModal(false); }} className="flex-1 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white uppercase tracking-wide hover:bg-blue-700 transition">
                                        No Wastage
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sample Explainer Modal */}
            {showSampleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSampleModal(false)}>
                    <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => setShowSampleModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition" aria-label="Close">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="p-6">
                            {/* Header with tile visual */}
                            <div className="flex items-center justify-center mb-5">
                                <svg className="w-full max-w-[300px] h-20" viewBox="0 0 300 80" fill="none">
                                    {/* 5 sample tiles in a row */}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <g key={i}>
                                            <rect
                                                x={6 + i * 58}
                                                y={10}
                                                width={50}
                                                height={50}
                                                rx="6"
                                                fill={['#f5ead0', '#e8d5a3', '#d4b480', '#c49960', '#a87f4a'][i]}
                                                stroke="#b8860b"
                                                strokeWidth="1.5"
                                            />
                                            <circle cx={31 + i * 58} cy={35} r="3.5" fill="#fff" opacity="0.6" />
                                        </g>
                                    ))}
                                </svg>
                            </div>

                            <h3 className="text-center text-2xl font-extrabold text-gray-900 tracking-tight">Order samples for just $9.99</h3>
                            <p className="mt-2 text-center text-[12px] font-semibold uppercase tracking-wider text-brand">Free samples · Flat $9.99 shipping</p>

                            <div className="mt-5 space-y-3 text-[14px] leading-relaxed text-gray-700">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[12px] font-bold">✓</div>
                                    <p><strong className="text-gray-900">Samples themselves are FREE.</strong> You only pay flat $9.99 shipping — no matter how many samples you order.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[12px] font-bold">!</div>
                                    <p><strong className="text-gray-900">Maximum 5 samples per order.</strong> Mix and match any tiles from our range.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[12px] font-bold">$</div>
                                    <p>Order 1 sample or all 5 — shipping is always <strong className="text-gray-900">$9.99 flat</strong>.</p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button type="button" onClick={() => setShowSampleModal(false)} className="flex-1 rounded-lg border-2 border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide hover:bg-gray-50 transition">
                                    Not now
                                </button>
                                <button type="button" onClick={confirmSampleFromModal} className="flex-1 rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white uppercase tracking-wide hover:bg-brand-dark transition">
                                    Add my sample
                                </button>
                            </div>
                            <p className="mt-3 text-center text-[11px] text-gray-400">You can add up to 5 samples total to your order.</p>
                        </div>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
