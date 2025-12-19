import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link } from '@inertiajs/react';

function ProductCard({ product }) {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price);
    };

    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    return (
        <Link
            href={route('products.show', product.slug)}
            className="group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
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
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand line-clamp-2">
                    {product.name}
                </h3>
                {product.short_description && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                        {product.short_description}
                    </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(product.price)}
                    </span>
                    {hasDiscount && (
                        <span className="text-xs text-gray-500 line-through">
                            {formatPrice(product.compare_at_price)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function Show({ collection, products }) {
    return (
        <PublicLayout>
            <Head title={collection.meta_title || collection.title} />

            {/* Collection Header */}
            <section className="border-b border-gray-200 bg-gray-50 py-8">
                <Container>
                    <nav className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                        <Link href={route('home')} className="hover:text-gray-900">
                            Home
                        </Link>
                        <span>/</span>
                        <Link href={route('collections.index')} className="hover:text-gray-900">
                            Collections
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900">{collection.title}</span>
                    </nav>

                    <div className="flex flex-col gap-6 md:flex-row md:items-center">
                        {collection.image_url && (
                            <div className="w-full md:w-1/3">
                                <img
                                    src={collection.image_url}
                                    alt={collection.title}
                                    className="h-48 w-full rounded-xl object-cover"
                                />
                            </div>
                        )}
                        <div className={collection.image_url ? 'md:w-2/3' : 'w-full'}>
                            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                                {collection.title}
                            </h1>
                            {collection.description && (
                                <p className="mt-2 text-gray-600">
                                    {collection.description}
                                </p>
                            )}
                            <p className="mt-2 text-sm text-gray-500">
                                {products.total} {products.total === 1 ? 'product' : 'products'}
                            </p>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Products Grid */}
            <section className="py-8">
                <Container>
                    {products.data.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
                                {products.data.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {products.links && products.last_page > 1 && (
                                <div className="mt-8 flex flex-wrap justify-center gap-2">
                                    {products.links.map((link, idx) =>
                                        link.url ? (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                preserveScroll
                                                className={`rounded-md px-3 py-2 text-sm ${
                                                    link.active
                                                        ? 'bg-gray-900 text-white'
                                                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </Link>
                                        ) : (
                                            <span
                                                key={idx}
                                                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                            <p className="text-gray-600">No products in this collection yet.</p>
                            <Link
                                href={route('shop.index')}
                                className="mt-4 inline-block text-sm font-medium text-brand hover:text-brand/80"
                            >
                                Browse all products
                            </Link>
                        </div>
                    )}
                </Container>
            </section>
        </PublicLayout>
    );
}
