import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

function CreateRedirectModal({ statusCodes, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        from_url: '',
        to_url: '',
        status_code: '301',
        is_active: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.redirects.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">Create Redirect</h2>
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
                                placeholder="old-page-url"
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
                            placeholder="/new-page-url or https://example.com/page"
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

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded border-gray-300 text-brand focus:ring-brand"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
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

export default function Index({ redirects, statusCodes, filters }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.redirects.index'), { search }, { preserveState: true });
    };

    const handleDelete = (redirect) => {
        if (!confirm(`Are you sure you want to delete this redirect?`)) return;
        router.delete(route('admin.redirects.destroy', redirect.id));
    };

    const handleToggleActive = (redirect) => {
        router.put(route('admin.redirects.update', redirect.id), {
            ...redirect,
            is_active: !redirect.is_active,
        }, { preserveState: true });
    };

    const getStatusBadge = (code) => {
        if (code === 301) {
            return <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">301 Permanent</span>;
        }
        if (code === 302) {
            return <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">302 Temporary</span>;
        }
        return <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">{code}</span>;
    };

    return (
        <DashboardLayout>
            <Head title="Redirects" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Redirects</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage URL redirects for SEO and broken links.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Redirect
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search redirects..."
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
                                From
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                To
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Hits
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Active
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {redirects.data?.map((redirect) => (
                            <tr key={redirect.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-sm text-gray-900">/{redirect.from_url}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-mono text-sm text-gray-600">{redirect.to_url}</span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {getStatusBadge(redirect.status_code)}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {redirect.hit_count || 0}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleActive(redirect)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            redirect.is_active ? 'bg-brand' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                redirect.is_active ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(redirect)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {(!redirects.data || redirects.data.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <p className="mt-4 text-sm text-gray-500">No redirects found.</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-4 text-sm font-semibold text-brand hover:text-brand/80"
                                    >
                                        Create your first redirect
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {redirects.links && redirects.links.length > 3 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {redirects.from} to {redirects.to} of {redirects.total} redirects
                    </p>
                    <div className="flex gap-1">
                        {redirects.links.map((link, index) => (
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

            {showCreateModal && (
                <CreateRedirectModal
                    statusCodes={statusCodes}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </DashboardLayout>
    );
}
