import { Link } from '@inertiajs/react';

export default function BlogPostCard({ post, variant = 'default' }) {
    const publishedAt = post.published_at
        ? new Date(post.published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    if (variant === 'featured') {
        return (
            <article className="group relative overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="grid gap-0 md:grid-cols-2">
                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 md:aspect-auto">
                        {post.featured_image_url ? (
                            <img
                                src={post.featured_image_url}
                                alt={post.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                        ) : (
                            <div className="flex h-full min-h-[250px] w-full items-center justify-center text-gray-300">
                                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col justify-center p-6 md:p-8">
                        {/* Category */}
                        {post.category?.name && (
                            <Link
                                href={route('blog.category', post.category.slug)}
                                className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-brand hover:underline"
                            >
                                {post.category.name}
                            </Link>
                        )}

                        {/* Title */}
                        <Link
                            href={route('blog.show', post.slug)}
                            className="text-xl font-bold text-gray-900 hover:text-brand md:text-2xl"
                        >
                            {post.title}
                        </Link>

                        {/* Excerpt */}
                        {post.excerpt && (
                            <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                                {post.excerpt}
                            </p>
                        )}

                        {/* Meta */}
                        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                            {post.author && (
                                <Link
                                    href={route('author.show', post.author.slug)}
                                    className="flex items-center gap-2 hover:text-brand"
                                >
                                    {post.author.avatar_url && (
                                        <img
                                            src={post.author.avatar_url}
                                            alt={post.author.name}
                                            className="h-6 w-6 rounded-full object-cover"
                                        />
                                    )}
                                    <span className="font-medium">{post.author.name}</span>
                                </Link>
                            )}
                            {publishedAt && (
                                <time dateTime={post.published_at}>{publishedAt}</time>
                            )}
                            {post.reading_time && (
                                <span>{post.reading_time} min read</span>
                            )}
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    if (variant === 'compact') {
        return (
            <article className="group flex gap-4">
                {/* Image */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {post.featured_image_url ? (
                        <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <Link
                        href={route('blog.show', post.slug)}
                        className="text-sm font-semibold text-gray-900 group-hover:text-brand line-clamp-2"
                    >
                        {post.title}
                    </Link>
                    {publishedAt && (
                        <time dateTime={post.published_at} className="mt-1 block text-xs text-gray-500">
                            {publishedAt}
                        </time>
                    )}
                </div>
            </article>
        );
    }

    // Default variant
    return (
        <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            {/* Image */}
            <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                {post.featured_image_url ? (
                    <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Category Badge */}
                {post.category?.name && (
                    <Link
                        href={route('blog.category', post.category.slug)}
                        className="absolute left-3 top-3 rounded bg-brand px-2 py-1 text-xs font-semibold text-white hover:bg-brand/90"
                    >
                        {post.category.name}
                    </Link>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <Link
                    href={route('blog.show', post.slug)}
                    className="block text-base font-semibold text-gray-900 hover:text-brand line-clamp-2"
                >
                    {post.title}
                </Link>

                {/* Excerpt */}
                {post.excerpt && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {post.excerpt}
                    </p>
                )}

                {/* Meta */}
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                        {post.author && (
                            <Link
                                href={route('author.show', post.author.slug)}
                                className="flex items-center gap-1.5 hover:text-brand"
                            >
                                {post.author.avatar_url && (
                                    <img
                                        src={post.author.avatar_url}
                                        alt={post.author.name}
                                        className="h-5 w-5 rounded-full object-cover"
                                    />
                                )}
                                <span>{post.author.name}</span>
                            </Link>
                        )}
                    </div>
                    {publishedAt && (
                        <time dateTime={post.published_at}>{publishedAt}</time>
                    )}
                </div>
            </div>
        </article>
    );
}
