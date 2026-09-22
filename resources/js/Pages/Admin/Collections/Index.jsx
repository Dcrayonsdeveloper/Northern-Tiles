import DashboardLayout from '@/Layouts/DashboardLayout';
import { COLLECTION_GROUPS, groupCollections } from '@/Utils/collectionGroups';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content;

function StatusBadge({ active }) {
    return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
            active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

/**
 * Adds products to one collection without leaving the page.
 *
 * Opens inside the row it belongs to, because the whole point of this screen
 * is "which tiles are under White" — bouncing to a separate editor to answer
 * that loses the thread.
 */
function AddProducts({ collection, onAdded }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState('');

    const search = async (value) => {
        setQuery(value);
        if (value.trim().length < 2) {
            setResults([]);
            return;
        }
        try {
            const res = await fetch(`${route('admin.collections.search-products')}?q=${encodeURIComponent(value)}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            setResults(res.ok ? await res.json() : []);
        } catch {
            setResults([]);
        }
    };

    const add = async (product) => {
        setBusy(true);
        try {
            const res = await fetch(route('admin.collections.add-product', collection.id), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
                credentials: 'same-origin',
                body: JSON.stringify({ product_id: product.id }),
            });
            const body = await res.json().catch(() => ({}));
            // The endpoint rejects duplicates, which is worth saying out loud
            // rather than looking like nothing happened.
            setNote(res.ok ? `Added ${product.name}` : (body.message ?? 'Could not add that product'));
            if (res.ok) {
                setResults((r) => r.filter((p) => p.id !== product.id));
                onAdded?.();
            }
        } finally {
            setBusy(false);
            setTimeout(() => setNote(''), 2500);
        }
    };

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)} className="btn-secondary px-2 py-1 text-xs">
                Add products
            </button>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center gap-2">
                <input
                    autoFocus
                    value={query}
                    onChange={(e) => search(e.target.value)}
                    placeholder="Search by name or SKU…"
                    className="admin-input flex-1 text-xs"
                />
                <button type="button" onClick={() => { setOpen(false); setQuery(''); setResults([]); }} className="btn-secondary px-2 py-1 text-xs">
                    Done
                </button>
            </div>

            {note ? <p className="mt-1 text-[11px] text-gray-500">{note}</p> : null}

            {results.length > 0 && (
                <ul className="mt-2 max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
                    {results.map((p) => (
                        <li key={p.id}>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => add(p)}
                                className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-gray-50 disabled:opacity-50"
                            >
                                <span className="h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                                    {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : null}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-xs text-gray-900">{p.name}</span>
                                <span className="text-[11px] text-gray-400">+</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {query.trim().length >= 2 && results.length === 0 && (
                <p className="mt-2 text-[11px] text-gray-400">No matches.</p>
            )}
        </div>
    );
}

/**
 * Creates another collection inside one dimension.
 *
 * The handle carries the dimension — colour-sand, finish-crackle — and that
 * prefix is what everything else groups on, so it is derived from the tab
 * rather than typed. Getting it wrong by hand would file the collection under
 * "Other" and leave it out of the storefront filter it was meant for.
 */
function NewCollection({ group, existing = [] }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const prefix = group?.prefixes?.[0];
    if (!prefix) return null;

    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const handle = slug ? `${prefix}${slug}` : '';
    const clash = handle && existing.some((c) => String(c.handle).toLowerCase() === handle);

    const create = () => {
        if (!slug || clash) return;
        setBusy(true);
        setError('');
        router.post(route('admin.collections.store'), {
            title: title.trim(),
            handle,
            type: 'manual',
            sort_mode: 'manual',
            is_active: true,
            redirect_to: 'index',
        }, {
            preserveScroll: true,
            onError: (errs) => setError(Object.values(errs)[0] ?? 'Could not create that collection.'),
            onSuccess: () => { setTitle(''); setOpen(false); },
            onFinish: () => setBusy(false),
        });
    };

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)} className="btn-primary px-3 py-1.5 text-xs">
                + New {group.label.replace('By ', '').toLowerCase()}
            </button>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && create()}
                placeholder={`e.g. ${group.key === 'colour' ? 'Sand' : group.key === 'size' ? '600x600' : 'New'}`}
                className="admin-input w-48 text-xs"
            />
            <span className="text-[11px] text-gray-400">/{handle || `${prefix}…`}</span>
            <button type="button" onClick={create} disabled={!slug || clash || busy} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50">
                {busy ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setTitle(''); setError(''); }} className="btn-secondary px-3 py-1.5 text-xs">
                Cancel
            </button>
            {clash ? <span className="text-[11px] text-amber-700">That one already exists.</span> : null}
            {error ? <span className="text-[11px] text-red-600">{error}</span> : null}
        </div>
    );
}

export default function Index({ collections = [], filters = {} }) {
    const list = Array.isArray(collections) ? collections : (collections.data ?? []);
    const [search, setSearch] = useState(filters?.search ?? '');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return list;
        return list.filter((c) =>
            String(c.title ?? '').toLowerCase().includes(q) || String(c.handle ?? '').toLowerCase().includes(q));
    }, [list, search]);

    const groups = useMemo(() => groupCollections(filtered), [filtered]);
    const [tab, setTab] = useState(COLLECTION_GROUPS[0].key);
    const current = groups.find((g) => g.key === tab) ?? groups[0];

    const refresh = () => router.reload({ only: ['collections'] });

    return (
        <DashboardLayout title="Collections">
            <Head title="Collections" />

            <div>
                <h1 className="text-sm font-semibold text-gray-900">Collections</h1>
                <p className="mt-0.5 text-xs text-gray-500">
                    These are the storefront’s “Find your perfect tile” filters. Pick a dimension, then add products to it.
                </p>
            </div>

            {/* The six dimensions. Tabs rather than one long list, so it is
                obvious these are six separate things and not 36 unrelated ones. */}
            <div className="mt-4 flex flex-wrap gap-2">
                {groups.map((g) => {
                    const products = g.items.reduce((n, c) => n + Number(c.products_count || 0), 0);
                    const active = g.key === current?.key;
                    return (
                        <button
                            key={g.key}
                            type="button"
                            onClick={() => setTab(g.key)}
                            className={`rounded-lg border px-3 py-2 text-left transition ${
                                active ? 'border-brand bg-brand/5' : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <span className={`block text-xs font-semibold ${active ? 'text-brand' : 'text-gray-900'}`}>
                                {g.label}
                            </span>
                            <span className="block text-[11px] text-gray-500">
                                {g.items.length} · {products} products
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search collections…"
                    className="admin-input w-full max-w-sm text-xs"
                />
            </div>

            <div className="admin-card mt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-900">{current?.label}</span>
                    <NewCollection group={current} existing={list} />
                </div>

                {current?.items?.length ? (
                    <div className="divide-y divide-gray-100">
                        {current.items.map((c) => (
                            <div key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                                <div className="min-w-[180px] flex-1">
                                    <Link
                                        href={route('admin.collections.edit', c.id)}
                                        className="text-xs font-medium text-gray-900 hover:text-brand"
                                    >
                                        {c.title}
                                    </Link>
                                    <div className="text-[11px] text-gray-500">/{c.handle}</div>
                                </div>

                                <div className="w-24 text-xs text-gray-600">{c.products_count} products</div>
                                <div className="w-20"><StatusBadge active={c.is_active} /></div>

                                <div className="flex items-center gap-1">
                                    <AddProducts collection={c} onAdded={refresh} />
                                    <Link href={route('admin.collections.edit', c.id)} className="btn-secondary px-2 py-1 text-xs">
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-8 text-center text-xs text-gray-500">
                        Nothing under {current?.label} yet.
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
}
