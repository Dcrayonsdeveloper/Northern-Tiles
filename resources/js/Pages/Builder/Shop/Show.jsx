import BuilderLayout from '@/Layouts/BuilderLayout';
import Container from '@/Components/Container';
import ProductImage from '@/Components/Catalog/ProductImage';
import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const money = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

export default function BuilderProductShow({ product, relatedProducts = [] }) {
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [buying, setBuying] = useState(false);
    const [activeImage, setActiveImage] = useState(0);

    const retail = parseFloat(product.retail_price ?? 0);
    const trade = parseFloat(product.price ?? 0);
    const savingPct = retail > trade ? Math.round(((retail - trade) / retail) * 100) : 0;

    // Only tiles and flooring are priced by the square metre. TradeUnitResolver
    // decides on the server; anything else drops the unit rather than swapping
    // in different wording. `perUnit` is the " / sqm" suffix, or '' when absent.
    const perSqm = product.is_sold_per_sqm === true;
    const unitLabel = product.unit_label ?? 'sqm';
    const perUnit = perSqm ? ` / ${unitLabel}` : '';

    const images = useMemo(() => {
        const fromMedia = (product.media ?? [])
            .filter((m) => m.type === 'image')
            .map((m) => m.url);
        return fromMedia.length ? fromMedia : [product.image_url].filter(Boolean);
    }, [product]);

    const lineTotal = trade * (parseFloat(quantity) || 0);

    const post = (onDone, after) => {
        router.post(
            route('cart.store'),
            { product_id: product.id, quantity: parseFloat(quantity) || 1 },
            {
                preserveScroll: true,
                onSuccess: () => {
                    window.dispatchEvent(new CustomEvent('cart-updated'));
                    after?.();
                },
                onFinish: onDone,
            }
        );
    };

    const addToCart = () => {
        setAdding(true);
        post(() => setAdding(false), () => window.dispatchEvent(new CustomEvent('open-cart-sidebar')));
    };

    const buyNow = () => {
        setBuying(true);
        post(() => setBuying(false), () => router.visit('/checkout'));
    };

    const specs = product.specifications && typeof product.specifications === 'object'
        ? Object.entries(product.specifications)
        : [];

    return (
        <BuilderLayout title={product.name}>
            <Container className="py-8">
                {/* ── Breadcrumb ── */}
                <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                    <Link href={route('builder.dashboard')} className="hover:text-slate-900">Trade Portal</Link>
                    <span>/</span>
                    <Link href={route('builder.shop.index')} className="hover:text-slate-900">Catalogue</Link>
                    {product.category ? (
                        <>
                            <span>/</span>
                            <Link
                                href={`/builder/shop?category=${product.category.slug}`}
                                className="hover:text-slate-900"
                            >
                                {product.category.name}
                            </Link>
                        </>
                    ) : null}
                </nav>

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                    {/* ── Gallery ── */}
                    <div>
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                            <ProductImage
                                src={images[activeImage] ?? product.image_url}
                                alt={product.name}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            {savingPct > 0 && (
                                <div className="absolute left-3 top-3 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-900">
                                    TRADE −{savingPct}%
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto">
                                {images.map((src, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setActiveImage(i)}
                                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition ${
                                            i === activeImage ? 'border-slate-900' : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                    >
                                        <ProductImage src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Buy box ── */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                        {product.sku ? (
                            <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">SKU {product.sku}</div>
                        ) : null}

                        {product.short_description ? (
                            <p className="mt-3 text-sm leading-relaxed text-gray-600">{product.short_description}</p>
                        ) : null}

                        {/* ── Pricing ── */}
                        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                                Your trade price
                            </div>
                            <div className="mt-1 flex items-baseline gap-3">
                                <span className="text-3xl font-bold text-slate-900">{money(trade)}</span>
                                {perUnit ? <span className="text-sm text-gray-500">/ {unitLabel}</span> : null}
                            </div>
                            {retail > trade ? (
                                <div className="mt-1.5 text-sm text-gray-600">
                                    Retail <span className="line-through">{money(retail)}</span>
                                    <span className="ml-2 font-semibold text-green-700">
                                        You save {money(retail - trade)}{perUnit} ({savingPct}%)
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        {/* ── Quantity + actions ── */}
                        <div className="mt-6">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                {perSqm ? 'Quantity (sqm)' : 'Quantity'}
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    // Area is ordered in decimals; everything else
                                    // ships in whole units, so do not offer 0.01
                                    // of a bag of grout.
                                    min={perSqm ? '0.01' : '1'}
                                    step={perSqm ? '0.01' : '1'}
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-32 rounded border-gray-300 text-sm focus:border-slate-900 focus:ring-slate-900"
                                />
                                <div className="text-sm text-gray-600">
                                    Line total <span className="font-bold text-slate-900">{money(lineTotal)}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={addToCart}
                                    disabled={adding || buying}
                                    className="flex-1 rounded bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                                >
                                    {adding ? 'Adding…' : 'Add to Cart'}
                                </button>
                                <button
                                    type="button"
                                    onClick={buyNow}
                                    disabled={adding || buying}
                                    className="flex-1 rounded border-2 border-slate-900 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white disabled:opacity-60"
                                >
                                    {buying ? 'Please wait…' : 'Buy Now'}
                                </button>
                            </div>
                        </div>

                        {/* ── Specifications ── */}
                        {specs.length > 0 && (
                            <div className="mt-8">
                                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-900">
                                    Specifications
                                </h2>
                                <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                                    {specs.map(([key, value]) => (
                                        <div key={key} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                                            <dt className="capitalize text-gray-500">{key.replace(/_/g, ' ')}</dt>
                                            <dd className="text-right font-medium text-gray-900">{String(value)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Description ── */}
                {product.description ? (
                    <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-3 text-lg font-bold text-slate-900">Product Details</h2>
                        <div
                            className="prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    </div>
                ) : null}

                {/* ── Related ── */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12">
                        <h2 className="mb-4 text-lg font-bold text-slate-900">More from the trade catalogue</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {relatedProducts.map((p) => {
                                const pRetail = parseFloat(p.retail_price ?? 0);
                                const pTrade = parseFloat(p.price ?? 0);
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
                                                <span className="text-sm font-bold text-slate-900">{money(pTrade)}</span>
                                                {pRetail > pTrade ? (
                                                    <span className="text-[11px] text-gray-400 line-through">{money(pRetail)}</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Container>
        </BuilderLayout>
    );
}
