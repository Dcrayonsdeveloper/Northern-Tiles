import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRef, useState, useCallback } from 'react';
import { StarRating } from '@/Components/Catalog/StarRating';
import ProductReviews from '@/Components/Catalog/ProductReviews';

// Icons
function ChevronLeftIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function ChevronRightIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}

function MinusIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
    );
}

function PlusIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function TagIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    );
}

// Available Coupons Display
function AvailableCoupons({ coupons = [] }) {
    if (!coupons || coupons.length === 0) return null;

    return (
        <div className="mt-6 rounded-lg border border-dashed border-green-300 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-3">
                <TagIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Available Offers</span>
            </div>
            <div className="space-y-2">
                {coupons.map((coupon, index) => (
                    <div key={coupon.code || index} className="flex items-start gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <code className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                                    {coupon.code}
                                </code>
                                {coupon.type === 'free_shipping' && (
                                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                        Free Shipping
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-green-700">
                                {coupon.title || coupon.description || (
                                    coupon.type === 'percentage'
                                        ? `Get ${coupon.value}% off`
                                        : coupon.type === 'fixed_amount'
                                        ? `Get ₹${coupon.value} off`
                                        : coupon.type === 'free_shipping'
                                        ? 'Free shipping on your order'
                                        : `Save with code ${coupon.code}`
                                )}
                                {coupon.min_purchase_amount > 0 && (
                                    <span className="text-green-600"> (Min. ₹{coupon.min_purchase_amount?.toLocaleString()})</span>
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Related Product Card
function RelatedProductCard({ product }) {
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    return (
        <Link
            href={route('products.show', product.slug)}
            className="group flex-shrink-0 w-48 sm:w-52"
        >
            <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <img
                    src={product.image_url || '/images/placeholder-product.svg'}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {discountPercent > 0 && (
                    <div className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        -{discountPercent}%
                    </div>
                )}
            </div>
            <div className="mt-3">
                <p className="truncate text-sm font-medium text-gray-900 group-hover:text-brand">
                    {product.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
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

// Related Products Carousel
function RelatedProductsCarousel({ products }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollPosition = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    const scroll = useCallback((direction) => {
        if (!scrollRef.current) return;
        const scrollAmount = direction === 'left' ? -260 : 260;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setTimeout(checkScrollPosition, 350);
    }, [checkScrollPosition]);

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className="py-10 border-t border-gray-200">
            <Container>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-semibold text-gray-900">Related Products</h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className="rounded-full border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Scroll left"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className="rounded-full border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Scroll right"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={checkScrollPosition}
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {products.map((product) => (
                        <RelatedProductCard key={product.id} product={product} />
                    ))}
                </div>
            </Container>
        </section>
    );
}

export default function Show({ product, relatedProducts, availableCoupons = [] }) {
    const { settings } = usePage().props;
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);

    // Generate JSON-LD structured data for SEO
    const generateJsonLd = () => {
        const baseUrl = window.location.origin;
        const productUrl = `${baseUrl}${route('products.show', product.slug, false)}`;

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description || product.short_description || '',
            image: product.image_url ? [product.image_url] : [],
            sku: product.sku || `PROD-${product.id}`,
            mpn: product.sku || `PROD-${product.id}`,
            brand: {
                '@type': 'Brand',
                name: settings?.site_name || 'Jikra',
            },
            offers: {
                '@type': 'Offer',
                url: productUrl,
                priceCurrency: 'INR',
                price: product.price,
                priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                availability: product.stock_quantity > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                seller: {
                    '@type': 'Organization',
                    name: settings?.site_name || 'Jikra',
                },
            },
        };

        // Add aggregate rating if reviews exist
        if (product.review_count > 0 && product.average_rating > 0) {
            jsonLd.aggregateRating = {
                '@type': 'AggregateRating',
                ratingValue: product.average_rating,
                reviewCount: product.review_count,
                bestRating: 5,
                worstRating: 1,
            };
        }

        // Add category if available
        if (product.category) {
            jsonLd.category = product.category.name;
        }

        return jsonLd;
    };

    const addToCart = () => {
        setAddingToCart(true);
        router.post(route('cart.store'), {
            product_id: product.id,
            quantity: quantity,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                window.dispatchEvent(new CustomEvent('cart-updated'));
                window.dispatchEvent(new CustomEvent('open-cart-sidebar'));
            },
            onFinish: () => setAddingToCart(false),
        });
    };

    const buyNow = () => {
        setBuyingNow(true);
        router.post(route('cart.store'), {
            product_id: product.id,
            quantity: quantity,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                window.dispatchEvent(new CustomEvent('cart-updated'));
                router.visit('/checkout');
            },
            onFinish: () => setBuyingNow(false),
        });
    };

    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    return (
        <PublicLayout>
            <Head title={product.name}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJsonLd()) }}
                />
            </Head>

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
                        {product.category && (
                            <>
                                <span>/</span>
                                <Link
                                    href={route('shop.category', product.category.slug)}
                                    className="hover:text-gray-900"
                                >
                                    {product.category.name}
                                </Link>
                            </>
                        )}
                        <span>/</span>
                        <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
                    </nav>
                </Container>
            </section>

            {/* Product Details */}
            <section className="py-8">
                <Container>
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Product Image */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="relative aspect-square bg-gray-100">
                                <img
                                    src={product.image_url || '/images/placeholder-product.svg'}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                                {discountPercent > 0 && (
                                    <div className="absolute left-3 top-3 rounded-md bg-red-500 px-3 py-1 text-sm font-bold text-white">
                                        -{discountPercent}% OFF
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div>
                            {product.category && (
                                <Link
                                    href={route('shop.category', product.category.slug)}
                                    className="text-sm font-medium text-brand hover:text-brand/80"
                                >
                                    {product.category.name}
                                </Link>
                            )}

                            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                                {product.name}
                            </h1>

                            {/* Star Rating */}
                            {(product.review_count > 0 || product.average_rating > 0) && (
                                <div className="mt-2 flex items-center gap-2">
                                    <StarRating
                                        rating={product.average_rating || 0}
                                        size="sm"
                                        usePrimaryColor={true}
                                    />
                                    <a
                                        href="#reviews"
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        {product.review_count} {product.review_count === 1 ? 'review' : 'reviews'}
                                    </a>
                                </div>
                            )}

                            <div className="mt-4 flex items-baseline gap-3">
                                <span className="text-2xl font-bold text-gray-900">
                                    ₹{product.price?.toLocaleString()}
                                </span>
                                {hasDiscount && (
                                    <>
                                        <span className="text-lg text-gray-400 line-through">
                                            ₹{product.compare_at_price?.toLocaleString()}
                                        </span>
                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                            Save ₹{(product.compare_at_price - product.price)?.toLocaleString()}
                                        </span>
                                    </>
                                )}
                            </div>

                            {product.short_description && (
                                <p className="mt-4 text-gray-600 leading-relaxed">
                                    {product.short_description}
                                </p>
                            )}

                            {/* Add to Cart / Buy Now */}
                            <div className="mt-6">
                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Quantity Stepper */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 block mb-1">
                                            Quantity
                                        </label>
                                        <div className="flex items-center rounded-lg border border-gray-300 bg-white">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                disabled={quantity <= 1}
                                                className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                                                aria-label="Decrease quantity"
                                            >
                                                <MinusIcon className="h-4 w-4" />
                                            </button>
                                            <span className="min-w-[3rem] text-center text-sm font-semibold text-gray-900 px-2">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                                                disabled={quantity >= 99}
                                                className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-r-lg transition-colors"
                                                aria-label="Increase quantity"
                                            >
                                                <PlusIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addToCart}
                                        disabled={addingToCart || buyingNow}
                                        className="flex-1 rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 sm:flex-none"
                                    >
                                        {addingToCart ? 'Adding...' : 'Add to Cart'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={buyNow}
                                        disabled={addingToCart || buyingNow}
                                        className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {buyingNow ? 'Processing...' : 'Buy Now'}
                                    </button>
                                </div>
                            </div>

                            {/* Available Coupons */}
                            <AvailableCoupons coupons={availableCoupons} />

                            {/* Product Description */}
                            {product.description && (
                                <div className="mt-8 border-t border-gray-200 pt-6">
                                    <h2 className="text-sm font-semibold text-gray-900">
                                        Description
                                    </h2>
                                    <div className="mt-3 prose prose-sm max-w-none text-gray-600">
                                        <div className="whitespace-pre-line">
                                            {product.description}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Container>
            </section>

            {/* Related Products */}
            <RelatedProductsCarousel products={relatedProducts} />

            {/* Product Reviews Section */}
            <section id="reviews" className="py-10 border-t border-gray-200">
                <Container>
                    <ProductReviews productId={product.id} />
                </Container>
            </section>
        </PublicLayout>
    );
}
