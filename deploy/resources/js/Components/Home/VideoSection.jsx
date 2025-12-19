import { Link, usePage } from '@inertiajs/react';
import { useState, useCallback, useRef, useEffect } from 'react';

// Icons
function PlayIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
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

// Extract YouTube video ID
function getYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/);
    return match ? match[1] : null;
}

// Extract Vimeo video ID
function getVimeoId(url) {
    if (!url) return null;
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
}

export default function VideoSection({ data }) {
    const d = useDict();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    // Lazy load - only render video when section is visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    if (!data) return null;

    const {
        heading_key,
        subheading_key,
        video_type,
        video_url,
        embed_url,
        poster_url,
        cta_label_key,
        cta_href,
    } = data;

    const heading = heading_key ? d(heading_key, '') : null;
    const subheading = subheading_key ? d(subheading_key, '') : null;
    const ctaLabel = cta_label_key ? d(cta_label_key, '') : null;

    const youtubeId = getYouTubeId(embed_url);
    const vimeoId = getVimeoId(embed_url);

    const handlePlay = () => {
        setIsPlaying(true);
    };

    return (
        <section ref={sectionRef} className="video-section py-8">
            {(heading || subheading) && (
                <div className="mb-6 text-center">
                    {heading && (
                        <h2 className="text-2xl font-semibold text-gray-900">{heading}</h2>
                    )}
                    {subheading && (
                        <p className="mt-2 text-gray-600">{subheading}</p>
                    )}
                </div>
            )}

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-900">
                {!isVisible ? (
                    // Placeholder before lazy load
                    <div className="flex h-full items-center justify-center bg-gray-900">
                        <div className="h-12 w-12 animate-pulse rounded-full bg-gray-800" />
                    </div>
                ) : video_type === 'upload' && video_url ? (
                    // Native video
                    <video
                        src={video_url}
                        poster={poster_url}
                        controls
                        className="h-full w-full object-cover"
                        preload="none"
                    />
                ) : youtubeId ? (
                    // YouTube embed
                    isPlaying ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                            title="Video player"
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={handlePlay}
                            className="group relative h-full w-full"
                            aria-label="Play video"
                        >
                            {poster_url ? (
                                <img
                                    src={poster_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <img
                                    src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
                                    <PlayIcon className="ml-1 h-8 w-8 sm:h-10 sm:w-10" />
                                </div>
                            </div>
                        </button>
                    )
                ) : vimeoId ? (
                    // Vimeo embed
                    isPlaying ? (
                        <iframe
                            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                            title="Video player"
                            className="h-full w-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={handlePlay}
                            className="group relative h-full w-full"
                            aria-label="Play video"
                        >
                            {poster_url && (
                                <img
                                    src={poster_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
                                    <PlayIcon className="ml-1 h-8 w-8 sm:h-10 sm:w-10" />
                                </div>
                            </div>
                        </button>
                    )
                ) : null}
            </div>

            {ctaLabel && cta_href && (
                <div className="mt-5 text-center">
                    <Link
                        href={cta_href}
                        className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
                    >
                        {ctaLabel}
                    </Link>
                </div>
            )}
        </section>
    );
}
