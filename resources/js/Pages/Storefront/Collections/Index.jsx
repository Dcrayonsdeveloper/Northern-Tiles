import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link } from '@inertiajs/react';

function CollectionCard({ collection }) {
    return (
        <Link
            href={route('collections.show', collection.handle)}
            className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="aspect-[4/3] w-full bg-gray-100">
                {collection.image_url ? (
                    <img
                        src={collection.image_url}
                        alt={collection.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-3xl font-bold text-gray-300">
                            {collection.title.charAt(0)}
                        </span>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand">
                    {collection.title}
                </h3>
                {collection.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {collection.description}
                    </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                    {collection.product_count} {collection.product_count === 1 ? 'product' : 'products'}
                </p>
            </div>
        </Link>
    );
}

export default function Index({ collections }) {
    return (
        <PublicLayout>
            <Head title="Collections" />

            <section className="py-8">
                <Container>
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Browse our curated collections
                        </p>
                    </div>

                    {collections.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {collections.map((collection) => (
                                <CollectionCard key={collection.id} collection={collection} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                            <p className="text-gray-600">No collections available yet.</p>
                            <Link
                                href={route('shop.index')}
                                className="mt-4 inline-block text-sm font-medium text-brand hover:text-brand/80"
                            >
                                Browse all products
                            </Link>
                        </div>
                    )}
                </Container>
            </section>
        </PublicLayout>
    );
}
