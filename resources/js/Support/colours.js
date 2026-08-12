/**
 * Colour name -> swatch hex.
 *
 * Single source of truth, shared by the retail product page, the trade product
 * page and the admin spec editor. Keeping one copy is what lets the swatch an
 * admin previews while editing be the exact swatch a customer sees; when this
 * lived separately in each page they drifted.
 *
 * A name not listed here still works — the storefront falls back to a neutral
 * circle showing the first two letters — but it will not render a real colour,
 * which is why the admin editor warns when a name is unrecognised.
 */
export const COLOUR_HEX = {
    white: '#ffffff', 'warm white': '#f7f3ea', 'off white': '#f4f1e9', ivory: '#fffff0',
    cream: '#f5f0e1', beige: '#d8c6a8', 'beige white mix': '#e5dcc5', sand: '#dcc9a6',
    peach: '#f0cbb0', tan: '#c9a67a', brown: '#7a4f2a', cinnamon: '#8b4a2f',
    terracotta: '#c96f4c', orange: '#d47a3a', rust: '#a5502f',
    grey: '#9aa0a6', gray: '#9aa0a6', 'light grey': '#cfd3d7', 'light gray': '#cfd3d7',
    'dark grey': '#5a5f63', ash: '#b2b5b7', 'ash grey': '#a9adb0', silver: '#c0c4c8',
    charcoal: '#36454f', carbon: '#2b2b2b', graphite: '#3a3f44', black: '#1a1a1a',
    green: '#5a7d5a', 'sage green': '#9caf88', moss: '#6b7d54', olive: '#7a7a3c',
    khaki: '#8f8b5a', blue: '#3b6ea5', 'sky blue': '#8fc1e3', 'ocean blue': '#2e6b8a',
    teal: '#2b7a78', 'teal blue': '#2b7a78', navy: '#2a3d5a', amber: '#c98a2b', aqua: '#7fc6c1',
};

/** Hex for a colour name, or null when the name is not in the map. */
export function colourHex(name) {
    return name ? (COLOUR_HEX[String(name).trim().toLowerCase()] ?? null) : null;
}

/** Every recognised colour name, for admin autocomplete. */
export const COLOUR_NAMES = Object.keys(COLOUR_HEX).sort();

/**
 * How each spec field is stored in the `specifications` JSON, and therefore how
 * the storefront parses it back out.
 *
 * Colours are comma-separated; finishes are slash-separated ("Matt / Soft
 * Touch"). The storefront's finish parser accepts either separator, but writing
 * the slash keeps existing data rendering unchanged.
 */
export const SPEC_LIST_FORMATS = {
    colour: { split: /,/, join: () => ', ' },
    finish: {
        split: /[/,]/,
        // Finish is stored slash-separated on most products but comma-separated
        // on a few hundred ("Matt Finish, Handmade Texture"). The storefront
        // parser accepts both, so editing one item must not quietly reformat the
        // rest of the field — keep whichever separator the product already uses.
        join: (current) => (String(current ?? '').includes('/') || !String(current ?? '').includes(',') ? ' / ' : ', '),
    },
};

/** "Black, Charcoal, Carbon" -> ['Black', 'Charcoal', 'Carbon'] */
export function parseSpecList(value, splitPattern) {
    return String(value ?? '')
        .split(splitPattern)
        .map((s) => s.trim())
        .filter(Boolean);
}
