import { useState, useEffect } from 'react';

const PLACEHOLDER = '/images/placeholder-product.svg';

/**
 * ProductImage — handles missing/broken product images via React state.
 *
 * Using state (not just onError) is critical: React reconciliation resets
 * the DOM src attribute back to the original broken URL on re-renders,
 * so a plain onError handler causes an infinite reload loop. State persists
 * the fallback across re-renders.
 */
export default function ProductImage({ src, alt, className, ...props }) {
    const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER);

    // Sync state when the src prop changes (e.g. product switches)
    useEffect(() => {
        setImgSrc(src || PLACEHOLDER);
    }, [src]);

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            onError={() => setImgSrc(PLACEHOLDER)}
            {...props}
        />
    );
}
