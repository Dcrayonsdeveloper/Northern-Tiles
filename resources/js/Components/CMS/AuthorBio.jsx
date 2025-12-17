import { Link } from '@inertiajs/react';

export default function AuthorBio({ author, variant = 'default', showSocial = true }) {
    if (!author) return null;

    const socialLinks = [
        { key: 'twitter', url: author.twitter_url, icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
        { key: 'linkedin', url: author.linkedin_url, icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
        { key: 'website', url: author.website_url, icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
    ].filter(link => link.url);

    if (variant === 'compact') {
        return (
            <div className="flex items-center gap-3">
                {author.avatar_url ? (
                    <img
                        src={author.avatar_url}
                        alt={author.name}
                        className="h-10 w-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.01-7.5 4.5V21h15v-2.25c0-2.49-3.36-4.5-7.5-4.5Z" />
                        </svg>
                    </div>
                )}
                <div>
                    <Link
                        href={route('blog.author', author.slug)}
                        className="text-sm font-semibold text-gray-900 hover:text-brand"
                    >
                        {author.name}
                    </Link>
                    {author.title && (
                        <p className="text-xs text-gray-500">{author.title}</p>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
                {/* Avatar */}
                {author.avatar_url ? (
                    <img
                        src={author.avatar_url}
                        alt={author.name}
                        className="mx-auto h-20 w-20 rounded-full object-cover"
                    />
                ) : (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                        <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.01-7.5 4.5V21h15v-2.25c0-2.49-3.36-4.5-7.5-4.5Z" />
                        </svg>
                    </div>
                )}

                {/* Name & Title */}
                <Link
                    href={route('blog.author', author.slug)}
                    className="mt-4 block text-lg font-semibold text-gray-900 hover:text-brand"
                >
                    {author.name}
                </Link>
                {author.title && (
                    <p className="mt-1 text-sm text-gray-500">{author.title}</p>
                )}

                {/* Short Bio */}
                {author.short_bio && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3">{author.short_bio}</p>
                )}

                {/* Social Links */}
                {showSocial && socialLinks.length > 0 && (
                    <div className="mt-4 flex justify-center gap-3">
                        {socialLinks.map(({ key, url, icon }) => (
                            <a
                                key={key}
                                href={url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-brand hover:text-brand"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d={icon} />
                                </svg>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Default variant - full bio box
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Avatar */}
                <div className="shrink-0">
                    {author.avatar_url ? (
                        <img
                            src={author.avatar_url}
                            alt={author.name}
                            className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
                        />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-500 sm:h-20 sm:w-20">
                            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.01-7.5 4.5V21h15v-2.25c0-2.49-3.36-4.5-7.5-4.5Z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('blog.author', author.slug)}
                            className="text-lg font-semibold text-gray-900 hover:text-brand"
                        >
                            {author.name}
                        </Link>
                        {author.is_verified && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verified
                            </span>
                        )}
                    </div>

                    {author.title && (
                        <p className="mt-1 text-sm text-gray-500">{author.title}</p>
                    )}

                    {/* Credentials / E-E-A-T */}
                    {author.credentials && (
                        <p className="mt-2 text-xs text-gray-500">{author.credentials}</p>
                    )}

                    {/* Bio */}
                    {author.bio && (
                        <p className="mt-3 text-sm text-gray-600">{author.bio}</p>
                    )}

                    {/* Social Links */}
                    {showSocial && socialLinks.length > 0 && (
                        <div className="mt-4 flex gap-3">
                            {socialLinks.map(({ key, url, icon }) => (
                                <a
                                    key={key}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:border-brand hover:text-brand"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d={icon} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
