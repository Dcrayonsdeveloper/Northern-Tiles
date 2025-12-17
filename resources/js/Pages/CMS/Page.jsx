import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import MetaTags from '@/Components/SEO/MetaTags';
import SchemaOrg from '@/Components/SEO/SchemaOrg';
import AuthorBio from '@/Components/CMS/AuthorBio';

export default function Page({ page, seoMeta, pageSchema }) {
    const updatedAt = page.updated_at
        ? new Date(page.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <PublicLayout>
            <MetaTags meta={seoMeta} />
            <SchemaOrg schema={pageSchema} />
            <Head title={page.title} />

            <article className="mx-auto max-w-4xl">
                {/* Breadcrumb */}
                <nav className="mb-6 text-sm">
                    <ol className="flex items-center gap-2 text-gray-500">
                        <li><Link href="/" className="hover:text-brand">Home</Link></li>
                        <li>/</li>
                        <li className="text-gray-900">{page.title}</li>
                    </ol>
                </nav>

                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                        {page.title}
                    </h1>

                    {page.subtitle && (
                        <p className="mt-4 text-lg text-gray-600">
                            {page.subtitle}
                        </p>
                    )}

                    {updatedAt && (
                        <p className="mt-4 text-sm text-gray-500">
                            Last updated: <time dateTime={page.updated_at}>{updatedAt}</time>
                        </p>
                    )}
                </header>

                {/* Featured Image */}
                {page.featured_image_url && (
                    <div className="mb-8 overflow-hidden rounded-lg">
                        <img
                            src={page.featured_image_url}
                            alt={page.title}
                            className="h-auto w-full object-cover"
                        />
                    </div>
                )}

                {/* Content */}
                <div
                    className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-brand prose-img:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />

                {/* Author (for E-E-A-T) */}
                {page.author && (
                    <div className="mt-12 border-t border-gray-200 pt-8">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                            Page Author
                        </h3>
                        <AuthorBio author={page.author} variant="compact" />
                    </div>
                )}

                {/* Reviewed By (E-E-A-T) */}
                {page.reviewed_by && (
                    <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Reviewed by <strong>{page.reviewed_by}</strong></span>
                    </div>
                )}
            </article>
        </PublicLayout>
    );
}
