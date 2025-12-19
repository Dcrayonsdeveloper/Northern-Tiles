import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

function CreateRedirectFromLogModal({ log, statusCodes, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        from_url: log.url.replace(/^\//, ''),
        to_url: '',
        status_code: '301',
        is_active: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.redirects.store'), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">Create Redirect</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Create a redirect from this 404 URL to fix the broken link.
                </p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">From URL</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                /
                            </span>
                            <input
                                type="text"
                                value={data.from_url}
                                onChange={(e) => setData('from_url', e.target.value)}
                                className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-brand focus:ring-brand"
                                required
                            />
                        </div>
                        {errors.from_url && <p className="mt-1 text-xs text-red-500">{errors.from_url}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">To URL</label>
                        <input
                            type="text"
                            value={data.to_url}
                            onChange={(e) => setData('to_url', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                            placeholder="/correct-page or https://example.com/page"
                            required
                        />
                        {errors.to_url && <p className="mt-1 text-xs text-red-500">{errors.to_url}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status Code</label>
                        <select
                            value={data.status_code}
                            onChange={(e) => setData('status_code', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                        >
                            {Object.entries(statusCodes).map(([code, label]) => (
                                <option key={code} value={code}>
                                    {code} - {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Redirect'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Index({ logs, statusCodes, filters, stats }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedLog, setSelectedLog] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.not-found-logs.index'), { search }, { preserveState: true });
    };

    const handleDelete = (log) => {
        if (!confirm('Are you sure you want to delete this log entry?')) return;
        router.delete(route('admin.not-found-logs.destroy', log.id));
    };

    const handleClearAll = () => {
        if (!confirm('Are you sure you want to clear all 404 logs? This action cannot be undone.')) return;
        router.delete(route('admin.not-found-logs.clear'));
    };

    const handleIgnore = (log) => {
        router.put(route('admin.not-found-logs.ignore', log.id));
    };

    return (
        <DashboardLayout>
            <Head title="404 Logs" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">404 Not Found Logs</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Track broken links and create redirects to fix them.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Logs
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500">Total 404s (Today)</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">{stats.today || 0}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500">Total 404s (Week)</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">{stats.week || 0}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500">Unique URLs</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">{stats.unique_urls || 0}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500">Top Referrer</div>
                        <div className="mt-1 truncate text-sm font-semibold text-gray-900">
                            {stats.top_referrer || 'Direct'}
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by URL or referrer..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                    Search
                </button>
            </form>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                URL
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Referrer
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Hits
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Last Seen
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Status
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {logs.data?.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-sm text-gray-900">{log.url}</span>
                                    {log.user_agent && (
                                        <div className="mt-1 max-w-xs truncate text-xs text-gray-400">
                                            {log.user_agent}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {log.referrer ? (
                                        <a
                                            href={log.referrer}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="max-w-xs truncate text-sm text-brand hover:underline"
                                        >
                                            {log.referrer}
                                        </a>
                                    ) : (
                                        <span className="text-sm text-gray-400">Direct</span>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                        {log.hit_count || 1}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {log.last_seen_at
                                        ? new Date(log.last_seen_at).toLocaleString()
                                        : new Date(log.created_at).toLocaleString()}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {log.is_ignored ? (
                                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                            Ignored
                                        </span>
                                    ) : log.redirect_created ? (
                                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                            Redirected
                                        </span>
                                    ) : (
                                        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                    <div className="flex items-center justify-end gap-2">
                                        {!log.redirect_created && !log.is_ignored && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedLog(log)}
                                                className="text-brand hover:text-brand/80"
                                            >
                                                Create Redirect
                                            </button>
                                        )}
                                        {!log.is_ignored && (
                                            <button
                                                type="button"
                                                onClick={() => handleIgnore(log)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                Ignore
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(log)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {(!logs.data || logs.data.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="mt-4 text-sm font-medium text-gray-900">No 404 errors logged</p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Great! Your site has no recorded broken links.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {logs.links && logs.links.length > 3 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {logs.from} to {logs.to} of {logs.total} logs
                    </p>
                    <div className="flex gap-1">
                        {logs.links.map((link, index) => (
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

            {selectedLog && (
                <CreateRedirectFromLogModal
                    log={selectedLog}
                    statusCodes={statusCodes || { 301: 'Permanent', 302: 'Temporary' }}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </DashboardLayout>
    );
}
