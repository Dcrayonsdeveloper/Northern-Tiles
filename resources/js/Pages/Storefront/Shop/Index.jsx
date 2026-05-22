import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import ProductImage from '@/Components/Catalog/ProductImage';

function ProductCard({ product }) {
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    return (
        <Link
            href={route('products.show', product.slug)}
            className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500"
                    style={{ transform: 'scale(2.8)', transformOrigin: 'center' }}
                />
                {discountPercent > 0 && (
                    <div className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        -{discountPercent}%
                    </div>
                )}
            </div>
            <div className="p-4">
                <div className="text-sm font-semibold text-gray-900 group-hover:text-brand line-clamp-2">
                    {product.name}
                </div>
                {product.short_description ? (
                    <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                        {product.short_description}
                    </div>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                        ${parseFloat(product.price || 0).toFixed(2)}
                    </span>
                    <span className="text-[11px] text-gray-400">/ sqm</span>
                    {hasDiscount && (
                        <span className="text-xs text-gray-500 line-through">
                            ${parseFloat(product.compare_at_price || 0).toFixed(2)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

// Search autocomplete input — self-contained, does not trigger page nav on its own
function SearchInput({ value, onChange, onSelect, onSubmit, categories }) {
    const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const [fetching, setFetching] = useState(false);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    const allItems = useMemo(() => [
        ...suggestions.categories.map(c => ({ _type: 'category', ...c })),
        ...suggestions.products.map(p => ({ _type: 'product', ...p })),
    ], [suggestions]);

    const fetchSuggestions = useCallback((q) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!q || q.length < 2) {
            setSuggestions({ products: [], categories: [] });
            setOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            if (abortRef.current) abortRef.current.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;

            setFetching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
                    signal: ctrl.signal,
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });
                if (res.ok) {
                    const data = await res.json();
                    const prods = data.products || [];
                    const cats = data.categories || [];
                    setSuggestions({ products: prods, categories: cats });
                    setOpen(prods.length > 0 || cats.length > 0);
                    setActiveIdx(-1);

                    // Auto-detect category: if query exactly matches one product name,
                    // pre-select its category in the dropdown filter (without navigating)
                    if (prods.length === 1 && prods[0].category) {
                        const exactMatch = prods[0].name.toLowerCase() === q.toLowerCase();
                        if (exactMatch) {
                            onSelect('_autocat', prods[0].category.slug);
                        }
                    }
                }
            } catch (e) {
                if (e.name !== 'AbortError') console.error(e);
            } finally {
                setFetching(false);
            }
        }, 200);
    }, [onSelect]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    const handleChange = (e) => {
        const v = e.target.value;
        onChange(v);
        fetchSuggestions(v);
    };

    const handleSelect = (item) => {
        setOpen(false);
        setSuggestions({ products: [], categories: [] });
        setActiveIdx(-1);
        onSelect(item._type, item);
    };

    const handleKeyDown = (e) => {
        if (!open) {
            if (e.key === 'Enter') onSubmit();
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIdx(i => Math.min(i + 1, allItems.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIdx(i => Math.max(i - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIdx >= 0 && allItems[activeIdx]) {
                    handleSelect(allItems[activeIdx]);
                } else {
                    setOpen(false);
                    onSubmit();
                }
                break;
            case 'Escape':
                setOpen(false);
                setActiveIdx(-1);
                break;
        }
    };

    const clearInput = () => {
        onChange('');
        setSuggestions({ products: [], categories: [] });
        setOpen(false);
    };

    const hasSuggestions = suggestions.categories.length > 0 || suggestions.products.length > 0;

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (hasSuggestions) setOpen(true); }}
                    className="w-full rounded-md border-gray-200 pr-7 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                    placeholder="Product name, category, keyword..."
                    autoComplete="off"
                />
                {/* Spinner / clear button */}
                <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    {fetching ? (
                        <svg className="h-3.5 w-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : value ? (
                        <button
                            type="button"
                            onClick={clearInput}
                            className="pointer-events-auto text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                            aria-label="Clear search"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    ) : null}
                </span>
            </div>

            {/* Autocomplete dropdown */}
            {open && hasSuggestions && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                    {/* Categories section */}
                    {suggestions.categories.length > 0 && (
                        <div>
                            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100">
                                Categories
                            </div>
                            {suggestions.categories.map((cat, i) => {
                                const idx = i;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); handleSelect({ _type: 'category', ...cat }); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${activeIdx === idx ? 'bg-gray-50' : ''}`}
                                    >
                                        <svg className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                        <span className="font-medium text-gray-800">{cat.name}</span>
                                        <span className="ml-auto text-[10px] text-gray-400">Browse →</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Products section */}
                    {suggestions.products.length > 0 && (
                        <div>
                            {suggestions.categories.length > 0 && (
                                <div className="border-t border-gray-100" />
                            )}
                            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100">
                                Products
                            </div>
                            {suggestions.products.map((prod, i) => {
                                const idx = suggestions.categories.length + i;
                                return (
                                    <button
                                        key={prod.id}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); handleSelect({ _type: 'product', ...prod }); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${activeIdx === idx ? 'bg-gray-50' : ''}`}
                                    >
                                        <div className="h-9 w-9 flex-shrink-0 rounded overflow-hidden bg-gray-100 border border-gray-200">
                                            <img
                                                src={prod.image_url || '/images/placeholder-product.svg'}
                                                alt={prod.name}
                                                className="h-full w-full object-cover"
                                                onError={(e) => { e.target.src = '/images/placeholder-product.svg'; }}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium text-gray-900 truncate">{prod.name}</div>
                                            {prod.category && (
                                                <div className="text-[10px] text-gray-400 truncate">{prod.category.name}</div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 text-xs font-semibold text-gray-700">
                                            ${parseFloat(prod.price || 0).toFixed(2)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* "Search all results" footer */}
                    <div className="border-t border-gray-100">
                        <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); setOpen(false); onSubmit(); }}
                            className="w-full px-3 py-2 text-left text-xs text-brand hover:bg-gray-50 font-medium"
                        >
                            Search all results for &ldquo;{value}&rdquo; →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Index({ products, categories, filters, currentCategory, parentCategory, pageTitle }) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [category, setCategory] = useState(filters?.category ?? '');

    // Collect any extra active filter params (sort, on_sale, attribute filters) from the
    // server-side filters prop so Apply/Reset preserve or clear them correctly.
    const extraFilters = useMemo(() => {
        const extra = {};
        const known = ['q', 'category'];
        Object.entries(filters ?? {}).forEach(([k, v]) => {
            if (!known.includes(k) && v !== '' && v !== false && v !== null) {
                extra[k] = v;
            }
        });
        return extra;
    }, [filters]);

    const buildParams = useCallback((overrideQ, overrideCat) => {
        const params = {
            ...extraFilters,
            q: overrideQ ?? q,
            category: overrideCat ?? category,
        };
        // Strip empty/false values so URLs stay clean
        Object.keys(params).forEach(k => {
            if (params[k] === '' || params[k] === false || params[k] === null || params[k] === undefined) {
                delete params[k];
            }
        });
        return params;
    }, [q, category, extraFilters]);

    const apply = useCallback((overrideQ, overrideCat) => {
        router.get(route('shop.index'), buildParams(overrideQ, overrideCat), {
            preserveScroll: true,
            preserveState: true,
        });
    }, [buildParams]);

    const reset = useCallback(() => {
        setQ('');
        setCategory('');
        router.get(route('shop.index'));
    }, []);

    // Handle selection from autocomplete dropdown
    const handleSuggestionSelect = useCallback((type, item) => {
        if (type === '_autocat') {
            // Auto-detected category from exact product name match — just pre-fill, don't navigate
            setCategory(item);
            return;
        }
        if (type === 'category') {
            // Category selected — apply with that category
            setQ('');
            setCategory(item.slug);
            router.get(route('shop.index'), { category: item.slug }, {
                preserveScroll: true,
                preserveState: true,
            });
        } else {
            // Product selected — navigate to product page
            router.visit(item.url);
        }
    }, []);

    // Category dropdown change → instant apply
    const handleCategoryChange = (slug) => {
        setCategory(slug);
        router.get(route('shop.index'), buildParams(undefined, slug), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <PublicLayout>
            <Head title={pageTitle || 'Shop'} />

            {/* Breadcrumb */}
            <section className="py-4 border-b border-gray-100">
                <Container>
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href={route('home')} className="hover:text-gray-900">
                            Home
                        </Link>
                        <span>/</span>
                        <Link href={route('shop.index')} className="hover:text-gray-900">
                            Shop
                        </Link>
                        {parentCategory && (
                            <>
                                <span>/</span>
                                <Link
                                    href={route('shop.category', parentCategory.slug)}
                                    className="hover:text-gray-900"
                                >
                                    {parentCategory.name}
                                </Link>
                            </>
                        )}
                        {currentCategory && (
                            <>
                                <span>/</span>
                                <span className="text-gray-900">{currentCategory.name}</span>
                            </>
                        )}
                    </nav>
                </Container>
            </section>

            {/* Main Content */}
            <section className="py-8">
                <Container>
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {currentCategory ? currentCategory.name : 'Shop'}
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Browse products and add them to your cart.
                            </p>
                        </div>
                        <Link
                            href={route('cart.index')}
                            className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            View Cart
                        </Link>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
                        {/* Filters Sidebar */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm h-fit">
                            <div className="text-sm font-semibold text-gray-900">
                                Filters
                            </div>

                            <div className="mt-4">
                                <label className="text-xs font-medium text-gray-600">
                                    Search
                                </label>
                                <div className="mt-1">
                                    <SearchInput
                                        value={q}
                                        onChange={setQ}
                                        onSelect={handleSuggestionSelect}
                                        onSubmit={() => apply()}
                                        categories={categories}
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-xs font-medium text-gray-600">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                >
                                    <option value="">All</option>
                                    {(categories ?? []).map((c) => (
                                        <option key={c.id} value={c.slug}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => apply()}
                                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                >
                                    Apply
                                </button>
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="lg:col-span-3">
                            {(products?.data ?? []).length > 0 ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {(products?.data ?? []).map((p) => (
                                            <ProductCard key={p.id} product={p} />
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {products?.links && products?.last_page > 1 ? (
                                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                                            {products.links.map((l, idx) => (
                                                l.url ? (
                                                    <Link
                                                        key={idx}
                                                        href={l.url}
                                                        preserveScroll
                                                        className={
                                                            'rounded-md px-3 py-2 text-sm ' +
                                                            (l.active
                                                                ? 'bg-gray-900 text-white'
                                                                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50')
                                                        }
                                                    >
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: DOMPurify.sanitize(l.label),
                                                            }}
                                                        />
                                                    </Link>
                                                ) : (
                                                    <span
                                                        key={idx}
                                                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400"
                                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(l.label) }}
                                                    />
                                                )
                                            ))}
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                                    <p className="text-gray-600">No products found.</p>
                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="mt-4 inline-block text-sm font-medium text-brand hover:text-brand/80"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
