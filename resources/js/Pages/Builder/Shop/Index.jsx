import BuilderLayout from '@/Layouts/BuilderLayout';
import Container from '@/Components/Container';
import ProductImage from '@/Components/Catalog/ProductImage';
import { Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';

const money = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

// Chevron icon for collapsible panel
function ChevronIcon({ open, className = '' }) {
    return (
        <svg
            className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''} ${className}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

/**
 * Trade product card. Leads with the builder price and shows the retail price
 * struck through beside it — the saving is the whole point of the portal, so
 * it is never something the builder has to work out.
 */
function TradeProductCard({ product }) {
    const [adding, setAdding] = useState(false);

    const retail = parseFloat(product.retail_price ?? product.compare_at_price ?? 0);
    const trade = parseFloat(product.price ?? 0);
    const saving = retail > trade ? Math.round(((retail - trade) / retail) * 100) : 0;

    // Tiles and flooring only — see TradeUnitResolver. '' for everything else,
    // so a bag of grout no longer advertises itself as priced per square metre.
    const perUnit = product.is_sold_per_sqm === true ? ` / ${product.unit_label ?? 'sqm'}` : '';

    // Add to the TRADE cart. Pointing at the retail cart.store here would
    // dump trade-catalogue items into the retail cart at retail prices —
    // exactly the bug the split is meant to prevent.
    const addToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setAdding(true);
        router.post(
            route('builder.cart.store'),
            { product_id: product.id, quantity: 1 },
            {
                preserveScroll: true,
                onSuccess: () => {
                    window.dispatchEvent(new CustomEvent('cart-updated:trade'));
                    window.dispatchEvent(new CustomEvent('open-cart-sidebar'));
                },
                onFinish: () => setAdding(false),
            }
        );
    };

    return (
        <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <Link href={route('builder.products.show', product.slug)} className="block">
                <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                    <ProductImage
                        src={product.image_url}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-contain transition-transform duration-500"
                    />
                    {saving > 0 && (
                        <div className="absolute left-2 top-2 rounded-md bg-amber-500 px-2 py-1 text-[11px] font-bold text-slate-900">
                            TRADE −{saving}%
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-4">
                <Link href={route('builder.products.show', product.slug)} className="block">
                    <div className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-brand">
                        {product.name}
                    </div>
                    {product.sku ? (
                        <div className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">{product.sku}</div>
                    ) : null}
                </Link>

                <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-slate-900">{money(trade)}</span>
                    {perUnit ? <span className="text-[11px] text-gray-400">{perUnit.trim()}</span> : null}
                    {retail > trade ? (
                        <span className="text-xs text-gray-400 line-through">{money(retail)}</span>
                    ) : null}
                </div>
                {retail > trade ? (
                    <div className="mt-0.5 text-[11px] font-semibold text-green-700">
                        You save {money(retail - trade)}{perUnit}
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={addToCart}
                    disabled={adding}
                    className="mt-4 w-full rounded bg-slate-900 px-3 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                    {adding ? 'Adding…' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
}

export default function BuilderShopIndex({ products, categories, filters, currentCategory, pageTitle }) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [q, setQ] = useState(filters?.q ?? '');
    const [category, setCategory] = useState(filters?.category ?? '');

    const applyFilter = useCallback((patch) => {
        router.get(route('builder.shop.index'), { ...filters, ...patch }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [filters]);

    const apply = useCallback(() => {
        applyFilter({ q, category });
    }, [applyFilter, q, category]);

    const reset = useCallback(() => {
        setQ('');
        setCategory('');
        router.get(route('builder.shop.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    const handleCategoryChange = useCallback((slug) => {
        setCategory(slug);
        applyFilter({ q, category: slug });
    }, [applyFilter, q]);

    const items = products?.data ?? [];

    return (
        <BuilderLayout categories={categories} title={pageTitle}>
            <Container className="py-8">
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{pageTitle ?? 'Trade Catalogue'}</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            {products?.total ?? 0} product{(products?.total ?? 0) === 1 ? '' : 's'} available to your account at trade pricing.
                        </p>
                    </div>
                    <Link
                        href={route('builder.cart.index')}
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        View Cart
                    </Link>
                </div>

                {/* Collapsible Filters Panel */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        className="flex w-full items-center justify-between p-4 text-left"
                    >
                        <span className="text-sm font-semibold text-brand">Filters</span>
                        <ChevronIcon open={filtersOpen} className="text-gray-500" />
                    </button>

                    {filtersOpen && (
                        <div className="border-t border-gray-200 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Search
                                    </label>
                                    <input
                                        type="text"
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && apply()}
                                        placeholder="Product name, category, keyword..."
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm placeholder:text-gray-400 focus:border-slate-900 focus:ring-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-slate-900 focus:ring-slate-900"
                                    >
                                        <option value="">All</option>
                                        {(categories ?? []).map((cat) => (
                                            <optgroup key={cat.id} label={cat.name}>
                                                {(cat.children ?? []).length > 0 ? (
                                                    cat.children.map((child) => (
                                                        <option key={child.id} value={child.slug}>
                                                            {child.name}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value={cat.slug}>{cat.name}</option>
                                                )}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={apply}
                                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                                >
                                    Apply
                                </button>
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-brand hover:bg-gray-50"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results header */}
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        Showing {items.length} of {products?.total ?? 0}
                    </div>
                    <select
                        value={filters?.sort ?? ''}
                        onChange={(e) => applyFilter({ sort: e.target.value })}
                        className="rounded border-gray-300 text-sm focus:border-slate-900 focus:ring-slate-900"
                    >
                        <option value="">Sort: Default</option>
                        <option value="price_asc">Trade price: low to high</option>
                        <option value="price_desc">Trade price: high to low</option>
                        <option value="name_asc">Name: A–Z</option>
                        <option value="name_desc">Name: Z–A</option>
                        <option value="newest">Newest first</option>
                    </select>
                </div>

                {/* Products Grid */}
                {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
                        <p className="text-sm font-medium text-gray-900">No products match your filters.</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Try clearing the search, or contact us to have more lines added to your trade catalogue.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {items.map((product) => (
                            <TradeProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {(products?.links ?? []).length > 3 && (
                    <div className="mt-8 flex flex-wrap justify-center gap-1">
                        {products.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={`rounded px-3 py-1.5 text-sm transition ${
                                    link.active
                                        ? 'bg-slate-900 font-semibold text-white'
                                        : link.url
                                            ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                            : 'cursor-not-allowed border border-gray-200 bg-white text-gray-300'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </Container>
        </BuilderLayout>
    );
}
