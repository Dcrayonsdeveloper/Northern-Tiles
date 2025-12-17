import { Head, Link, router } from '@inertiajs/react';
import { useState, Fragment } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

// Icons
function PlusIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

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

function EllipsisIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
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
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || styles.draft}`}>
            {labels[status] || status}
        </span>
    );
}

// Dropdown menu component
function ActionDropdown({ page, isTrashed, onDelete, onDuplicate, onArchive, onRestore, onForceDelete }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
                <EllipsisIcon className="h-5 w-5" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                        {!isTrashed ? (
                            <>
                                <Link
                                    href={route('admin.pages.edit', page.id)}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Edit
                                </Link>
                                {page.status === 'published' && (
                                    <a
                                        href={`/${page.full_slug || page.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        View Page
                                    </a>
                                )}
                                {page.status === 'draft' && page.preview_url && (
                                    <a
                                        href={page.preview_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Preview Draft
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setOpen(false); onDuplicate(page); }}
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Duplicate
                                </button>
                                {page.status !== 'archived' && (
                                    <button
                                        type="button"
                                        onClick={() => { setOpen(false); onArchive(page); }}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Archive
                                    </button>
                                )}
                                <hr className="my-1" />
                                <button
                                    type="button"
                                    onClick={() => { setOpen(false); onDelete(page); }}
                                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                    Move to Trash
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => { setOpen(false); onRestore(page); }}
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Restore
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setOpen(false); onForceDelete(page); }}
                                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                    Delete Permanently
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// Page row component with hierarchy indentation
function PageRow({ page, depth = 0, isTrashed, onDelete, onDuplicate, onArchive, onRestore, onForceDelete }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = page.children && page.children.length > 0;

    return (
        <Fragment>
            <tr className={`hover:bg-gray-50 ${isTrashed ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4">
                    <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={() => setExpanded(!expanded)}
                                className="mr-2 rounded p-0.5 hover:bg-gray-200"
                            >
                                <ChevronRightIcon className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                            </button>
                        ) : (
                            <span className="mr-2 w-5" />
                        )}
                        <div>
                            <div className="font-semibold text-gray-900">{page.title}</div>
                            <div className="text-xs text-gray-500">/{page.full_slug || page.slug}</div>
                        </div>
                    </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm text-gray-600">
                        {page.author?.name || '-'}
                    </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {page.template || 'default'}
                    </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={page.status} />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(page.updated_at).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                    <ActionDropdown
                        page={page}
                        isTrashed={isTrashed}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        onArchive={onArchive}
                        onRestore={onRestore}
                        onForceDelete={onForceDelete}
                    />
                </td>
            </tr>
            {expanded && hasChildren && page.children.map((child) => (
                <PageRow
                    key={child.id}
                    page={child}
                    depth={depth + 1}
                    isTrashed={isTrashed}
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

export default function Index({ pages, trashedPages, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [tab, setTab] = useState(filters?.trashed ? 'trash' : 'all');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.pages.index'), { search, status, trashed: tab === 'trash' ? 1 : 0 }, { preserveState: true });
    };

    const handleTabChange = (newTab) => {
        setTab(newTab);
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

    const currentPages = tab === 'trash' ? trashedPages : pages;
    const pagesList = currentPages?.data || currentPages || [];

    return (
        <DashboardLayout>
            <Head title="Pages" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage static pages for your site.
                    </p>
                </div>
                <Link
                    href={route('admin.pages.create')}
                    className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Page
                </Link>
            </div>

            {/* Tabs */}
            <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex gap-4">
                    <button
                        type="button"
                        onClick={() => handleTabChange('all')}
                        className={`border-b-2 px-1 pb-3 text-sm font-medium ${
                            tab === 'all'
                                ? 'border-brand text-brand'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        All Pages
                        {pages?.total && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">{pages.total}</span>}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('trash')}
                        className={`border-b-2 px-1 pb-3 text-sm font-medium ${
                            tab === 'trash'
                                ? 'border-brand text-brand'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Trash
                        {trashedPages?.length > 0 && (
                            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">{trashedPages.length}</span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Filters */}
            {tab === 'all' && (
                <form onSubmit={handleSearch} className="mb-6 flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search pages..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            router.get(route('admin.pages.index'), { search, status: e.target.value }, { preserveState: true });
                        }}
                        className="rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                    >
                        <option value="">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                        Search
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Page
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Author
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Template
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Updated
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {pagesList.map((page) => (
                            <PageRow
                                key={page.id}
                                page={page}
                                isTrashed={tab === 'trash'}
                                onDelete={handleDelete}
                                onDuplicate={handleDuplicate}
                                onArchive={handleArchive}
                                onRestore={handleRestore}
                                onForceDelete={handleForceDelete}
                            />
                        ))}

                        {pagesList.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <DocumentIcon className="mx-auto h-12 w-12 text-gray-300" />
                                    <p className="mt-4 text-sm text-gray-500">
                                        {tab === 'trash' ? 'Trash is empty.' : 'No pages found.'}
                                    </p>
                                    {tab === 'all' && (
                                        <Link
                                            href={route('admin.pages.create')}
                                            className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand/80"
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

            {/* Pagination */}
            {currentPages?.links && currentPages.links.length > 3 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {currentPages.from} to {currentPages.to} of {currentPages.total} pages
                    </p>
                    <div className="flex gap-1">
                        {currentPages.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`rounded-md px-3 py-1 text-sm ${
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
