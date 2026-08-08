import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';

/* ─────────────────────────── helpers ─────────────────────────── */

const csrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

async function req(url, method, body) {
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf(),
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
    });

    let data = {};
    try {
        data = await res.json();
    } catch {
        /* empty body is fine */
    }

    return { ok: res.ok && data.ok !== false, data };
}

/** Move item at `from` to `to`, returning a new array. */
function reorder(list, from, to) {
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
}

/* ─────────────────────────── small UI ─────────────────────────── */

function Toast({ toast, onDone }) {
    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, [toast, onDone]);

    if (!toast) return null;

    return (
        <div
            className={`fixed bottom-5 right-5 z-[60] rounded-lg px-4 py-2.5 text-xs font-medium text-white shadow-lg ${
                toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
            }`}
        >
            {toast.message}
        </div>
    );
}

function Modal({ open, onClose, title, children, footer, wide = false }) {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20">
            <div
                className={`w-full rounded-xl bg-white shadow-xl ${wide ? 'max-w-lg' : 'max-w-md'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-4 py-4">{children}</div>
                {footer && (
                    <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">{footer}</div>
                )}
            </div>
        </div>
    );
}

function Grip({ className = '' }) {
    return (
        <svg className={`h-4 w-4 ${className}`} viewBox="0 0 20 20" fill="currentColor">
            <circle cx="7" cy="5" r="1.5" />
            <circle cx="13" cy="5" r="1.5" />
            <circle cx="7" cy="10" r="1.5" />
            <circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="15" r="1.5" />
            <circle cx="13" cy="15" r="1.5" />
        </svg>
    );
}

function Star({ filled }) {
    return (
        <svg
            className={`h-4 w-4 ${filled ? 'text-amber-500' : 'text-gray-300'}`}
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.6}
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.5a.56.56 0 011.04 0l2.13 4.32 4.77.69a.56.56 0 01.31.96l-3.45 3.36.82 4.75a.56.56 0 01-.82.59L12 15.93l-4.27 2.24a.56.56 0 01-.81-.59l.81-4.75-3.45-3.36a.56.56 0 01.31-.96l4.77-.69 2.12-4.32z"
            />
        </svg>
    );
}

const badge = (tone) =>
    `inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        {
            green: 'bg-green-100 text-green-700',
            amber: 'bg-amber-100 text-amber-700',
            red: 'bg-red-100 text-red-700',
            gray: 'bg-gray-100 text-gray-600',
        }[tone]
    }`;

/* ─────────────────────────── product row ─────────────────────────── */

function ProductRow({ product, family, index, onDragStart, onDragOver, onDrop, onSetDefault, onRemove }) {
    const isDefault = family.default_product_id === product.id;

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                onDragOver(index);
            }}
            onDrop={(e) => {
                e.preventDefault();
                onDrop(index);
            }}
            className="flex items-center gap-3 border-t border-gray-100 px-3 py-2 hover:bg-gray-50/60"
        >
            <span
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    onDragStart(index);
                }}
                className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                title="Drag to reorder"
            >
                <Grip />
            </span>

            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                {product.image_url && (
                    <img src={product.image_url} alt="" className="h-full w-full object-contain" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-gray-900">{product.label}</div>
                <div className="truncate text-[11px] text-gray-500">{product.name}</div>
            </div>

            <div className="hidden w-28 flex-shrink-0 truncate font-mono text-[11px] text-gray-500 md:block">
                {product.sku || '—'}
            </div>

            <div className="w-20 flex-shrink-0 text-right text-xs font-semibold text-gray-900">
                ${Number(product.price || 0).toFixed(2)}
            </div>

            <div className="hidden flex-shrink-0 sm:block">
                <span className={badge(product.in_stock ? 'green' : 'red')}>
                    {product.in_stock ? 'In stock' : 'Out of stock'}
                </span>
            </div>

            {!product.is_live && (
                <span className={badge('gray')} title="Not active + published — hidden from the storefront selector">
                    not live
                </span>
            )}

            <button
                type="button"
                onClick={() => onSetDefault(product.id)}
                title={isDefault ? 'Default variant of this family' : 'Set as default variant'}
                className="flex-shrink-0 rounded p-1 hover:bg-gray-100"
            >
                <Star filled={isDefault} />
            </button>

            <button
                type="button"
                onClick={() => onRemove(product)}
                title="Remove from family"
                className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

/* ─────────────────────────── family card ─────────────────────────── */

function FamilyCard({
    family,
    index,
    onDragStart,
    onDragOver,
    onDrop,
    onToggleActive,
    onEdit,
    onDelete,
    onAddProduct,
    onSetDefault,
    onRemoveProduct,
    onReorderProducts,
}) {
    const [open, setOpen] = useState(family.products.length === 0);
    const dragFrom = useRef(null);
    const dragOver = useRef(null);

    const liveCount = family.products.filter((p) => p.is_live).length;

    const handleProductDrop = () => {
        const from = dragFrom.current;
        const to = dragOver.current;
        dragFrom.current = null;
        dragOver.current = null;
        if (from === null || to === null || from === to) return;
        onReorderProducts(family, reorder(family.products, from, to).map((p) => p.id));
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                onDragOver(index);
            }}
            onDrop={(e) => {
                e.preventDefault();
                onDrop(index);
            }}
            className="rounded-xl border border-gray-200 bg-white shadow-sm"
        >
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                <span
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        onDragStart(index);
                    }}
                    className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                    title="Drag to reorder families"
                >
                    <Grip />
                </span>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex min-w-0 items-center gap-2 text-left"
                >
                    <svg
                        className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="truncate text-sm font-semibold text-gray-900">{family.name}</span>
                </button>

                <span className={badge('gray')}>
                    {family.products.length} {family.products.length === 1 ? 'product' : 'products'}
                </span>

                {liveCount < 2 && (
                    <span
                        className={badge('amber')}
                        title="The storefront selector needs 2+ live (active + published) products"
                    >
                        selector hidden
                    </span>
                )}

                <button
                    type="button"
                    onClick={() => onToggleActive(family)}
                    className={badge(family.is_active ? 'green' : 'gray')}
                    title="Click to toggle"
                >
                    {family.is_active ? 'Active' : 'Inactive'}
                </button>

                <div className="ml-auto flex items-center gap-1.5">
                    <button type="button" onClick={() => onAddProduct(family)} className="btn-secondary text-xs">
                        + Add Product
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(family)}
                        className="btn-secondary px-2 py-1 text-xs"
                        title="Rename"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(family)}
                        className="btn-secondary px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        title="Delete family"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Products */}
            {open &&
                (family.products.length ? (
                    <div>
                        {family.products.map((p, i) => (
                            <ProductRow
                                key={p.id}
                                product={p}
                                family={family}
                                index={i}
                                onDragStart={(from) => {
                                    dragFrom.current = from;
                                }}
                                onDragOver={(over) => {
                                    dragOver.current = over;
                                }}
                                onDrop={handleProductDrop}
                                onSetDefault={(pid) => onSetDefault(family, pid)}
                                onRemove={(prod) => onRemoveProduct(family, prod)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="border-t border-gray-100 px-3 py-4 text-xs text-gray-500">
                        No products yet — click “+ Add Product”.
                    </div>
                ))}
        </div>
    );
}

/* ─────────────────────────── page ─────────────────────────── */

export default function Index({ families: initialFamilies, ungroupedCount }) {
    const [families, setFamilies] = useState(initialFamilies);
    const [toast, setToast] = useState(null);

    const [formModal, setFormModal] = useState(null); // {id, name, is_active} | null
    const [addModal, setAddModal] = useState(null); // {family} | null
    const [deleteModal, setDeleteModal] = useState(null); // {family, strategy, target} | null

    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const dragFrom = useRef(null);
    const dragOver = useRef(null);

    useEffect(() => setFamilies(initialFamilies), [initialFamilies]);

    const base = route('admin.variant-families.index').replace(/\/$/, '');

    const notify = (message, type = 'success') => setToast({ message, type });

    const refresh = useCallback(() => {
        router.reload({ only: ['families', 'ungroupedCount'], preserveScroll: true });
    }, []);

    /** Run a mutation, toast the outcome, and re-pull props on success. */
    const mutate = async (url, method, body) => {
        const r = await req(url, method, body);
        if (r.ok) {
            if (r.data.message) notify(r.data.message);
            refresh();
        } else {
            notify(r.data.message || 'Something went wrong', 'error');
        }
        return r.ok;
    };

    /* families ------------------------------------------------------ */

    const saveFamily = async () => {
        const name = (formModal?.name || '').trim();
        if (!name) return notify('Name is required', 'error');

        const ok = formModal.id
            ? await mutate(`${base}/${formModal.id}`, 'PUT', { name, is_active: formModal.is_active })
            : await mutate(base, 'POST', { name });

        if (ok) setFormModal(null);
    };

    const toggleActive = (family) =>
        mutate(`${base}/${family.id}`, 'PUT', { is_active: !family.is_active });

    const confirmDelete = async () => {
        const body = { strategy: deleteModal.strategy };
        if (deleteModal.strategy === 'move') {
            if (!deleteModal.target) return notify('Pick a family to move products into', 'error');
            body.target_family_id = Number(deleteModal.target);
        }
        if (await mutate(`${base}/${deleteModal.family.id}`, 'DELETE', body)) setDeleteModal(null);
    };

    const handleFamilyDrop = () => {
        const from = dragFrom.current;
        const to = dragOver.current;
        dragFrom.current = null;
        dragOver.current = null;
        if (from === null || to === null || from === to) return;

        const next = reorder(families, from, to);
        setFamilies(next); // optimistic — reorder persists silently
        req(`${base}/reorder`, 'POST', { ids: next.map((f) => f.id) }).then((r) =>
            r.ok ? notify('Family order saved') : notify('Reorder failed', 'error')
        );
    };

    /* products ------------------------------------------------------ */

    const runSearch = useMemo(
        () =>
            debounce(async (q) => {
                if (q.trim().length < 2) {
                    setResults([]);
                    setSearching(false);
                    return;
                }
                try {
                    const res = await fetch(
                        `${route('admin.variant-families.search-products')}?q=${encodeURIComponent(q)}`,
                        { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } }
                    );
                    setResults(await res.json());
                } catch {
                    setResults([]);
                } finally {
                    setSearching(false);
                }
            }, 300),
        []
    );

    const onSearchChange = (value) => {
        setSearch(value);
        setSearching(value.trim().length >= 2);
        runSearch(value);
    };

    const addProduct = (productId) =>
        mutate(`${base}/${addModal.family.id}/products`, 'POST', { product_id: productId });

    const removeProduct = (family, product) => {
        if (!confirm(`Remove “${product.label}” from “${family.name}”?`)) return;
        mutate(`${base}/${family.id}/products/${product.id}`, 'DELETE');
    };

    const setDefault = (family, productId) =>
        mutate(`${base}/${family.id}/default`, 'POST', { product_id: productId });

    const reorderProducts = (family, ids) => {
        setFamilies((prev) =>
            prev.map((f) =>
                f.id === family.id
                    ? { ...f, products: ids.map((id) => f.products.find((p) => p.id === id)) }
                    : f
            )
        );
        req(`${base}/${family.id}/products/reorder`, 'POST', { ids }).then((r) =>
            r.ok ? notify('Variant order saved') : notify('Reorder failed', 'error')
        );
    };

    /* render -------------------------------------------------------- */

    return (
        <DashboardLayout title="Variant Families">
            <Head title="Variant Families" />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-gray-900">Variant Families</div>
                    <p className="mt-1 max-w-2xl text-xs text-gray-500">
                        Group products that are the same range in different colours or sizes — every ARGILE tile,
                        every COCO tile. Each member keeps its own page, price and stock; the product page shows
                        the whole family as a picker. Drag to set the order shown to customers. A family needs 2+
                        live products before the picker appears.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setFormModal({ id: null, name: '', is_active: true })}
                    className="btn-primary"
                >
                    New Family
                </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-gray-500">
                <span>
                    <strong className="text-gray-900">{families.length}</strong> families
                </span>
                <span>
                    <strong className="text-gray-900">
                        {families.reduce((n, f) => n + f.products.length, 0)}
                    </strong>{' '}
                    grouped products
                </span>
                <span>
                    <strong className="text-gray-900">{ungroupedCount}</strong> ungrouped
                </span>
            </div>

            <div className="mt-4 space-y-3">
                {families.length ? (
                    families.map((family, i) => (
                        <FamilyCard
                            key={family.id}
                            family={family}
                            index={i}
                            onDragStart={(from) => {
                                dragFrom.current = from;
                            }}
                            onDragOver={(over) => {
                                dragOver.current = over;
                            }}
                            onDrop={handleFamilyDrop}
                            onToggleActive={toggleActive}
                            onEdit={(f) => setFormModal({ id: f.id, name: f.name, is_active: f.is_active })}
                            onDelete={(f) => setDeleteModal({ family: f, strategy: 'detach', target: '' })}
                            onAddProduct={(f) => {
                                setAddModal({ family: f });
                                setSearch('');
                                setResults([]);
                            }}
                            onSetDefault={setDefault}
                            onRemoveProduct={removeProduct}
                            onReorderProducts={reorderProducts}
                        />
                    ))
                ) : (
                    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                        <p className="text-xs text-gray-600">No variant families yet.</p>
                        <button
                            type="button"
                            onClick={() => setFormModal({ id: null, name: '', is_active: true })}
                            className="btn-primary mt-3"
                        >
                            + New Family
                        </button>
                    </div>
                )}
            </div>

            {/* New / Edit family */}
            <Modal
                open={!!formModal}
                onClose={() => setFormModal(null)}
                title={formModal?.id ? 'Edit Family' : 'New Family'}
                footer={
                    <>
                        <button type="button" onClick={() => setFormModal(null)} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="button" onClick={saveFamily} className="btn-primary">
                            {formModal?.id ? 'Save' : 'Create'}
                        </button>
                    </>
                }
            >
                <label className="block text-xs font-medium text-gray-700">Family Name</label>
                <input
                    autoFocus
                    type="text"
                    value={formModal?.name || ''}
                    onChange={(e) => setFormModal((f) => ({ ...f, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && saveFamily()}
                    placeholder="e.g. ARGILE"
                    className="admin-input mt-1 w-full"
                />
                {formModal?.id != null && (
                    <label className="mt-3 flex items-center gap-2 text-xs text-gray-700">
                        <input
                            type="checkbox"
                            checked={!!formModal.is_active}
                            onChange={(e) => setFormModal((f) => ({ ...f, is_active: e.target.checked }))}
                            className="rounded border-gray-300"
                        />
                        Active (inactive families are hidden on the storefront)
                    </label>
                )}
            </Modal>

            {/* Add product */}
            <Modal
                open={!!addModal}
                onClose={() => setAddModal(null)}
                wide
                title={`Add Product to “${addModal?.family?.name ?? ''}”`}
                footer={
                    <button type="button" onClick={() => setAddModal(null)} className="btn-primary">
                        Done
                    </button>
                }
            >
                <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search products by name or SKU…"
                    className="admin-input w-full"
                />
                <p className="mt-1.5 text-[11px] text-gray-500">
                    A product can only be in one family — adding one that’s already in another family moves it here.
                </p>

                <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-gray-200">
                    {searching && <div className="px-3 py-3 text-xs text-gray-500">Searching…</div>}
                    {!searching && search.trim().length >= 2 && !results.length && (
                        <div className="px-3 py-3 text-xs text-gray-500">No products found.</div>
                    )}
                    {!searching && search.trim().length < 2 && (
                        <div className="px-3 py-3 text-xs text-gray-500">Type at least 2 characters.</div>
                    )}
                    {results.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => addProduct(p.id)}
                            className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-medium text-gray-900">{p.name}</div>
                                <div className="truncate text-[11px] text-gray-500">
                                    {p.sku || '—'}
                                    {p.family && (
                                        <span className="ml-2 text-amber-600">currently in “{p.family}”</span>
                                    )}
                                </div>
                            </div>
                            <span className="flex-shrink-0 text-xs font-semibold text-gray-900">
                                ${Number(p.price || 0).toFixed(2)}
                            </span>
                        </button>
                    ))}
                </div>
            </Modal>

            {/* Delete family */}
            <Modal
                open={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title={`Delete “${deleteModal?.family?.name ?? ''}”`}
                footer={
                    <>
                        <button type="button" onClick={() => setDeleteModal(null)} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="btn-primary bg-red-600 hover:bg-red-700"
                        >
                            Delete Family
                        </button>
                    </>
                }
            >
                <p className="text-xs text-gray-700">
                    This family has <strong>{deleteModal?.family?.products?.length ?? 0}</strong> product(s). No
                    product is deleted — choose what happens to them.
                </p>

                <label className="mt-3 flex items-start gap-2 text-xs text-gray-700">
                    <input
                        type="radio"
                        name="vf-strategy"
                        checked={deleteModal?.strategy === 'detach'}
                        onChange={() => setDeleteModal((d) => ({ ...d, strategy: 'detach' }))}
                        className="mt-0.5"
                    />
                    <span>
                        <strong>Keep products independent</strong>
                        <br />
                        <span className="text-gray-500">They stop showing a variant picker.</span>
                    </span>
                </label>

                <label className="mt-2 flex items-start gap-2 text-xs text-gray-700">
                    <input
                        type="radio"
                        name="vf-strategy"
                        checked={deleteModal?.strategy === 'move'}
                        onChange={() => setDeleteModal((d) => ({ ...d, strategy: 'move' }))}
                        className="mt-0.5"
                    />
                    <span>
                        <strong>Move products to another family</strong>
                    </span>
                </label>

                {deleteModal?.strategy === 'move' && (
                    <select
                        value={deleteModal.target}
                        onChange={(e) => setDeleteModal((d) => ({ ...d, target: e.target.value }))}
                        className="admin-select mt-2 w-full"
                    >
                        <option value="">Select a family…</option>
                        {families
                            .filter((f) => f.id !== deleteModal.family.id)
                            .map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                    </select>
                )}
            </Modal>

            <Toast toast={toast} onDone={() => setToast(null)} />
        </DashboardLayout>
    );
}
