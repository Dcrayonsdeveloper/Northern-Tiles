import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function ProductCard({ product }) {
    return (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="aspect-[4/3] w-full bg-gray-100">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : null}
            </div>
            <div className="p-4">
                <div className="text-sm font-semibold text-gray-900">
                    {product.name}
                </div>
                {product.short_description ? (
                    <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {product.short_description}
                    </div>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">
                        ₹{product.price}
                    </div>
                    <Link
                        href={route('products.show', product.slug)}
                        className="rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                    >
                        View
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function Index({ products, categories, filters }) {
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
            <Head title="Shop" />

            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
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
                <div className="rounded-lg border bg-white p-4 shadow-sm">
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

                <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(products?.data ?? []).map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>

                    {products?.links ? (
                        <div className="mt-6 flex flex-wrap gap-2">
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
                </div>
            </div>
        </PublicLayout>
    );
}
