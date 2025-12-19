import { Link, usePage } from '@inertiajs/react';
import { useRef, useState, useCallback } from 'react';

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

// Category Card
function CategoryCard({ category }) {
    const name = category.name;

    return (
        <Link
            href={route('shop.index', { category: category.slug })}
            className="category-card group flex-shrink-0 w-36 sm:w-40"
        >
            <div className="aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center transition-colors group-hover:from-brand/5 group-hover:to-brand/10">
                <span className="text-3xl font-bold text-gray-300 group-hover:text-brand/40 transition-colors">
                    {name.charAt(0).toUpperCase()}
                </span>
            </div>
            <p className="mt-2 truncate text-center text-sm font-medium text-gray-900 group-hover:text-brand">
                {name}
            </p>
        </Link>
    );
}

export default function CategoryCarousel({ data }) {
    const d = useDict();
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const categories = data?.categories || [];
    const titleKey = data?.title_key || 'home.categories.title';
    const title = d(titleKey, 'Shop by Category');

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

    if (!categories.length) {
        return null;
    }

    return (
        <section className="category-carousel py-8">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
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
                {categories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                ))}
            </div>
        </section>
    );
}
