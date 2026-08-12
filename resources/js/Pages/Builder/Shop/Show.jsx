import BuilderLayout from '@/Layouts/BuilderLayout';
import Container from '@/Components/Container';
import ProductImage from '@/Components/Catalog/ProductImage';
import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { colourHex } from '@/Support/colours';

const money = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

/* ── Range selector ───────────────────────────────────────────────────
   Siblings in the same range. The server has already dropped any that are
   not on the trade list and re-priced the rest, so every card here is a
   real, buyable trade product. Each is a link to its own page. */
function TradeRangeSelector({ familyVariants, perUnit }) {
    const variants = familyVariants?.variants ?? [];
    if (variants.length < 2) return null;

    const familyName = familyVariants?.family?.name;
    const currentIndex = variants.findIndex((v) => v.is_current);

    return (
        <div className="mt-6">
            <p className="text-[13px] font-semibold text-slate-900">
                {familyName ? `${familyName} range` : 'Available variants'}
                <span className="ml-1.5 font-normal text-gray-500">
                    ({variants.length} options{currentIndex >= 0 ? ` · viewing ${currentIndex + 1}` : ''})
                </span>
            </p>

            <div className="mt-2 flex gap-2.5 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
                {variants.map((v) => {
                    const card = (
                        <>
                            <div className="mb-1.5 aspect-square w-full overflow-hidden rounded-md bg-gray-50">
                                {v.image_url && (
                                    <img src={v.image_url} alt={v.label} loading="lazy" className="h-full w-full object-cover" />
                                )}
                            </div>
                            <span className="line-clamp-2 min-h-[2rem] text-[11px] font-medium leading-tight text-gray-800">
                                {v.label}
                            </span>
                            <span className="mt-0.5 text-[13px] font-bold text-slate-900">
                                {money(v.price)}
                                {perUnit ? <span className="font-normal text-gray-400">{perUnit}</span> : null}
                            </span>
                            {v.compare_at_price > v.price && (
                                <span className="text-[11px] text-gray-400 line-through">{money(v.compare_at_price)}</span>
                            )}
                            {!v.in_stock && <span className="text-[11px] font-medium text-red-600">Out of stock</span>}
                        </>
                    );

                    const classes =
                        'flex w-24 flex-shrink-0 flex-col rounded-lg border bg-white p-2 transition-colors sm:w-28 ' +
                        (v.is_current ? 'border-amber-500 ring-2 ring-amber-500/25' : 'border-gray-200 hover:border-gray-400') +
                        (v.in_stock ? '' : ' opacity-60');

                    return v.is_current ? (
                        <div key={v.id} aria-current="true" className={classes}>{card}</div>
                    ) : (
                        <Link key={v.id} href={route('builder.products.show', v.slug)} className={classes}>{card}</Link>
                    );
                })}
            </div>
        </div>
    );
}

export default function BuilderProductShow({ product, relatedProducts = [], familyVariants = null }) {
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
        // image_url first, then media — mirrors the retail Show page. Some
        // older products have dead product_media rows pointing at storage
        // paths that were never synced; keeping image_url in the list means
        // ProductImage's onError fallback has something valid to fall back to
        // when a media path 404s, instead of just showing "No Image".
        const list = [];
        if (product.image_url) list.push(product.image_url);
        (product.media ?? [])
            .filter((m) => m.type === 'image')
            .map((m) => m.url)
            .filter(Boolean)
            .forEach((u) => { if (!list.includes(u)) list.push(u); });
        return list.length ? list : [null];
    }, [product]);

    const lineTotal = trade * (parseFloat(quantity) || 0);

    // Selectable colour + finish parsed from the spec strings, exactly as the
    // retail page does it: "Black, Charcoal, Carbon" -> 3 colours;
    // "Matt / Soft Touch" -> 2 finishes.
    const colourOptions = String(product.specifications?.colour || product.specifications?.color || '')
        .split(',').map((s) => s.trim()).filter(Boolean);
    const finishOptions = String(product.specifications?.finish || '')
        .split(/[/,]/).map((s) => s.trim()).filter(Boolean);
    const [selectedColour, setSelectedColour] = useState(colourOptions[0] ?? null);
    const [selectedFinish, setSelectedFinish] = useState(finishOptions[0] ?? null);

    // Travels with every add-to-cart so the choice reaches the cart, checkout
    // and the order — the same options payload the retail site sends.
    const cartOptions = () => {
        const o = {};
        if (selectedColour) o.colour = selectedColour;
        if (selectedFinish) o.finish = selectedFinish;
        return o;
    };

    // POSTs go to the TRADE cart, not the retail cart — same reason as the
    // add-to-cart on the listing page. Namespaced cart-updated event so
    // only the trade header badge (BuilderHeader) refreshes; the retail
    // header ignores it.
    const post = (onDone, after) => {
        router.post(
            route('builder.cart.store'),
            { product_id: product.id, quantity: parseFloat(quantity) || 1, options: cartOptions() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    window.dispatchEvent(new CustomEvent('cart-updated:trade'));
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
        post(() => setBuying(false), () => router.visit('/builder/checkout'));
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

                        {/* ── Colour & Finish ── */}
                        {(colourOptions.length > 0 || finishOptions.length > 0) && (
                            <div className="mt-6 space-y-4">
                                {colourOptions.length > 0 && (
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400">
                                            Colour
                                            {selectedColour && (
                                                <span className="ml-2 font-semibold normal-case tracking-normal text-gray-800">
                                                    {selectedColour}
                                                </span>
                                            )}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2.5">
                                            {colourOptions.map((c) => {
                                                const hex = colourHex(c);
                                                const isSel = c === selectedColour;
                                                return (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        title={c}
                                                        aria-pressed={isSel}
                                                        onClick={() => setSelectedColour(c)}
                                                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                                                            isSel
                                                                ? 'border-transparent ring-2 ring-amber-500 ring-offset-2'
                                                                : 'border-gray-300 hover:border-gray-500'
                                                        }`}
                                                        style={hex ? { backgroundColor: hex } : undefined}
                                                    >
                                                        {!hex && (
                                                            <span className="text-[10px] font-bold text-gray-500">
                                                                {c.slice(0, 2).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {finishOptions.length > 0 && (
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400">Finish</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {finishOptions.map((f) => {
                                                const isSel = f === selectedFinish;
                                                return (
                                                    <button
                                                        key={f}
                                                        type="button"
                                                        aria-pressed={isSel}
                                                        onClick={() => setSelectedFinish(f)}
                                                        className={`rounded-md border-2 px-4 py-1.5 text-[13px] font-bold uppercase tracking-wide transition ${
                                                            isSel
                                                                ? 'border-slate-900 bg-white text-slate-900'
                                                                : 'border-gray-200 text-gray-500 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        {f}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Range (same family, different colour / size) ── */}
                        <TradeRangeSelector familyVariants={familyVariants} perUnit={perUnit} />

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
