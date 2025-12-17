import { usePage } from '@inertiajs/react';

function replacePlaceholders(value, params) {
    if (!params || typeof params !== 'object') return value;

    let out = String(value);

    for (const [k, v] of Object.entries(params)) {
        out = out.replaceAll(`:${k}`, String(v));
    }

    return out;
}

export function useD() {
    const { dictionary } = usePage().props;
    const items = dictionary?.items ?? {};

    return (key, params = {}, locale = null, defaultValue = null) => {
        const val = items?.[key] ?? defaultValue ?? key;
        return replacePlaceholders(val, params);
    };
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
