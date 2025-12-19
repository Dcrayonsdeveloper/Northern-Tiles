import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import BlogPostCard from '@/Components/CMS/BlogPostCard';

export default function Blog({ posts, categories = [], filters = {} }) {
    const [category, setCategory] = useState(filters.category || '');

    const handleCategoryChange = (slug) => {
        setCategory(slug);
        router.get(route('blog.index'), { category: slug || undefined }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const featuredPost = posts?.data?.[0];
    const regularPosts = posts?.data?.slice(1) || [];

    return (
        <PublicLayout>
            <Head title="Blog" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
                <p className="mt-2 text-gray-600">
                    Insights, tips, and stories from our team.
                </p>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => handleCategoryChange('')}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            !category
                                ? 'bg-brand text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryChange(cat.slug)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                category === cat.slug
                                    ? 'bg-brand text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Featured Post */}
            {featuredPost && !category && (
                <div className="mb-12">
                    <BlogPostCard post={featuredPost} variant="featured" />
                </div>
            )}

            {/* Posts Grid */}
            {regularPosts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {regularPosts.map((post) => (
                        <BlogPostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                    </svg>
                    <p className="mt-4 text-sm text-gray-500">No posts found.</p>
                </div>
            )}

            {/* Pagination */}
            {posts?.links && posts.links.length > 3 && (
                <div className="mt-12 flex flex-wrap justify-center gap-2">
                    {posts.links.map((link, idx) => (
                        link.url ? (
                            <Link
                                key={idx}
                                href={link.url}
                                preserveScroll
                                className={`rounded-md px-4 py-2 text-sm ${
                                    link.active
                                        ? 'bg-brand text-white'
                                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            </Link>
                        ) : (
                            <span
                                key={idx}
                                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-400"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        )
                    ))}
                </div>
            )}
        </PublicLayout>
    );
}
