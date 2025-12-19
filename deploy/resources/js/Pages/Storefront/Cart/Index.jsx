import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ items, subtotal }) {
    const updateQty = (productSlug, quantity) => {
        router.put(
            route('cart.update', productSlug),
            { quantity },
            { preserveScroll: true },
        );
    };

    const remove = (productSlug) => {
        router.delete(route('cart.destroy', productSlug), {
            preserveScroll: true,
        });
    };

    return (
        <PublicLayout>
            <Head title="Cart" />

            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cart</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Review items before checkout.
                    </p>
                </div>
                <Link
                    href={route('shop.index')}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                    Continue shopping
                </Link>
            </div>

            {(items ?? []).length === 0 ? (
                <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow-sm">
                    <div className="text-sm text-gray-700">
                        Your cart is empty.
                    </div>
                    <Link
                        href={route('shop.index')}
                        className="mt-4 inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        Go to shop
                    </Link>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                            <div className="divide-y">
                                {(items ?? []).map((item) => (
                                    <div
                                        key={item.product.id}
                                        className="flex items-center gap-4 p-4"
                                    >
                                        <div className="h-16 w-20 overflow-hidden rounded bg-gray-100">
                                            {item.product.image_url ? (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : null}
                                        </div>

                                        <div className="flex-1">
                                            <Link
                                                href={route(
                                                    'products.show',
                                                    item.product.slug,
                                                )}
                                                className="text-sm font-semibold text-gray-900 hover:underline"
                                            >
                                                {item.product.name}
                                            </Link>
                                            <div className="mt-1 text-sm text-gray-600">
                                                ₹{item.product.price}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="99"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateQty(
                                                        item.product.slug,
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-20 rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => remove(item.product.slug)}
                                                className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="w-24 text-right text-sm font-semibold text-gray-900">
                                            ₹{item.line_total}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-semibold text-gray-900">
                            Summary
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-semibold text-gray-900">
                                ₹{subtotal}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-semibold text-gray-900">₹0</span>
                        </div>
                        <div className="mt-4 border-t pt-4 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">
                                Total
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                                ₹{subtotal}
                            </span>
                        </div>
                        <Link
                            href={route('checkout.index')}
                            className="mt-4 block rounded-md bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-800"
                        >
                            Checkout
                        </Link>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
