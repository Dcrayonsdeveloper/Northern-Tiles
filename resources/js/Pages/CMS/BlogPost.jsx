import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import MetaTags from '@/Components/SEO/MetaTags';
import SchemaOrg from '@/Components/SEO/SchemaOrg';
import AuthorBio from '@/Components/CMS/AuthorBio';
import BlogPostCard from '@/Components/CMS/BlogPostCard';

export default function BlogPost({ post, relatedPosts = [], seoMeta, articleSchema }) {
    const publishedAt = post.published_at
        ? new Date(post.published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    const updatedAt = post.updated_at && post.updated_at !== post.published_at
        ? new Date(post.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <PublicLayout>
            <MetaTags meta={seoMeta} />
            <SchemaOrg schema={articleSchema} />
            <Head title={post.title} />

            <article className="mx-auto max-w-3xl">
                {/* Breadcrumb */}
                <nav className="mb-6 text-sm">
                    <ol className="flex items-center gap-2 text-gray-500">
                        <li><Link href="/" className="hover:text-brand">Home</Link></li>
                        <li>/</li>
                        <li><Link href="/blog" className="hover:text-brand">Blog</Link></li>
                        {post.category && (
                            <>
                                <li>/</li>
                                <li>
                                    <Link href={route('blog.category', post.category.slug)} className="hover:text-brand">
                                        {post.category.name}
                                    </Link>
                                </li>
                            </>
                        )}
                    </ol>
                </nav>

                {/* Header */}
                <header className="mb-8">
                    {post.category && (
                        <Link
                            href={route('blog.category', post.category.slug)}
                            className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-brand hover:underline"
                        >
                            {post.category.name}
                        </Link>
                    )}

                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                        {post.title}
                    </h1>

                    {post.excerpt && (
                        <p className="mt-4 text-lg text-gray-600">
                            {post.excerpt}
                        </p>
                    )}

                    {/* Meta */}
                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {post.author && (
                            <Link
                                href={route('author.show', post.author.slug)}
                                className="flex items-center gap-2 hover:text-brand"
                            >
                                {post.author.avatar_url && (
                                    <img
                                        src={post.author.avatar_url}
                                        alt={post.author.name}
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                )}
                                <span className="font-medium">{post.author.name}</span>
                            </Link>
                        )}
                        {publishedAt && (
                            <time dateTime={post.published_at}>
                                Published {publishedAt}
                            </time>
                        )}
                        {updatedAt && (
                            <time dateTime={post.updated_at} className="text-gray-400">
                                (Updated {updatedAt})
                            </time>
                        )}
                        {post.reading_time && (
                            <span>{post.reading_time} min read</span>
                        )}
                    </div>
                </header>

                {/* Featured Image */}
                {post.featured_image_url && (
                    <div className="mb-8 overflow-hidden rounded-lg">
                        <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="h-auto w-full object-cover"
                        />
                        {post.featured_image_caption && (
                            <p className="mt-2 text-center text-sm text-gray-500">
                                {post.featured_image_caption}
                            </p>
                        )}
                    </div>
                )}

                {/* Content */}
                <div
                    className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-brand prose-img:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Sources / References (E-E-A-T) */}
                {post.sources_json && post.sources_json.length > 0 && (
                    <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
                        <h3 className="text-lg font-semibold text-gray-900">Sources & References</h3>
                        <ul className="mt-3 space-y-2">
                            {post.sources_json.map((source, idx) => (
                                <li key={idx} className="text-sm text-gray-600">
                                    {source.url ? (
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="text-brand hover:underline"
                                        >
                                            {source.title || source.url}
                                        </a>
                                    ) : (
                                        source.title
                                    )}
                                    {source.author && (
                                        <span className="text-gray-400"> - {source.author}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Reviewed By (E-E-A-T) */}
                {post.reviewed_by && (
                    <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Reviewed by <strong>{post.reviewed_by}</strong></span>
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <Link
                                key={tag.id || tag}
                                href={`/blog?tag=${tag.slug || tag}`}
                                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200"
                            >
                                {tag.name || tag}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Author Bio */}
                {post.author && (
                    <div className="mt-12 border-t border-gray-200 pt-8">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                            About the Author
                        </h3>
                        <AuthorBio author={post.author} />
                    </div>
                )}
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <div className="mt-16 border-t border-gray-200 pt-12">
                    <h2 className="text-xl font-bold text-gray-900">Related Posts</h2>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {relatedPosts.map((relatedPost) => (
                            <BlogPostCard key={relatedPost.id} post={relatedPost} />
                        ))}
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
