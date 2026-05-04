import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link } from '@inertiajs/react';

function ProductCard({ product }) {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'AUD',
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
                    src={product.image_url || '/images/placeholder-product.svg'}
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

            {/* Collection Banner */}
            <section
                className="relative flex min-h-[360px] items-center overflow-hidden bg-gray-900 md:min-h-[420px]"
                style={
                    collection.image_url
                        ? { backgroundImage: `url(${collection.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : undefined
                }
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

                <Container className="relative z-10 py-16 text-center">
                    <nav className="mb-6 flex items-center justify-center gap-2 text-xs text-white/80">
                        <Link href={route('home')} className="hover:text-white">Home</Link>
                        <span>/</span>
                        <Link href={route('collections.index')} className="hover:text-white">Collections</Link>
                        <span>/</span>
                        <span className="text-white">{collection.title}</span>
                    </nav>

                    <p className="text-[11px] font-semibold uppercase tracking-[3px] text-white/80">Collection</p>
                    <h1 className="mt-3 text-3xl font-light uppercase tracking-[2px] text-white md:text-5xl">
                        {collection.title}
                    </h1>
                    <div className="mx-auto mt-4 h-[2px] w-12 bg-brand" />

                    {collection.description && (
                        <p className="mx-auto mt-5 max-w-2xl text-sm text-white/85 md:text-base">
                            {collection.description}
                        </p>
                    )}

                    {collection.brochure_url && (
                        <div className="mt-7">
                            <a
                                href={collection.brochure_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-xs font-semibold uppercase tracking-[2px] text-white shadow-md transition hover:bg-brand/90"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                </svg>
                                Download Brochure
                            </a>
                        </div>
                    )}
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
