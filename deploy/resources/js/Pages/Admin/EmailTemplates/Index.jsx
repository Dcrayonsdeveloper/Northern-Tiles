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
        transactional: 'bg-blue-100 text-blue-700',
        marketing: 'bg-green-100 text-green-700',
        abandoned_cart: 'bg-purple-100 text-purple-700',
        notification: 'bg-yellow-100 text-yellow-700',
    };
    const labels = {
        transactional: 'Transactional',
        marketing: 'Marketing',
        abandoned_cart: 'Abandoned Cart',
        notification: 'Notification',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
            {labels[type] || type}
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
                        (l.active ? 'bg-brand text-white border-brand' : 'bg-white text-gray-700 border-gray-200 hover:bg-brand/10') +
                        ' rounded-md border px-2.5 py-1.5 text-xs font-medium' +
                        (!l.url ? ' pointer-events-none opacity-50' : '')
                    }
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </div>
    );
}

export default function Index({ templates, filters, types }) {
    const [search, setSearch] = useState(filters?.search || '');

    const debouncedSearch = useCallback(
        debounce((value) => {
            router.get(route('admin.email-templates.index'), { ...filters, search: value }, { preserveState: true, replace: true });
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
            route('admin.email-templates.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const destroy = (template) => {
        if (!confirm(`Delete template "${template.name}"?`)) return;
        router.delete(route('admin.email-templates.destroy', template.id));
    };

    return (
        <DashboardLayout title="Email Templates">
            <Head title="Email Templates" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Email Templates</div>
                <Link href={route('admin.email-templates.create')} className="btn-primary">
                    Create Template
                </Link>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <input
                        type="text"
                        placeholder="Search templates..."
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
                        {Object.entries(types || {}).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Template</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Type</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Subject</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {templates?.data?.length ? (
                                templates.data.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-medium text-gray-900">{t.name}</div>
                                            <div className="text-[11px] text-gray-500">{t.key}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <TypeBadge type={t.type} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                                            {t.subject}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge active={t.is_active} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={route('admin.email-templates.preview', t.id)}
                                                    className="btn-secondary text-xs px-2 py-1"
                                                    title="Preview"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                <Link
                                                    href={route('admin.email-templates.edit', t.id)}
                                                    className="btn-secondary text-xs px-2 py-1"
                                                    title="Edit"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(t)}
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
                                        No email templates found. <Link href={route('admin.email-templates.create')} className="text-brand hover:underline">Create your first template</Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={templates?.links} />
            </div>
        </DashboardLayout>
    );
}
