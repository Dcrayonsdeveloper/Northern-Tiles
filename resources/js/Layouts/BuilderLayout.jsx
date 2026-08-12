import BuilderHeader from '@/Components/Builder/BuilderHeader';
import { Footer } from '@/Components/Footer';
import Container from '@/Components/Container';
import { Head, usePage } from '@inertiajs/react';

/**
 * Shell for the trade portal. Mirrors PublicLayout (header → flash → main →
 * footer) so pages feel like the main site, minus the marketing/tracking
 * scripts — the portal is private, so there is nothing to analytics-track and
 * nothing that should be indexed.
 */
export default function BuilderLayout({ children, categories = null, title }) {
    const { auth, cart, flash, site, builderCategories } = usePage().props;
    const user = auth?.user;
    const cartCount = cart?.count ?? 0;

    // Categories come from a shared prop so the nav is identical on every page
    // of the portal. The explicit prop stays supported as an override for any
    // page that needs a different list, but no page has to pass it just to get
    // the standard header.
    const navCategories = categories ?? builderCategories ?? [];

    const success = flash?.success;
    const error = flash?.error;
    const faviconUrl = site?.favicon_url ?? null;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Head>
                {title ? <title>{`${title} — Trade Portal`}</title> : null}
                {faviconUrl ? <link rel="icon" href={faviconUrl} type="image/x-icon" /> : null}
                {/* Private pricing must never reach a search index. */}
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <BuilderHeader user={user} cartCount={cartCount} categories={navCategories} />

            {(success || error) && (
                <Container className="pt-4">
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
                </Container>
            )}

            <main>{children}</main>

            <Footer minimal />
        </div>
    );
}
