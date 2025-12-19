import { usePage } from '@inertiajs/react';

function replacePlaceholders(value, params) {
    if (!params || typeof params !== 'object') return value;

    let out = String(value);

    for (const [k, v] of Object.entries(params)) {
        out = out.replaceAll(`:${k}`, String(v));
    }

    return out;
}

/**
 * Hook version - uses Inertia page props for dictionary.
 */
export function useD() {
    const { dictionary } = usePage().props;
    const items = dictionary?.items ?? {};

    return (key, params = {}, locale = null, defaultValue = null) => {
        const val = items?.[key] ?? defaultValue ?? key;
        return replacePlaceholders(val, params);
    };
}

/**
 * Simple function version - returns default value if key not found.
 * Useful in components where hook usage isn't necessary.
 * Usage: d('cart.title', 'Shopping Cart')
 */
export function d(key, defaultValue = null, params = {}) {
    // Try to get dictionary from global window if available
    const items = window.__INERTIA_DICTIONARY_ITEMS__ ?? {};
    const val = items?.[key] ?? defaultValue ?? key;
    return replacePlaceholders(val, params);
}

/**
 * Initialize dictionary items for non-hook usage.
 * Should be called once on app initialization.
 */
export function initDictionary(items) {
    window.__INERTIA_DICTIONARY_ITEMS__ = items ?? {};
}

export function previewValue(valueText) {
    const str = String(valueText ?? '');
    const matches = str.match(/:[a-zA-Z0-9_]+/g) ?? [];
    const uniq = Array.from(new Set(matches.map((m) => m.slice(1))));

    let preview = str;
    for (const k of uniq) {
        preview = preview.replaceAll(`:${k}`, `<${k}>`);
    }

    return { placeholders: uniq, preview };
}
