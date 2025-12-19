import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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
            <div className="relative aspect-square w-full bg-gray-100">
                <img
                    src={product.image_url || '/public/images/placeholder-product.svg'}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                        ₹{product.price?.toLocaleString()}
                    </span>
                    {hasDiscount && (
                        <span className="text-xs text-gray-500 line-through">
                            ₹{product.compare_at_price?.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function Index({ products, categories, filters, currentCategory, parentCategory, pageTitle }) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [category, setCategory] = useState(filters?.category ?? '');

    const data = useMemo(() => ({ q, category }), [q, category]);

    const apply = () => {
        router.get(route('shop.index'), data, {
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
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') apply();
                                    }}
                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                    placeholder="Product name..."
                                />
                            </div>

                            <div className="mt-4">
                                <label className="text-xs font-medium text-gray-600">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
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
                                    onClick={apply}
                                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                >
                                    Apply
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQ('');
                                        setCategory('');
                                        router.get(route('shop.index'));
                                    }}
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
                                                                __html: l.label,
                                                            }}
                                                        />
                                                    </Link>
                                                ) : (
                                                    <span
                                                        key={idx}
                                                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400"
                                                        dangerouslySetInnerHTML={{ __html: l.label }}
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
                                        onClick={() => {
                                            setQ('');
                                            setCategory('');
                                            router.get(route('shop.index'));
                                        }}
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
