import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link } from '@inertiajs/react';

function ProductCard({ product }) {
    return (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="aspect-[4/3] w-full bg-gray-100">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : null}
            </div>
            <div className="p-4">
                <div className="text-sm font-semibold text-gray-900">
                    {product.name}
                </div>
                {product.short_description ? (
                    <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {product.short_description}
                    </div>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">
                        ₹{product.price}
                    </div>
                    <Link
                        href={route('products.show', product.slug)}
                        className="rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                    >
                        View
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function Home({ featuredProducts }) {
    return (
        <PublicLayout>
            <Head title="Home" />

            <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Ecommerce + Information Website
                    </h1>
                    <p className="mt-3 text-gray-600">
                        This is a Laravel 12 + Inertia React starter storefront with
                        Tailwind + SCSS. Browse products, add to cart, and place a
                        demo order.
                    </p>
                    <div className="mt-6 flex gap-3">
                        <Link
                            href={route('shop.index')}
                            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                        >
                            Shop Now
                        </Link>
                        <Link
                            href={route('pages.about')}
                            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mt-10">
                <div className="flex items-end justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Featured products
                    </h2>
                    <Link
                        href={route('shop.index')}
                        className="text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                        View all
                    </Link>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {(featuredProducts ?? []).map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}
