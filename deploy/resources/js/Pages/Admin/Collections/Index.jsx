import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

function StatusBadge({ active }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
            active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function TypeBadge({ type }) {
    const styles = {
        manual: 'bg-blue-100 text-blue-700',
        automated: 'bg-purple-100 text-purple-700',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[type]}`}>
            {type === 'manual' ? 'Manual' : 'Automated'}
        </span>
    );
}

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

export default function Index({ collections, filters, types }) {
    const [search, setSearch] = useState(filters?.search || '');

    const debouncedSearch = useCallback(
        debounce((value) => {
            router.get(route('admin.collections.index'), { ...filters, search: value }, { preserveState: true, replace: true });
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
            route('admin.collections.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const destroy = (collection) => {
        if (!confirm(`Delete collection "${collection.title}"?`)) return;
        router.delete(route('admin.collections.destroy', collection.id));
    };

    return (
        <DashboardLayout title="Collections">
            <Head title="Collections" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Collections</div>
                <Link href={route('admin.collections.create')} className="btn-primary">
                    Create Collection
                </Link>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                    <input
                        type="text"
                        placeholder="Search collections..."
                        value={search}
                        onChange={handleSearchChange}
                        className="admin-input w-full"
                    />
                </div>
                <div>
                    <select
                        value={filters?.type || ''}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="admin-select w-full"
                    >
                        <option value="">All Types</option>
                        {types?.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        value={filters?.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="admin-select w-full"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Collection</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Type</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Products</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {collections?.data?.length ? (
                                collections.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {c.image_url ? (
                                                    <img
                                                        src={c.image_url}
                                                        alt={c.title}
                                                        className="h-10 w-10 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div>
                                                    <Link
                                                        href={route('admin.collections.edit', c.id)}
                                                        className="text-xs font-medium text-gray-900 hover:text-brand"
                                                    >
                                                        {c.title}
                                                    </Link>
                                                    <div className="text-[11px] text-gray-500">
                                                        /{c.handle}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <TypeBadge type={c.type} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {c.products_count} products
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge active={c.is_active} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={route('admin.collections.edit', c.id)}
                                                    className="btn-secondary text-xs px-2 py-1"
                                                    title="Edit"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(c)}
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
                                    <td className="px-4 py-10 text-center text-xs text-gray-600" colSpan={5}>
                                        No collections found. <Link href={route('admin.collections.create')} className="text-brand hover:underline">Create your first collection</Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={collections?.links} />
            </div>
        </DashboardLayout>
    );
}
