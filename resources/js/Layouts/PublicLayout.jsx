import StorefrontHeader from '@/Components/Storefront/StorefrontHeader';
import { Head, Link, usePage } from '@inertiajs/react';

function FooterLink({ item }) {
    const href = item?.url ?? '#';
    const target = item?.target ?? '_self';

    const isExternal = typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'));
    const useAnchor = isExternal || target === '_blank';

    if (useAnchor) {
        return (
            <a
                href={href}
                target={target}
                rel={target === '_blank' ? 'noreferrer noopener' : undefined}
                className="text-sm text-gray-600 hover:text-gray-900"
            >
                {item?.label}
            </a>
        );
    }

    return (
        <Link href={href} className="text-sm text-gray-600 hover:text-gray-900">
            {item?.label}
        </Link>
    );
}

export default function PublicLayout({ children }) {
    const { auth, cart, flash, ui, site, menus } = usePage().props;
    const user = auth?.user;

    const cartCount = cart?.count ?? 0;
    const topBar = ui?.topBar;
    const success = flash?.success;
    const error = flash?.error;

    const siteTitle = site?.title ?? '';
    const siteDescription = site?.description ?? '';
    const ogImageUrl = site?.og_image_url ?? null;
    const twitterSite = site?.twitter_site ?? '';
    const twitterCreator = site?.twitter_creator ?? '';

    const footerItems = menus?.footer ?? [];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Head>
                {siteDescription ? <meta name="description" content={siteDescription} /> : null}
                {siteTitle ? <meta property="og:site_name" content={siteTitle} /> : null}
                {siteTitle ? <meta property="og:title" content={siteTitle} /> : null}
                {siteDescription ? <meta property="og:description" content={siteDescription} /> : null}
                {ogImageUrl ? <meta property="og:image" content={ogImageUrl} /> : null}
                <meta property="og:type" content="website" />

                <meta name="twitter:card" content="summary_large_image" />
                {twitterSite ? <meta name="twitter:site" content={twitterSite} /> : null}
                {twitterCreator ? <meta name="twitter:creator" content={twitterCreator} /> : null}
                {siteTitle ? <meta name="twitter:title" content={siteTitle} /> : null}
                {siteDescription ? <meta name="twitter:description" content={siteDescription} /> : null}
                {ogImageUrl ? <meta name="twitter:image" content={ogImageUrl} /> : null}
            </Head>

            <StorefrontHeader user={user} cartCount={cartCount} topBar={topBar} menus={menus} />

            {(success || error) && (
                <div className="w-full px-4 pt-4 sm:px-6 lg:px-8">
                    {success && (
                        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </div>
                    )}
                </div>
            )}

            <main className="w-full px-4 py-10 sm:px-6 lg:px-8">
                {children}
            </main>

            <footer className="border-t bg-white">
                <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
                    {footerItems.length ? (
                        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2">
                            {footerItems.map((item, idx) => (
                                <FooterLink key={(item?.label ?? 'item') + idx} item={item} />
                            ))}
                        </div>
                    ) : null}

                    <div className="text-sm text-gray-500">
                        © {new Date().getFullYear()} Jikra. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
