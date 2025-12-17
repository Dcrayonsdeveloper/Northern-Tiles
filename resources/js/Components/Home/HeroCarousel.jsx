import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';

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

// Dictionary helper hook
function useDict() {
    const { dictionary } = usePage().props;
    return useCallback((key, fallback = '') => {
        return dictionary?.items?.[key] ?? fallback ?? key;
    }, [dictionary]);
}

// Individual Slide component
function Slide({ slide, isActive, isFirst, d }) {
    const overlayClass = slide.overlay_style === 'light'
        ? 'bg-gradient-to-r from-white/70 via-white/40 to-white/10'
        : 'bg-gradient-to-r from-black/65 via-black/35 to-black/15';

    const textColorClass = slide.overlay_style === 'light' ? 'text-gray-900' : 'text-white';
    const textSecondaryClass = slide.overlay_style === 'light' ? 'text-gray-700' : 'text-white/90';

    const alignClass = slide.align === 'center'
        ? 'items-center text-center'
        : 'items-start text-left';

    // Resolve dictionary keys
    const h1Text = d(slide.h1_key, slide.h1_key);
    const pText = d(slide.p_key, slide.p_key);
    const ctaPrimaryLabel = slide.cta_primary_label_key ? d(slide.cta_primary_label_key, slide.cta_primary_label_key) : null;
    const ctaSecondaryLabel = slide.cta_secondary_label_key ? d(slide.cta_secondary_label_key, slide.cta_secondary_label_key) : null;
    const imageAlt = slide.image_alt_key ? d(slide.image_alt_key, '') : h1Text;

    // For SEO: Only render H1 on the first active slide to ensure single H1 per page
    const HeadingTag = isFirst ? 'h1' : 'p';

    return (
        <div
            className={`hero-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            aria-hidden={!isActive}
        >
            {/* Background Image */}
            <img
                src={slide.image_url}
                alt={imageAlt}
                className="absolute inset-0 h-full w-full object-cover"
                loading={isFirst ? 'eager' : 'lazy'}
            />

            {/* Overlay */}
            <div className={`absolute inset-0 ${overlayClass}`} />

            {/* Content */}
            <div className={`relative z-10 flex h-full flex-col justify-center px-6 sm:px-12 lg:px-16 ${alignClass}`}>
                <div className={`max-w-xl ${slide.align === 'center' ? 'mx-auto' : ''}`}>
                    <HeadingTag
                        className={`font-semibold tracking-tight ${textColorClass} text-3xl sm:text-4xl lg:text-[44px] lg:leading-tight`}
                        role={isFirst ? undefined : 'heading'}
                        aria-level={isFirst ? undefined : 1}
                    >
                        {h1Text}
                    </HeadingTag>

                    {pText && (
                        <p className={`mt-4 text-base leading-relaxed ${textSecondaryClass} max-w-xl`}>
                            {pText}
                        </p>
                    )}

                    {/* CTA Buttons */}
                    {(ctaPrimaryLabel || ctaSecondaryLabel) && (
                        <div className={`mt-6 flex flex-wrap gap-3 ${slide.align === 'center' ? 'justify-center' : ''}`}>
                            {ctaPrimaryLabel && slide.cta_primary_href && (
                                <Link
                                    href={slide.cta_primary_href}
                                    className="inline-flex items-center justify-center rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                                >
                                    {ctaPrimaryLabel}
                                </Link>
                            )}
                            {ctaSecondaryLabel && slide.cta_secondary_href && (
                                <Link
                                    href={slide.cta_secondary_href}
                                    className={`inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 ${
                                        slide.overlay_style === 'light'
                                            ? 'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-500'
                                            : 'bg-white/20 text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/30 focus-visible:ring-white/50'
                                    }`}
                                >
                                    {ctaSecondaryLabel}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Main HeroCarousel component
export default function HeroCarousel({
    slides = [],
    autoplayInterval = 6500,
    className = '',
}) {
    const d = useDict();

    // Filter active slides and sort by sort order
    const activeSlides = slides
        .filter(slide => slide.is_active !== false)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isTabVisible, setIsTabVisible] = useState(true);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const containerRef = useRef(null);

    const slideCount = activeSlides.length;

    // Navigation functions
    const goToSlide = useCallback((index) => {
        setCurrentIndex((index + slideCount) % slideCount);
    }, [slideCount]);

    const goNext = useCallback(() => {
        goToSlide(currentIndex + 1);
    }, [currentIndex, goToSlide]);

    const goPrev = useCallback(() => {
        goToSlide(currentIndex - 1);
    }, [currentIndex, goToSlide]);

    // Autoplay
    useEffect(() => {
        if (slideCount <= 1 || isPaused || !isTabVisible) return;

        const timer = setInterval(goNext, autoplayInterval);
        return () => clearInterval(timer);
    }, [slideCount, isPaused, isTabVisible, goNext, autoplayInterval]);

    // Tab visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsTabVisible(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!containerRef.current?.contains(document.activeElement) &&
                document.activeElement !== containerRef.current) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goNext();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [goNext, goPrev]);

    // Touch swipe handlers
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (Math.abs(diff) > minSwipeDistance) {
            if (diff > 0) {
                goNext();
            } else {
                goPrev();
            }
        }
    };

    // Don't render if no slides
    if (activeSlides.length === 0) {
        return null;
    }

    // Single slide - no controls needed
    if (activeSlides.length === 1) {
        return (
            <div className={`relative h-[50vh] min-h-[360px] max-h-[620px] overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
                <Slide slide={activeSlides[0]} isActive={true} isFirst={true} d={d} />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`hero-carousel relative h-[50vh] min-h-[360px] max-h-[620px] overflow-hidden rounded-2xl border border-slate-200 ${className}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Hero banner carousel"
        >
            {/* Slides */}
            <div className="relative h-full w-full">
                {activeSlides.map((slide, index) => (
                    <Slide
                        key={slide.id || index}
                        slide={slide}
                        isActive={index === currentIndex}
                        isFirst={index === 0 && currentIndex === 0}
                        d={d}
                    />
                ))}
            </div>

            {/* Arrow Controls */}
            <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2.5 ring-1 ring-white/20 backdrop-blur transition-all hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:left-4 sm:p-3"
                aria-label="Previous slide"
            >
                <ChevronLeftIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </button>

            <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2.5 ring-1 ring-white/20 backdrop-blur transition-all hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:right-4 sm:p-3"
                aria-label="Next slide"
            >
                <ChevronRightIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </button>

            {/* Dot Indicators */}
            <div
                className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/20 px-3 py-2 ring-1 ring-white/15 backdrop-blur"
                role="tablist"
                aria-label="Slide indicators"
            >
                {activeSlides.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => goToSlide(index)}
                        className={`h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                            index === currentIndex
                                ? 'w-6 bg-white'
                                : 'w-2 bg-white/50 hover:bg-white/70'
                        }`}
                        role="tab"
                        aria-selected={index === currentIndex}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Pause indicator (optional visual feedback) */}
            {isPaused && (
                <div className="absolute right-4 top-4 z-20 rounded-full bg-black/30 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur">
                    Paused
                </div>
            )}
        </div>
    );
}
