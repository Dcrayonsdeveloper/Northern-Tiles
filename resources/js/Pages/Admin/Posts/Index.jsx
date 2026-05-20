import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function Index({ posts, categories, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [category, setCategory] = useState(filters?.category_id || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.posts.index'), { search, status, category_id: category }, { preserveState: true });
    };

    const handleDelete = (post) => {
        if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;
        router.delete(route('admin.posts.destroy', post.id));
    };

    const getStatusBadge = (post) => {
        if (post.status === 'published') {
            return <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Published</span>;
        }
        if (post.status === 'draft') {
            return <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Draft</span>;
        }
        if (post.status === 'scheduled') {
            return <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Scheduled</span>;
        }
        return <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">{post.status}</span>;
    };

    return (
        <DashboardLayout>
            <Head title="Blog Posts" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage blog posts and articles.
                    </p>
                </div>
                <Link
                    href={route('admin.posts.create')}
                    className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Post
                </Link>
            </div>

            {/* Filters */}
            <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search posts..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => {
                        setCategory(e.target.value);
                        router.get(route('admin.posts.index'), { search, status, category_id: e.target.value }, { preserveState: true });
                    }}
                    className="rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                >
                    <option value="">All Categories</option>
                    {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        router.get(route('admin.posts.index'), { search, status: e.target.value, category }, { preserveState: true });
                    }}
                    className="rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                >
                    <option value="">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
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
                                Post
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Author
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Category
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Date
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {posts.data?.map((post) => (
                            <tr key={post.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {post.featured_image_url && (
                                            <img
                                                src={post.featured_image_url}
                                                alt=""
                                                className="h-10 w-10 rounded object-cover"
                                            />
                                        )}
                                        <div>
                                            <div className="font-semibold text-gray-900 line-clamp-1">{post.title}</div>
                                            <div className="text-xs text-gray-500">/blog/{post.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <span className="text-sm text-gray-600">
                                        {post.author?.name || '-'}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {post.category ? (
                                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                            {post.category.name}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    {getStatusBadge(post)}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {post.published_at
                                        ? new Date(post.published_at).toLocaleDateString()
                                        : new Date(post.created_at).toLocaleDateString()}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                    <div className="flex items-center justify-end gap-2">
                                        {post.status === 'published' && (
                                            <a
                                                href={`/blog/${post.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                View
                                            </a>
                                        )}
                                        <Link
                                            href={route('admin.posts.edit', post.id)}
                                            className="text-brand hover:text-brand/80"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(post)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {(!posts.data || posts.data.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                    <p className="mt-4 text-sm text-gray-500">No posts found.</p>
                                    <Link
                                        href={route('admin.posts.create')}
                                        className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand/80"
                                    >
                                        Create your first post
                                    </Link>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {posts.links && posts.links.length > 3 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {posts.from} to {posts.to} of {posts.total} posts
                    </p>
                    <div className="flex gap-1">
                        {posts.links.map((link, index) => (
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
