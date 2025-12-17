import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Show({ product }) {
    const { data, setData, post, processing } = useForm({
        product_id: product.id,
        quantity: 1,
    });

    const addToCart = (e) => {
        e.preventDefault();
        post(route('cart.store'), {
            preserveScroll: true,
        });
    };

    return (
        <PublicLayout>
            <Head title={product.name} />

            <div className="mb-6">
                <Link
                    href={route('shop.index')}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                    ← Back to shop
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <div className="aspect-[4/3] bg-gray-100">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : null}
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {product.name}
                    </h1>

                    <div className="mt-3 text-2xl font-semibold text-gray-900">
                        ₹{product.price}
                        {product.compare_at_price ? (
                            <span className="ml-3 text-base font-medium text-gray-500 line-through">
                                ₹{product.compare_at_price}
                            </span>
                        ) : null}
                    </div>

                    {product.short_description ? (
                        <p className="mt-4 text-gray-600">
                            {product.short_description}
                        </p>
                    ) : null}

                    <form onSubmit={addToCart} className="mt-6">
                        <label className="text-xs font-medium text-gray-600">
                            Quantity
                        </label>
                        <div className="mt-1 flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max="99"
                                value={data.quantity}
                                onChange={(e) =>
                                    setData('quantity', Number(e.target.value))
                                }
                                className="w-24 rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                Add to cart
                            </button>
                            <Link
                                href={route('cart.index')}
                                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Go to cart
                            </Link>
                        </div>
                    </form>

                    {product.description ? (
                        <div className="mt-8">
                            <h2 className="text-sm font-semibold text-gray-900">
                                Description
                            </h2>
                            <div className="mt-2 whitespace-pre-line text-sm text-gray-700">
                                {product.description}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </PublicLayout>
    );
}
