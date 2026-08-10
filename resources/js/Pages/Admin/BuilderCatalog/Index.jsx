import DashboardLayout from '@/Layouts/DashboardLayout';
import Modal from '@/Components/Modal';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const money = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

/* ── Add-products modal ────────────────────────────────────────────────
   Searches products not yet on the trade list, lets the admin set a price
   per row, then submits the whole selection in one request.
─────────────────────────────────────────────────────────────────────── */
function AddProductsModal({ open, onClose, categories }) {
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    // { [productId]: { price, retail, name } }
    const [selected, setSelected] = useState({});
    const [saving, setSaving] = useState(false);
    const [bulkPercent, setBulkPercent] = useState('');

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search.trim()) params.set('q', search.trim());
                if (categoryId) params.set('category_id', categoryId);
                const res = await fetch(`${route('admin.builder.catalog.available')}?${params}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                const data = await res.json();
                setResults(data.products ?? []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [search, categoryId, open]);

    useEffect(() => {
        if (!open) {
            setSelected({});
            setSearch('');
            setBulkPercent('');
        }
    }, [open]);

    const toggle = (product) => {
        setSelected((prev) => {
            const next = { ...prev };
            if (next[product.id]) {
                delete next[product.id];
            } else {
                next[product.id] = {
                    // Seed with retail so the admin edits down from a real number
                    // instead of typing every price from scratch.
                    price: parseFloat(product.price ?? 0).toFixed(2),
                    retail: parseFloat(product.price ?? 0),
                    name: product.name,
                };
            }
            return next;
        });
    };

    const setPrice = (id, price) => {
        setSelected((prev) => ({ ...prev, [id]: { ...prev[id], price } }));
    };

    // Convenience only: fills the price boxes from a % off retail. The values
    // are still per-product and fully editable before saving.
    const applyPercent = () => {
        const pct = parseFloat(bulkPercent);
        if (isNaN(pct)) return;
        setSelected((prev) => {
            const next = {};
            for (const [id, row] of Object.entries(prev)) {
                next[id] = { ...row, price: (row.retail * (1 - pct / 100)).toFixed(2) };
            }
            return next;
        });
    };

    const submit = () => {
        const items = Object.entries(selected).map(([product_id, row]) => ({
            product_id: Number(product_id),
            price: parseFloat(row.price) || 0,
        }));
        if (!items.length) return;
        setSaving(true);
        router.post(route('admin.builder.catalog.store'), { items }, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => setSaving(false),
        });
    };

    const count = Object.keys(selected).length;

    return (
        <Modal show={open} onClose={onClose} maxWidth="2xl">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900">Add products to the builder catalogue</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Tick the products builders should see, then set the price they pay.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or SKU…"
                        className="flex-1 rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                    />
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {count > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded bg-amber-50 px-3 py-2 text-sm">
                        <span className="font-medium text-amber-900">{count} selected</span>
                        <span className="text-amber-700">— quick fill:</span>
                        <input
                            type="number"
                            value={bulkPercent}
                            onChange={(e) => setBulkPercent(e.target.value)}
                            placeholder="30"
                            className="w-20 rounded border-amber-300 py-1 text-sm"
                        />
                        <span className="text-amber-700">% off retail</span>
                        <button
                            type="button"
                            onClick={applyPercent}
                            className="rounded bg-amber-500 px-2.5 py-1 text-xs font-semibold text-slate-900 hover:bg-amber-400"
                        >
                            Apply
                        </button>
                    </div>
                )}

                <div className="mt-4 max-h-96 overflow-y-auto rounded border border-gray-200">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
                    ) : results.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">
                            No products found. Everything matching may already be in the catalogue.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="sticky top-0 bg-gray-50">
                                <tr>
                                    <th className="w-10 px-3 py-2"></th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Product</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Retail</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500">Builder price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {results.map((p) => {
                                    const isSel = !!selected[p.id];
                                    return (
                                        <tr key={p.id} className={isSel ? 'bg-amber-50' : ''}>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={isSel}
                                                    onChange={() => toggle(p)}
                                                    className="rounded border-gray-300 text-brand focus:ring-brand"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="font-medium text-gray-900">{p.name}</div>
                                                {p.sku ? <div className="text-xs text-gray-500">{p.sku}</div> : null}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-600">{money(p.price)}</td>
                                            <td className="px-3 py-2 text-right">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    disabled={!isSel}
                                                    value={isSel ? selected[p.id].price : ''}
                                                    onChange={(e) => setPrice(p.id, e.target.value)}
                                                    className="w-24 rounded border-gray-300 py-1 text-right text-sm disabled:bg-gray-100"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={count === 0 || saving}
                        className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        {saving ? 'Adding…' : `Add ${count || ''} product${count === 1 ? '' : 's'}`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ── Editable price row ────────────────────────────────────────────── */
function PriceCell({ listing }) {
    const [value, setValue] = useState(parseFloat(listing.price).toFixed(2));
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const save = () => {
        if (!dirty) return;
        setSaving(true);
        router.put(route('admin.builder.catalog.update', listing.id), {
            price: parseFloat(value) || 0,
            is_active: listing.is_active,
            sort: listing.sort,
            note: listing.note,
        }, {
            preserveScroll: true,
            onSuccess: () => setDirty(false),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="flex items-center justify-end gap-1.5">
            <span className="text-gray-400">$</span>
            <input
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => { setValue(e.target.value); setDirty(true); }}
                onBlur={save}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className={`w-24 rounded py-1 text-right text-sm ${dirty ? 'border-amber-400 bg-amber-50' : 'border-gray-300'}`}
            />
            {saving ? <span className="text-xs text-gray-400">…</span> : null}
        </div>
    );
}

export default function BuilderCatalogIndex({ listings, categories, filters, stats }) {
    const [addOpen, setAddOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState(filters?.q ?? '');

    const rows = listings?.data ?? [];
    const allChecked = rows.length > 0 && selectedIds.length === rows.length;

    const applyFilter = (patch) => {
        router.get(route('admin.builder.catalog.index'), { ...filters, ...patch }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const toggleAll = () => setSelectedIds(allChecked ? [] : rows.map((r) => r.id));
    const toggleOne = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const bulk = (action) => {
        if (!selectedIds.length) return;
        if (action === 'remove' && !confirm(`Remove ${selectedIds.length} product(s) from the builder catalogue?`)) return;
        router.post(route('admin.builder.catalog.bulk'), { action, ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    };

    const toggleActive = (listing) => {
        router.put(route('admin.builder.catalog.update', listing.id), {
            price: listing.price,
            is_active: !listing.is_active,
            sort: listing.sort,
            note: listing.note,
        }, { preserveScroll: true });
    };

    const remove = (listing) => {
        if (!confirm(`Remove "${listing.product?.name}" from the builder catalogue?`)) return;
        router.delete(route('admin.builder.catalog.destroy', listing.id), { preserveScroll: true });
    };

    return (
        <DashboardLayout>
            <Head title="Builder Catalogue" />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Builder Catalogue</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Products your trade accounts can buy, and the price they pay. Products not listed here are invisible in the builder portal.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{stats?.active ?? 0}</span> live
                        <span className="text-gray-400"> / {stats?.total ?? 0} total</span>
                    </div>
                    {/* Admins are allowed into the portal, so the catalogue can be
                        checked against what builders actually see. */}
                    <a
                        href="/builder"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        View portal ↗
                    </a>
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                        + Add products
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="mb-4 flex flex-wrap gap-2">
                <form
                    onSubmit={(e) => { e.preventDefault(); applyFilter({ q: search }); }}
                    className="flex-1 min-w-[220px]"
                >
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products…"
                        className="w-full rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                    />
                </form>
                <select
                    value={filters?.category_id ?? ''}
                    onChange={(e) => applyFilter({ category_id: e.target.value })}
                    className="rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                >
                    <option value="">All categories</option>
                    {(categories ?? []).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <select
                    value={filters?.status ?? ''}
                    onChange={(e) => applyFilter({ status: e.target.value })}
                    className="rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                >
                    <option value="">All statuses</option>
                    <option value="active">Live</option>
                    <option value="inactive">Hidden</option>
                </select>
            </div>

            {/* ── Bulk bar ── */}
            {selectedIds.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded bg-gray-900 px-4 py-2.5 text-sm text-white">
                    <span className="font-medium">{selectedIds.length} selected</span>
                    <div className="ml-auto flex gap-2">
                        <button type="button" onClick={() => bulk('activate')} className="rounded bg-white/15 px-3 py-1 hover:bg-white/25">Make live</button>
                        <button type="button" onClick={() => bulk('deactivate')} className="rounded bg-white/15 px-3 py-1 hover:bg-white/25">Hide</button>
                        <button type="button" onClick={() => bulk('remove')} className="rounded bg-red-500 px-3 py-1 hover:bg-red-600">Remove</button>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-10 px-4 py-3">
                                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded border-gray-300 text-brand focus:ring-brand" />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Retail</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Builder price</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Margin</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Live</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-16 text-center">
                                        <p className="text-sm font-medium text-gray-900">No products in the builder catalogue yet.</p>
                                        <p className="mt-1 text-sm text-gray-500">Click “Add products” to choose what your trade accounts can buy.</p>
                                    </td>
                                </tr>
                            ) : rows.map((listing) => (
                                <tr key={listing.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(listing.id)}
                                            onChange={() => toggleOne(listing.id)}
                                            className="rounded border-gray-300 text-brand focus:ring-brand"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {listing.product?.image_url ? (
                                                <img src={listing.product.image_url} alt="" className="h-10 w-10 rounded border border-gray-200 object-cover" />
                                            ) : (
                                                <div className="h-10 w-10 rounded bg-gray-100" />
                                            )}
                                            <div className="min-w-0">
                                                <div className="truncate font-medium text-gray-900">{listing.product?.name}</div>
                                                {listing.product?.sku ? (
                                                    <div className="text-xs text-gray-500">{listing.product.sku}</div>
                                                ) : null}
                                                {!listing.product?.is_active ? (
                                                    <div className="mt-0.5 inline-flex rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                                        Archived in main catalogue — hidden from builders
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{listing.product?.category?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-right text-gray-500">{money(listing.retail_price)}</td>
                                    <td className="px-4 py-3">
                                        <PriceCell listing={listing} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-semibold ${listing.discount_percent > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                            {listing.discount_percent > 0 ? `−${listing.discount_percent}%` : '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(listing)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${listing.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                                            aria-label="Toggle live"
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${listing.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => remove(listing)}
                                            className="text-sm font-medium text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Pagination ── */}
            {(listings?.links ?? []).length > 3 && (
                <div className="mt-6 flex flex-wrap justify-center gap-1">
                    {listings.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            preserveScroll
                            className={`rounded px-3 py-1.5 text-sm ${
                                link.active
                                    ? 'bg-brand font-semibold text-white'
                                    : link.url
                                        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        : 'cursor-not-allowed border border-gray-200 bg-white text-gray-300'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}

            <AddProductsModal open={addOpen} onClose={() => setAddOpen(false)} categories={categories ?? []} />
        </DashboardLayout>
    );
}
