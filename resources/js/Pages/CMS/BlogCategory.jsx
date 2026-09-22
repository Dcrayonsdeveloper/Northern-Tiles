import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import BlogPostCard from '@/Components/CMS/BlogPostCard';

/**
 * Posts in one category.
 *
 * This page was a stub that returned null, so /blog/category/<slug> rendered a
 * blank white screen — the route answered 200 and the props arrived, there was
 * simply nothing to draw them with. Built to match the blog index: same wrapper,
 * same card, same pagination.
 */
export default function BlogCategory({ posts, categories = [], categorySlug }) {
    const items = posts?.data ?? [];
    const current = categories.find((c) => c.slug === categorySlug);
    const title = current?.name ?? categorySlug;

    return (
        <PublicLayout>
            <Head title={`${title} — Blog`} />

            <div className="mx-auto min-h-[calc(100vh-400px)] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <nav className="flex items-center gap-2 text-xs text-gray-500">
                    <Link href={route('blog.index')} className="hover:text-brand">Blog</Link>
                    <span>/</span>
                    <span className="text-gray-900">{title}</span>
                </nav>

                <h1 className="mt-2 font-heading text-3xl font-bold text-gray-900">{title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {posts?.total ?? items.length} article{(posts?.total ?? items.length) === 1 ? '' : 's'}
                </p>

                {/* Category switcher, so this page is not a dead end. */}
                {categories.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                        <Link
                            href={route('blog.index')}
                            className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                        >
                            All
                        </Link>
                        {categories.map((c) => (
                            <Link
                                key={c.slug}
                                href={route('blog.category', c.slug)}
                                className={`rounded-full px-4 py-1.5 text-sm transition ${
                                    c.slug === categorySlug
                                        ? 'bg-brand text-white'
                                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {c.name}
                            </Link>
                        ))}
                    </div>
                )}

                {items.length > 0 ? (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((post) => (
                            <BlogPostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-8 rounded-lg border border-dashed border-gray-300 py-16 text-center">
                        <p className="text-sm font-medium text-gray-700">Nothing published in {title} yet.</p>
                        <Link href={route('blog.index')} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
                            Back to all articles →
                        </Link>
                    </div>
                )}

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
            </div>
        </PublicLayout>
    );
}
