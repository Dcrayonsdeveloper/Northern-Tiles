import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Index({ items, subtotal }) {
    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        notes: '',
    });

    const placeOrder = (e) => {
        e.preventDefault();
        post(route('checkout.store'));
    };

    return (
        <PublicLayout>
            <Head title="Checkout" />

            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Checkout
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Enter your details and place a demo order.
                    </p>
                </div>
                <Link
                    href={route('cart.index')}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                    Back to cart
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
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <div className="text-sm font-semibold text-gray-900">
                                Customer information
                            </div>

                            <form onSubmit={placeOrder} className="mt-4 space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Name
                                    </label>
                                    <input
                                        value={data.customer_name}
                                        onChange={(e) =>
                                            setData('customer_name', e.target.value)
                                        }
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                    />
                                    {errors.customer_name ? (
                                        <div className="mt-1 text-xs text-red-600">
                                            {errors.customer_name}
                                        </div>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Email
                                    </label>
                                    <input
                                        value={data.customer_email}
                                        onChange={(e) =>
                                            setData('customer_email', e.target.value)
                                        }
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                    />
                                    {errors.customer_email ? (
                                        <div className="mt-1 text-xs text-red-600">
                                            {errors.customer_email}
                                        </div>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Phone (optional)
                                    </label>
                                    <input
                                        value={data.customer_phone}
                                        onChange={(e) =>
                                            setData('customer_phone', e.target.value)
                                        }
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData('notes', e.target.value)
                                        }
                                        rows={4}
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Place order
                                </button>
                            </form>
                        </div>

                        <div className="mt-6 overflow-hidden rounded-lg border bg-white shadow-sm">
                            <div className="p-4 text-sm font-semibold text-gray-900">
                                Items
                            </div>
                            <div className="divide-y">
                                {(items ?? []).map((item) => (
                                    <div key={item.product.id} className="p-4 flex justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {item.product.name}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Qty: {item.quantity}
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900">
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
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
