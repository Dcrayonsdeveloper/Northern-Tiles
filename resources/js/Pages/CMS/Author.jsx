import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import MetaTags from '@/Components/SEO/MetaTags';
import SchemaOrg from '@/Components/SEO/SchemaOrg';
import BlogPostCard from '@/Components/CMS/BlogPostCard';

export default function Author({ author, posts, seoMeta, personSchema }) {
    const socialLinks = [
        { key: 'twitter', url: author.twitter_url, label: 'Twitter', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
        { key: 'linkedin', url: author.linkedin_url, label: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
        { key: 'website', url: author.website_url, label: 'Website', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
    ].filter(link => link.url);

    return (
        <PublicLayout>
            <MetaTags meta={seoMeta} />
            <SchemaOrg schema={personSchema} />
            <Head title={author.name} />

            {/* Author Header */}
            <div className="mb-12 rounded-xl bg-gray-50 p-6 sm:p-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    {/* Avatar */}
                    <div className="shrink-0">
                        {author.avatar_url ? (
                            <img
                                src={author.avatar_url}
                                alt={author.name}
                                className="h-24 w-24 rounded-full object-cover sm:h-32 sm:w-32"
                            />
                        ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-gray-500 sm:h-32 sm:w-32">
                                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.01-7.5 4.5V21h15v-2.25c0-2.49-3.36-4.5-7.5-4.5Z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                {author.name}
                            </h1>
                            {author.is_verified && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                    <svg className="mr-1 h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                </span>
                            )}
                        </div>

                        {author.title && (
                            <p className="mt-1 text-lg text-gray-600">{author.title}</p>
                        )}

                        {/* Credentials (E-E-A-T) */}
                        {author.credentials && (
                            <p className="mt-2 text-sm text-gray-500">{author.credentials}</p>
                        )}

                        {/* Bio */}
                        {author.bio && (
                            <p className="mt-4 text-gray-600 leading-relaxed">{author.bio}</p>
                        )}

                        {/* Expertise Areas */}
                        {author.expertise_areas && author.expertise_areas.length > 0 && (
                            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                                {author.expertise_areas.map((area, idx) => (
                                    <span
                                        key={idx}
                                        className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand"
                                    >
                                        {area}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Social Links */}
                        {socialLinks.length > 0 && (
                            <div className="mt-6 flex justify-center gap-4 sm:justify-start">
                                {socialLinks.map(({ key, url, label, icon }) => (
                                    <a
                                        key={key}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-brand hover:text-brand"
                                        title={label}
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d={icon} />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Posts by Author */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">
                    Articles by {author.name}
                </h2>

                {posts?.data && posts.data.length > 0 ? (
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.data.map((post) => (
                            <BlogPostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="mt-6 py-12 text-center">
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
                        <p className="mt-4 text-sm text-gray-500">No articles published yet.</p>
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
            </div>
        </PublicLayout>
    );
}
