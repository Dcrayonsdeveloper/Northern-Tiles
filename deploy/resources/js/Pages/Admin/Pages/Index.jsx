import { Head, Link, router } from '@inertiajs/react';
import { useState, Fragment, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

// Icons
function ChevronRightIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}

function DocumentIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

// Status badge component
function StatusBadge({ status }) {
    const styles = {
        published: 'bg-green-100 text-green-800',
        draft: 'bg-yellow-100 text-yellow-800',
        scheduled: 'bg-blue-100 text-blue-800',
        archived: 'bg-gray-100 text-gray-800',
    };

    const labels = {
        published: 'Published',
        draft: 'Draft',
        scheduled: 'Scheduled',
        archived: 'Archived',
    };

    return (
        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${styles[status] || styles.draft}`}>
            {labels[status] || status}
        </span>
    );
}

// Bulk actions bar
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
                    Move to Trash
                </button>
            </div>
        </div>
    );
}

// Page row component with hierarchy indentation
function PageRow({ page, depth = 0, isTrashed, selectedIds, onToggleSelect, onDelete, onDuplicate, onArchive, onRestore, onForceDelete }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = page.children && page.children.length > 0;
    const isSelected = selectedIds.includes(page.id);

    return (
        <Fragment>
            <tr className={`hover:bg-gray-50/50 ${isTrashed ? 'opacity-60' : ''} ${isSelected ? 'bg-brand/5' : ''}`}>
                <td className="px-4 py-2 w-10">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                        checked={isSelected}
                        onChange={() => onToggleSelect(page.id)}
                    />
                </td>
                <td className="px-4 py-2">
                    <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={() => setExpanded(!expanded)}
                                className="mr-1.5 rounded p-0.5 hover:bg-gray-200"
                            >
                                <ChevronRightIcon className={`h-3 w-3 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                            </button>
                        ) : (
                            <span className="mr-1.5 w-4" />
                        )}
                        <div>
                            <Link
                                href={route('admin.pages.edit', page.id)}
                                className="text-xs font-medium text-gray-900 hover:text-brand"
                            >
                                {page.title}
                            </Link>
                            <div className="text-[10px] text-gray-500">/{page.full_slug || page.slug}</div>
                        </div>
                    </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                    <span className="text-xs text-gray-600">
                        {page.author?.name || '-'}
                    </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                    <span className="inline-flex rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-800">
                        {page.template || 'default'}
                    </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                    <StatusBadge status={page.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {new Date(page.updated_at).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                    <div className="flex items-center gap-1">
                        {!isTrashed ? (
                            <>
                                {page.status === 'published' && (
                                    <a
                                        href={`/page/${page.full_slug || page.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary text-xs px-2 py-1"
                                        title="View page"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </a>
                                )}
                                <Link
                                    href={route('admin.pages.edit', page.id)}
                                    className="btn-secondary text-xs px-2 py-1"
                                    title="Edit"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => onDuplicate(page)}
                                    className="btn-secondary text-xs px-2 py-1"
                                    title="Duplicate"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(page)}
                                    className="btn-secondary text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                                    title="Move to trash"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onRestore(page)}
                                    className="btn-secondary text-xs px-2 py-1"
                                    title="Restore"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onForceDelete(page)}
                                    className="btn-secondary text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                                    title="Delete permanently"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
            {expanded && hasChildren && page.children.map((child) => (
                <PageRow
                    key={child.id}
                    page={child}
                    depth={depth + 1}
                    isTrashed={isTrashed}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onArchive={onArchive}
                    onRestore={onRestore}
                    onForceDelete={onForceDelete}
                />
            ))}
        </Fragment>
    );
}

// Helper to flatten pages for selection
function flattenPages(pages) {
    let result = [];
    for (const page of pages) {
        result.push(page);
        if (page.children?.length) {
            result = result.concat(flattenPages(page.children));
        }
    }
    return result;
}

export default function Index({ pages, trashedPages, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [tab, setTab] = useState(filters?.trashed ? 'trash' : 'all');
    const [selectedIds, setSelectedIds] = useState([]);

    const currentPages = tab === 'trash' ? trashedPages : pages;
    const pagesList = currentPages?.data || currentPages || [];

    const allPageIds = useMemo(() => flattenPages(pagesList).map(p => p.id), [pagesList]);
    const allSelected = allPageIds.length > 0 && selectedIds.length === allPageIds.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < allPageIds.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allPageIds);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.pages.index'), { search, status, trashed: tab === 'trash' ? 1 : 0 }, { preserveState: true });
    };

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setSelectedIds([]);
        router.get(route('admin.pages.index'), { search, status, trashed: newTab === 'trash' ? 1 : 0 }, { preserveState: true });
    };

    const handleDelete = (page) => {
        if (!confirm(`Are you sure you want to move "${page.title}" to trash?`)) return;
        router.delete(route('admin.pages.destroy', page.id));
    };

    const handleDuplicate = (page) => {
        if (!confirm(`Duplicate "${page.title}"?`)) return;
        router.post(route('admin.pages.duplicate', page.id));
    };

    const handleArchive = (page) => {
        if (!confirm(`Archive "${page.title}"?`)) return;
        router.post(route('admin.pages.archive', page.id));
    };

    const handleRestore = (page) => {
        router.post(route('admin.pages.restore', page.id));
    };

    const handleForceDelete = (page) => {
        if (!confirm(`Are you sure you want to permanently delete "${page.title}"? This cannot be undone.`)) return;
        router.delete(route('admin.pages.forceDelete', page.id));
    };

    const bulkDelete = () => {
        if (!confirm(`Move ${selectedIds.length} pages to trash?`)) return;
        router.post(route('admin.pages.bulk-delete'), { ids: selectedIds }, {
            onSuccess: () => setSelectedIds([]),
        });
    };

    const bulkStatusChange = (newStatus) => {
        if (!confirm(`Change status of ${selectedIds.length} pages to "${newStatus}"?`)) return;
        router.post(route('admin.pages.bulk-status'), { ids: selectedIds, status: newStatus }, {
            onSuccess: () => setSelectedIds([]),
        });
    };

    return (
        <DashboardLayout title="Pages">
            <Head title="Pages" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Pages</div>
                <Link
                    href={route('admin.pages.create')}
                    className="btn-primary"
                >
                    New Page
                </Link>
            </div>

            {/* Tabs */}
            <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex gap-4">
                    <button
                        type="button"
                        onClick={() => handleTabChange('all')}
                        className={`border-b-2 px-1 pb-2 text-xs font-medium ${
                            tab === 'all'
                                ? 'border-brand text-brand'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        All Pages
                        {pages?.total > 0 && <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px]">{pages.total}</span>}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('trash')}
                        className={`border-b-2 px-1 pb-2 text-xs font-medium ${
                            tab === 'trash'
                                ? 'border-brand text-brand'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Trash
                        {trashedPages?.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-600">{trashedPages.length}</span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Filters */}
            {tab === 'all' && (
                <form onSubmit={handleSearch} className="mt-4 flex gap-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search pages..."
                            className="block w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            router.get(route('admin.pages.index'), { search, status: e.target.value }, { preserveState: true });
                        }}
                        className="rounded-md border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                    >
                        <option value="">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                    </select>
                    <button
                        type="submit"
                        className="btn-secondary"
                    >
                        Search
                    </button>
                </form>
            )}

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
                                <th className="px-4 py-2 w-10">
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
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">
                                    Page
                                </th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">
                                    Author
                                </th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">
                                    Template
                                </th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">
                                    Status
                                </th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">
                                    Updated
                                </th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pagesList.map((page) => (
                                <PageRow
                                    key={page.id}
                                    page={page}
                                    isTrashed={tab === 'trash'}
                                    selectedIds={selectedIds}
                                    onToggleSelect={toggleSelect}
                                    onDelete={handleDelete}
                                    onDuplicate={handleDuplicate}
                                    onArchive={handleArchive}
                                    onRestore={handleRestore}
                                    onForceDelete={handleForceDelete}
                                />
                            ))}

                            {pagesList.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center">
                                        <DocumentIcon className="mx-auto h-10 w-10 text-gray-300" />
                                        <p className="mt-3 text-xs text-gray-500">
                                            {tab === 'trash' ? 'Trash is empty.' : 'No pages found.'}
                                        </p>
                                        {tab === 'all' && (
                                            <Link
                                                href={route('admin.pages.create')}
                                                className="mt-3 inline-block text-xs font-semibold text-brand hover:text-brand/80"
                                            >
                                                Create your first page
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {currentPages?.links && currentPages.links.length > 3 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Showing {currentPages.from} to {currentPages.to} of {currentPages.total} pages
                    </p>
                    <div className="flex gap-1">
                        {currentPages.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-md px-2 py-1 text-xs ${
                                    link.active
                                        ? 'bg-brand text-white'
                                        : link.url
                                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveState
                            />
                        ))}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
