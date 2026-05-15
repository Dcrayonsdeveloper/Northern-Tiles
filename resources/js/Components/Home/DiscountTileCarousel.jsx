import { Link, usePage } from '@inertiajs/react';
import { useRef, useState, useCallback, useEffect } from 'react';
import Container from '@/Components/Container';
import ProductImage from '@/Components/Catalog/ProductImage';

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

// Dictionary helper
function useDict() {
    const { dictionary } = usePage().props;
    return useCallback((key, fallback = '') => {
        return dictionary?.items?.[key] ?? fallback ?? key;
    }, [dictionary]);
}

// Format price in INR
function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price);
}

// Calculate discount percentage
function getDiscountPercent(price, compareAtPrice) {
    if (!compareAtPrice || compareAtPrice <= price) return 0;
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

// Discount Product Card
function DiscountCard({ product }) {
    const discountPercent = getDiscountPercent(product.price, product.compare_at_price);

    return (
        <Link
            href={route('products.show', product.slug)}
            className="discount-card group flex-shrink-0 w-52 sm:w-56"
        >
            <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <ProductImage
                    src={product.image_url}
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
                        {formatPrice(product.price)}
                    </span>
                    {product.compare_at_price > product.price && (
                        <span className="text-xs text-gray-500 line-through">
                            {formatPrice(product.compare_at_price)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function DiscountTileCarousel({ data }) {
    const d = useDict();
    const scrollRef = useRef(null);
    const sectionRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    const products = data?.products || [];
    const titleKey = data?.title_key || 'home.discounts.title';
    const title = d(titleKey, 'Hot Deals');

    // Lazy load
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const checkScrollPosition = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    const scroll = useCallback((direction) => {
        if (!scrollRef.current) return;
        const scrollAmount = direction === 'left' ? -280 : 280;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setTimeout(checkScrollPosition, 350);
    }, [checkScrollPosition]);

    if (!products.length) {
        return null;
    }

    return (
        <section ref={sectionRef} className="discount-tile-carousel py-8">
            <Container>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('shop.index', { on_sale: true })}
                            className="mr-2 text-sm font-medium text-brand hover:text-brand/80"
                        >
                            {d('home.view_all', 'View all')}
                        </Link>
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

                {isVisible && (
                    <div
                        ref={scrollRef}
                        onScroll={checkScrollPosition}
                        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {products.map((product) => (
                            <DiscountCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </Container>
        </section>
    );
}
