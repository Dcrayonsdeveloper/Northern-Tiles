import StorefrontHeader from '@/Components/Storefront/StorefrontHeader';
import { Footer } from '@/Components/Footer';
import Container from '@/Components/Container';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

function TrackingScripts({ tracking }) {
    const gtmId = tracking?.gtm_id;
    const ga4Id = tracking?.ga4_id;
    const metaPixelId = tracking?.meta_pixel_id;

    useEffect(() => {
        // Google Tag Manager
        if (gtmId && !window.gtmLoaded) {
            window.gtmLoaded = true;
            window.dataLayer = window.dataLayer || [];

            const script = document.createElement('script');
            script.innerHTML = `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
            `;
            document.head.appendChild(script);
        }

        // Google Analytics 4 (only if GTM not present)
        if (ga4Id && !gtmId && !window.ga4Loaded) {
            window.ga4Loaded = true;

            const gtagScript = document.createElement('script');
            gtagScript.async = true;
            gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
            document.head.appendChild(gtagScript);

            const inlineScript = document.createElement('script');
            inlineScript.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}');
            `;
            document.head.appendChild(inlineScript);
        }

        // Meta Pixel
        if (metaPixelId && !window.metaPixelLoaded) {
            window.metaPixelLoaded = true;

            const fbScript = document.createElement('script');
            fbScript.innerHTML = `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixelId}');
                fbq('track', 'PageView');
            `;
            document.head.appendChild(fbScript);
        }
    }, [gtmId, ga4Id, metaPixelId]);

    return null;
}

function JsonLdScript({ data }) {
    if (!data) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

function GtmNoscript({ gtmId }) {
    if (!gtmId) return null;

    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
            />
        </noscript>
    );
}

export default function PublicLayout({ children }) {
    const { auth, cart, flash, ui, site, menus, tracking, organizationJsonLd } = usePage().props;
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
    const faviconUrl = site?.favicon_url ?? null;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Head>
                {faviconUrl ? <link rel="icon" href={faviconUrl} type="image/x-icon" /> : null}
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

            <JsonLdScript data={organizationJsonLd} />
            <TrackingScripts tracking={tracking} />

            <GtmNoscript gtmId={tracking?.gtm_id} />

            <StorefrontHeader user={user} cartCount={cartCount} topBar={topBar} menus={menus} />

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

            <main>
                {children}
            </main>

            <Footer />
        </div>
    );
}
