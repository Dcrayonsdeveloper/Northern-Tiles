import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link } from '@inertiajs/react';
import ProductImage from '@/Components/Catalog/ProductImage';

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
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-contain transition-transform duration-500"
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
    // A collection without a picture should not get a picture-sized banner.
    const hasBanner = Boolean(collection.image_url);

    return (
        <PublicLayout>
            <Head title={collection.meta_title || collection.title} />

            {/* Collection banner.
                Most of these collections are filter dimensions — Beige, Matt,
                Bathroom — and carry no photograph. The banner was a fixed
                420px of near-black whether there was an image or not, so those
                pages opened on a wall of nothing. With no image it is now a
                short, light header; with one it keeps the full photo treatment. */}
            <section
                className={`relative flex items-center overflow-hidden ${
                    hasBanner
                        ? 'min-h-[360px] bg-gray-900 md:min-h-[420px]'
                        : 'border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white'
                }`}
                style={
                    hasBanner
                        ? { backgroundImage: `url(${collection.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : undefined
                }
            >
                {hasBanner && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />}

                <Container className={`relative z-10 text-center ${hasBanner ? 'py-16' : 'py-10'}`}>
                    <nav className={`mb-5 flex items-center justify-center gap-2 text-xs ${hasBanner ? 'text-white/80' : 'text-gray-500'}`}>
                        <Link href={route('home')} className={hasBanner ? 'hover:text-white' : 'hover:text-brand'}>Home</Link>
                        <span>/</span>
                        <Link href={route('collections.index')} className={hasBanner ? 'hover:text-white' : 'hover:text-brand'}>Collections</Link>
                        <span>/</span>
                        <span className={hasBanner ? 'text-white' : 'text-gray-900'}>{collection.title}</span>
                    </nav>

                    <p className={`text-[11px] font-semibold uppercase tracking-[3px] ${hasBanner ? 'text-white/80' : 'text-brand'}`}>
                        Collection
                    </p>
                    <h1 className={`mt-2 font-light uppercase tracking-[2px] ${
                        hasBanner ? 'text-3xl text-white md:text-5xl' : 'text-2xl text-gray-900 md:text-4xl'
                    }`}>
                        {collection.title}
                    </h1>
                    <div className="mx-auto mt-4 h-[2px] w-12 bg-brand" />

                    {collection.description && (
                        <p className={`mx-auto mt-4 max-w-2xl text-sm md:text-base ${hasBanner ? 'text-white/85' : 'text-gray-600'}`}>
                            {collection.description}
                        </p>
                    )}

                    {products?.total ? (
                        <p className={`mt-3 text-xs ${hasBanner ? 'text-white/70' : 'text-gray-500'}`}>
                            {products.total} product{products.total === 1 ? '' : 's'}
                        </p>
                    ) : null}

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
