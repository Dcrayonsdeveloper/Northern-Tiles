import { Head } from '@inertiajs/react';

export default function SchemaOrg({ schema }) {
    if (!schema) return null;

    return (
        <Head>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Head>
    );
}
