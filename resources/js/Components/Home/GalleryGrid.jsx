import { Link, usePage } from '@inertiajs/react';
import { useCallback, useRef, useEffect, useState } from 'react';
import Container from '@/Components/Container';

// Dictionary helper
function useDict() {
    const { dictionary } = usePage().props;
    return useCallback((key, fallback = '') => {
        return dictionary?.items?.[key] ?? fallback ?? key;
    }, [dictionary]);
}

// Gallery Item
function GalleryItem({ item, d }) {
    const alt = item.alt_key ? d(item.alt_key, '') : '';

    const content = (
        <div className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            <img
                src={item.image_url}
                alt={alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        </div>
    );

    if (item.href) {
        return (
            <Link href={item.href} className="block">
                {content}
            </Link>
        );
    }

    return <div>{content}</div>;
}

export default function GalleryGrid({ data }) {
    const d = useDict();
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    const items = data?.items || [];
    const titleKey = data?.title_key || 'home.gallery.title';
    const title = d(titleKey, 'Gallery');

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

    if (!items.length) {
        return null;
    }

    return (
        <section ref={sectionRef} className="gallery-grid py-8">
            <Container>
                {title && (
                    <h2 className="mb-5 text-xl font-semibold text-gray-900">{title}</h2>
                )}

                {isVisible && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
                        {items.map((item, index) => (
                            <GalleryItem key={index} item={item} d={d} />
                        ))}
                    </div>
                )}
            </Container>
        </section>
    );
}
