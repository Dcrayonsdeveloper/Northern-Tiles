import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

function EditSeoModal({ seoMeta, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        meta_title: seoMeta.meta_title || '',
        meta_description: seoMeta.meta_description || '',
        meta_keywords: seoMeta.meta_keywords || '',
        og_title: seoMeta.og_title || '',
        og_description: seoMeta.og_description || '',
        og_image: seoMeta.og_image || '',
        canonical_url: seoMeta.canonical_url || '',
        robots: seoMeta.robots || 'index, follow',
        schema_markup: seoMeta.schema_markup || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.seo-meta.update', seoMeta.id), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">Edit SEO Meta</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Edit SEO metadata for: <span className="font-mono">{seoMeta.url_path}</span>
                </p>
                <form onSubmit={handleSubmit} className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                            <input
                                type="text"
                                value={data.meta_title}
                                onChange={(e) => setData('meta_title', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Page title for search engines"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {data.meta_title.length}/60 characters
                            </p>
                            {errors.meta_title && <p className="mt-1 text-xs text-red-500">{errors.meta_title}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                            <textarea
                                value={data.meta_description}
                                onChange={(e) => setData('meta_description', e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Brief description for search results"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {data.meta_description.length}/160 characters
                            </p>
                            {errors.meta_description && <p className="mt-1 text-xs text-red-500">{errors.meta_description}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Meta Keywords</label>
                            <input
                                type="text"
                                value={data.meta_keywords}
                                onChange={(e) => setData('meta_keywords', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="keyword1, keyword2, keyword3"
                            />
                            {errors.meta_keywords && <p className="mt-1 text-xs text-red-500">{errors.meta_keywords}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">OG Title</label>
                            <input
                                type="text"
                                value={data.og_title}
                                onChange={(e) => setData('og_title', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Title for social sharing"
                            />
                            {errors.og_title && <p className="mt-1 text-xs text-red-500">{errors.og_title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">OG Image URL</label>
                            <input
                                type="text"
                                value={data.og_image}
                                onChange={(e) => setData('og_image', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="https://example.com/image.jpg"
                            />
                            {errors.og_image && <p className="mt-1 text-xs text-red-500">{errors.og_image}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">OG Description</label>
                            <textarea
                                value={data.og_description}
                                onChange={(e) => setData('og_description', e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Description for social sharing"
                            />
                            {errors.og_description && <p className="mt-1 text-xs text-red-500">{errors.og_description}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Canonical URL</label>
                            <input
                                type="text"
                                value={data.canonical_url}
                                onChange={(e) => setData('canonical_url', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="https://example.com/canonical-page"
                            />
                            {errors.canonical_url && <p className="mt-1 text-xs text-red-500">{errors.canonical_url}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Robots</label>
                            <select
                                value={data.robots}
                                onChange={(e) => setData('robots', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                            >
                                <option value="index, follow">Index, Follow</option>
                                <option value="index, nofollow">Index, Nofollow</option>
                                <option value="noindex, follow">Noindex, Follow</option>
                                <option value="noindex, nofollow">Noindex, Nofollow</option>
                            </select>
                            {errors.robots && <p className="mt-1 text-xs text-red-500">{errors.robots}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Schema Markup (JSON-LD)</label>
                            <textarea
                                value={data.schema_markup}
                                onChange={(e) => setData('schema_markup', e.target.value)}
                                rows={4}
                                className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-brand focus:ring-brand"
                                placeholder='{"@context": "https://schema.org", ...}'
                            />
                            {errors.schema_markup && <p className="mt-1 text-xs text-red-500">{errors.schema_markup}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
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
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CreateSeoModal({ onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        url_path: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        og_title: '',
        og_description: '',
        og_image: '',
        canonical_url: '',
        robots: 'index, follow',
        schema_markup: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.seo-meta.store'), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">Add Custom SEO Meta</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Override SEO metadata for a specific URL path.
                </p>
                <form onSubmit={handleSubmit} className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">URL Path</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                /
                            </span>
                            <input
                                type="text"
                                value={data.url_path}
                                onChange={(e) => setData('url_path', e.target.value)}
                                className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-brand focus:ring-brand"
                                placeholder="page-path or products/category"
                                required
                            />
                        </div>
                        {errors.url_path && <p className="mt-1 text-xs text-red-500">{errors.url_path}</p>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                            <input
                                type="text"
                                value={data.meta_title}
                                onChange={(e) => setData('meta_title', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Page title for search engines"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {data.meta_title.length}/60 characters
                            </p>
                            {errors.meta_title && <p className="mt-1 text-xs text-red-500">{errors.meta_title}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                            <textarea
                                value={data.meta_description}
                                onChange={(e) => setData('meta_description', e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Brief description for search results"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {data.meta_description.length}/160 characters
                            </p>
                            {errors.meta_description && <p className="mt-1 text-xs text-red-500">{errors.meta_description}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Robots</label>
                            <select
                                value={data.robots}
                                onChange={(e) => setData('robots', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                            >
                                <option value="index, follow">Index, Follow</option>
                                <option value="index, nofollow">Index, Nofollow</option>
                                <option value="noindex, follow">Noindex, Follow</option>
                                <option value="noindex, nofollow">Noindex, Nofollow</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Canonical URL</label>
                            <input
                                type="text"
                                value={data.canonical_url}
                                onChange={(e) => setData('canonical_url', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Optional canonical URL"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
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
                            {processing ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Index({ seoMeta, stats, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingMeta, setEditingMeta] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.seo-meta.index'), { search }, { preserveState: true });
    };

    const handleDelete = (meta) => {
        if (!confirm('Are you sure you want to delete this SEO meta override?')) return;
        router.delete(route('admin.seo-meta.destroy', meta.id));
    };

    const getSeoScore = (meta) => {
        let score = 0;
        if (meta.meta_title && meta.meta_title.length >= 30 && meta.meta_title.length <= 60) score += 25;
        else if (meta.meta_title) score += 10;

        if (meta.meta_description && meta.meta_description.length >= 120 && meta.meta_description.length <= 160) score += 25;
        else if (meta.meta_description) score += 10;

        if (meta.og_title && meta.og_image) score += 25;
        else if (meta.og_title || meta.og_image) score += 10;

        if (meta.schema_markup) score += 25;

        return score;
    };

    const getScoreBadge = (score) => {
        if (score >= 80) {
            return <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">{score}%</span>;
        }
        if (score >= 50) {
            return <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">{score}%</span>;
        }
        return <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">{score}%</span>;
    };

    return (
        <DashboardLayout>
            <Head title="SEO Meta" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">SEO Meta Overrides</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage custom SEO metadata for specific pages.
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
                    Add SEO Override
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500">Total Overrides</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total || 0}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500">Avg SEO Score</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">{stats.avg_score || 0}%</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500">With Schema</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">{stats.with_schema || 0}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-500">Noindex Pages</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">{stats.noindex || 0}</div>
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
                        placeholder="Search by URL path..."
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
                                URL Path
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Meta Title
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Robots
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Score
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Features
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {seoMeta?.data?.map((meta) => (
                            <tr key={meta.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-sm text-gray-900">/{meta.url_path}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="max-w-xs truncate text-sm text-gray-900">
                                        {meta.meta_title || <span className="text-gray-400">Not set</span>}
                                    </div>
                                    {meta.meta_description && (
                                        <div className="mt-1 max-w-xs truncate text-xs text-gray-500">
                                            {meta.meta_description}
                                        </div>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {meta.robots?.includes('noindex') ? (
                                        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                            Noindex
                                        </span>
                                    ) : (
                                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                            Index
                                        </span>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {getScoreBadge(getSeoScore(meta))}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        {meta.og_image && (
                                            <span className="inline-flex rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700" title="Has OG Image">
                                                OG
                                            </span>
                                        )}
                                        {meta.schema_markup && (
                                            <span className="inline-flex rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700" title="Has Schema">
                                                Schema
                                            </span>
                                        )}
                                        {meta.canonical_url && (
                                            <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700" title="Has Canonical">
                                                Canon
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingMeta(meta)}
                                            className="text-brand hover:text-brand/80"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(meta)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {(!seoMeta?.data || seoMeta.data.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <p className="mt-4 text-sm text-gray-500">No custom SEO meta overrides found.</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-4 text-sm font-semibold text-brand hover:text-brand/80"
                                    >
                                        Add your first SEO override
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {seoMeta?.links && seoMeta.links.length > 3 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {seoMeta.from} to {seoMeta.to} of {seoMeta.total} entries
                    </p>
                    <div className="flex gap-1">
                        {seoMeta.links.map((link, index) => (
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
                <CreateSeoModal onClose={() => setShowCreateModal(false)} />
            )}

            {editingMeta && (
                <EditSeoModal seoMeta={editingMeta} onClose={() => setEditingMeta(null)} />
            )}
        </DashboardLayout>
    );
}
