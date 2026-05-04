import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';

function Pagination({ links }) {
    if (!links?.length) return null;

    return (
        <div className="flex flex-wrap gap-2 p-3">
            {links.map((l, idx) => (
                <Link
                    key={idx}
                    href={l.url ?? '#'}
                    preserveScroll
                    className={
                        (l.active
                            ? 'bg-brand text-white border-brand'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-brand/10 hover:text-brand') +
                        ' rounded-md border px-2.5 py-1.5 text-xs font-medium' +
                        (!l.url ? ' pointer-events-none opacity-50' : '')
                    }
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        draft: 'bg-gray-100 text-gray-700',
        published: 'bg-green-100 text-green-700',
        scheduled: 'bg-blue-100 text-blue-700',
        archived: 'bg-red-100 text-red-700',
    };

    const labels = {
        draft: 'Draft',
        published: 'Published',
        scheduled: 'Scheduled',
        archived: 'Archived',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status] || styles.draft}`}>
            {labels[status] || status}
        </span>
    );
}

function BulkActionsBar({ selectedCount, onDelete, onStatusChange, onClear }) {
    return (
        <div className="flex items-center justify-between rounded-lg bg-brand/5 border border-brand/20 px-4 py-2">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-brand">
                    {selectedCount} selected
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    className="text-xs text-gray-500 hover:text-gray-700"
                >
                    Clear selection
                </button>
            </div>
            <div className="flex items-center gap-2">
                <select
                    onChange={(e) => {
                        if (e.target.value) {
                            onStatusChange(e.target.value);
                            e.target.value = '';
                        }
                    }}
                    className="admin-select text-xs py-1"
                    defaultValue=""
                >
                    <option value="">Change Status</option>
                    <option value="published">Publish</option>
                    <option value="draft">Set as Draft</option>
                    <option value="archived">Archive</option>
                </select>
                <button
                    type="button"
                    onClick={onDelete}
                    className="btn-secondary text-red-600 hover:bg-red-50 text-xs px-3 py-1"
                >
                    Delete Selected
                </button>
            </div>
        </div>
    );
}

export default function Index({ products, filters, categories, vendors, statuses }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedIds, setSelectedIds] = useState([]);

    const productIds = useMemo(() => products?.data?.map(p => p.id) || [], [products?.data]);
    const allSelected = productIds.length > 0 && selectedIds.length === productIds.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < productIds.length;

    const debouncedSearch = useCallback(
        debounce((value) => {
            router.get(route('admin.products.index'), { ...filters, search: value }, { preserveState: true, replace: true });
        }, 300),
        [filters]
    );

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        debouncedSearch(value);
    };

    const handleFilterChange = (key, value) => {
        router.get(
            route('admin.products.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(productIds);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const destroy = (product) => {
        if (!confirm(`Delete product "${product.name}"?`)) return;
        router.delete(route('admin.products.destroy', product.id));
    };

    const duplicate = (product) => {
        if (!confirm(`Duplicate product "${product.name}"?`)) return;
        router.post(route('admin.products.duplicate', product.id));
    };

    const bulkDelete = () => {
        if (!confirm(`Delete ${selectedIds.length} selected products?`)) return;
        router.post(route('admin.products.bulk-delete'), { ids: selectedIds }, {
            onSuccess: () => setSelectedIds([]),
        });
    };

    const bulkStatusChange = (status) => {
        if (!confirm(`Change status of ${selectedIds.length} products to "${status}"?`)) return;
        router.post(route('admin.products.bulk-status'), { ids: selectedIds, status }, {
            onSuccess: () => setSelectedIds([]),
        });
    };

    return (
        <DashboardLayout title="Products">
            <Head title="Products" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Products</div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('admin.products.import-template')}
                        className="btn-secondary"
                    >
                        Download Template
                    </Link>
                    <Link
                        href={route('admin.products.create')}
                        className="btn-primary"
                    >
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={handleSearchChange}
                        className="admin-input w-full"
                    />
                </div>
                <div>
                    <select
                        value={filters?.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="admin-select w-full"
                    >
                        <option value="">All Statuses</option>
                        {statuses?.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        value={filters?.category_id || ''}
                        onChange={(e) => handleFilterChange('category_id', e.target.value)}
                        className="admin-select w-full"
                    >
                        <option value="">All Categories</option>
                        {categories?.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        value={filters?.vendor_id || ''}
                        onChange={(e) => handleFilterChange('vendor_id', e.target.value)}
                        className="admin-select w-full"
                    >
                        <option value="">All Vendors</option>
                        {vendors?.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="mt-4">
                    <BulkActionsBar
                        selectedCount={selectedIds.length}
                        onDelete={bulkDelete}
                        onStatusChange={bulkStatusChange}
                        onClear={() => setSelectedIds([])}
                    />
                </div>
            )}

            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto" style={{ minHeight: '500px' }}>
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="w-12 px-4 py-2">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected;
                                        }}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Product</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Inventory</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Price</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Vendor</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products?.data?.length ? (
                                products.data.map((p) => (
                                    <tr key={p.id} className={`hover:bg-gray-50/50 ${selectedIds.includes(p.id) ? 'bg-brand/5' : ''}`}>
                                        <td className="px-4 py-2">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                                checked={selectedIds.includes(p.id)}
                                                onChange={() => toggleSelect(p.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                {p.media?.[0]?.url ? (
                                                    <img
                                                        src={p.media[0].url}
                                                        alt={p.name}
                                                        className="h-10 w-10 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div>
                                                    <Link
                                                        href={route('admin.products.edit', p.id)}
                                                        className="text-xs font-medium text-gray-900 hover:text-brand"
                                                    >
                                                        {p.name}
                                                    </Link>
                                                    <div className="text-[11px] text-gray-500">
                                                        {p.sku || 'No SKU'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-600">
                                            {p.inventory_quantity ?? 0} in stock
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="text-xs font-medium text-gray-900">
                                                ${parseFloat(p.price || 0).toFixed(2)}
                                            </div>
                                            {p.compare_at_price && (
                                                <div className="text-[11px] text-gray-500 line-through">
                                                    ${parseFloat(p.compare_at_price).toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-600">
                                            {p.seller?.name || '-'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-1">
                                                {p.slug && (
                                                    <a
                                                        href={`/products/${p.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-secondary text-xs px-2 py-1"
                                                        title="View on storefront"
                                                    >
                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </a>
                                                )}
                                                <Link
                                                    href={route('admin.products.edit', p.id)}
                                                    className="btn-secondary text-xs px-2 py-1"
                                                    title="Edit"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => duplicate(p)}
                                                    className="btn-secondary text-xs px-2 py-1"
                                                    title="Duplicate"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(p)}
                                                    className="btn-secondary text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                                                    title="Delete"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="px-4 py-10 text-center text-xs text-gray-600" colSpan={7}>
                                        No products found. <Link href={route('admin.products.create')} className="text-brand hover:underline">Create your first product</Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={products?.links} />
            </div>
        </DashboardLayout>
    );
}
