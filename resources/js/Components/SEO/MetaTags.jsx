import { Head } from '@inertiajs/react';

export default function MetaTags({ meta }) {
    if (!meta) return null;

    return (
        <Head>
            {meta.title && <title>{meta.title}</title>}
            {meta.description && <meta name="description" content={meta.description} />}
            {meta.robots && <meta name="robots" content={meta.robots} />}
            {meta.canonical && <link rel="canonical" href={meta.canonical} />}
            {meta.og?.title && <meta property="og:title" content={meta.og.title} />}
            {meta.og?.description && <meta property="og:description" content={meta.og.description} />}
            {meta.og?.image && <meta property="og:image" content={meta.og.image} />}
            {meta.og?.type && <meta property="og:type" content={meta.og.type} />}
            {meta.twitter?.title && <meta name="twitter:title" content={meta.twitter.title} />}
            {meta.twitter?.description && <meta name="twitter:description" content={meta.twitter.description} />}
            {meta.twitter?.image && <meta name="twitter:image" content={meta.twitter.image} />}
            {meta.twitter?.card && <meta name="twitter:card" content={meta.twitter.card} />}
        </Head>
    );
}
