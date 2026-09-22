/**
 * The six filter dimensions the storefront's "Find Your Perfect Tile" section
 * is built from.
 *
 * Collections are grouped by their handle prefix — colour-white, space-bathroom,
 * finish-matt — which is how they were named when they were created. Anything
 * that does not match a prefix is not lost: it falls into "Other", so a
 * collection made for a sale or a campaign still shows up.
 */
export const COLLECTION_GROUPS = [
    { key: 'colour', label: 'By Colour', prefixes: ['colour-', 'color-'] },
    { key: 'space', label: 'By Space', prefixes: ['space-'] },
    { key: 'size', label: 'By Size', prefixes: ['size-'] },
    { key: 'material', label: 'By Material', prefixes: ['material-'] },
    { key: 'finish', label: 'By Finish', prefixes: ['finish-'] },
    { key: 'style', label: 'By Style', prefixes: ['style-'] },
];

const handleOf = (collection) => String(collection?.handle ?? '').toLowerCase();

export function groupKeyFor(collection) {
    const handle = handleOf(collection);
    const group = COLLECTION_GROUPS.find((g) => g.prefixes.some((p) => handle.startsWith(p)));

    return group?.key ?? 'other';
}

/**
 * @returns {{key: string, label: string, items: Array}[]} the six groups in a
 * fixed order, plus "Other" when anything falls outside them. Empty groups are
 * kept so the page still shows every dimension — an absent "By Size" would
 * read as a bug rather than as "nothing filed here yet".
 */
export function groupCollections(collections = [], { keepEmpty = true } = {}) {
    const buckets = Object.fromEntries(COLLECTION_GROUPS.map((g) => [g.key, []]));
    buckets.other = [];

    for (const collection of collections) {
        buckets[groupKeyFor(collection)].push(collection);
    }

    const label = (c) => String(c.title ?? c.name ?? '');
    for (const key of Object.keys(buckets)) {
        buckets[key].sort((a, b) => label(a).localeCompare(label(b)));
    }

    const groups = COLLECTION_GROUPS
        .map((g) => ({ ...g, items: buckets[g.key] }))
        .filter((g) => keepEmpty || g.items.length > 0);

    if (buckets.other.length) {
        groups.push({ key: 'other', label: 'Other', items: buckets.other });
    }

    return groups;
}
