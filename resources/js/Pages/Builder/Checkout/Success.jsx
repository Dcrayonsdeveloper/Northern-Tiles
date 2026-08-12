import BuilderLayout from '@/Layouts/BuilderLayout';
import Container from '@/Components/Container';
import { Head, Link } from '@inertiajs/react';

/**
 * Trade order confirmation. Reuses the retail Order shape (Order model is
 * unified — is_builder_order flag distinguishes trade rows) and presents it
 * as a dispatch-note style page.
 */
export default function Success({ order }) {
    return (
        <BuilderLayout title="Trade order placed">
            <Head title="Trade order placed" />
            <Container>
                <div className="mx-auto max-w-3xl py-10">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-slate-900">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Trade order received</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Order <span className="font-semibold">#{order.order_number}</span> has been placed.
                            You'll get a dispatch confirmation once we start picking.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <section className="rounded-lg border bg-white p-6 shadow-sm">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Order details</h2>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-gray-600">Order number</dt><dd className="font-medium text-gray-900">#{order.order_number}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Placed</dt><dd className="font-medium text-gray-900">{order.created_at}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Payment</dt><dd className="font-medium text-gray-900 capitalize">{order.payment_method}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Status</dt><dd className="font-medium text-gray-900 capitalize">{order.status}</dd></div>
                            </dl>
                        </section>

                        <section className="rounded-lg border bg-white p-6 shadow-sm">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Delivery to</h2>
                            <p className="text-sm text-gray-900">{order.customer_name}</p>
                            <p className="text-sm text-gray-700 mt-1">{order.customer_email}</p>
                            {order.shipping_address && (
                                <address className="mt-3 text-sm text-gray-700 not-italic">
                                    {order.shipping_address.address_line_1}<br />
                                    {order.shipping_address.address_line_2 && <>{order.shipping_address.address_line_2}<br /></>}
                                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
                                    {order.shipping_address.country}
                                </address>
                            )}
                        </section>
                    </div>

                    <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Items</h2>
                        <div className="divide-y">
                            {(order.items ?? []).map((item, i) => (
                                <div key={i} className="flex justify-between py-3 text-sm">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900">${parseFloat(item.line_total).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 space-y-2 border-t pt-4 text-sm">
                            <Row label="Subtotal" value={order.subtotal} />
                            {order.discount > 0 && <Row label="Discount" value={-Math.abs(order.discount)} />}
                            <Row label="Shipping" value={order.shipping_cost} />
                            <Row label="Tax" value={order.tax} />
                            <div className="flex justify-between border-t pt-3 text-base font-bold text-gray-900">
                                <span>Total</span>
                                <span>${parseFloat(order.total).toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    <div className="mt-6 flex gap-3">
                        <Link
                            href={route('builder.shop.index')}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Back to trade shop
                        </Link>
                        <Link
                            href={route('builder.dashboard')}
                            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
                        >
                            Trade dashboard
                        </Link>
                    </div>
                </div>
            </Container>
        </BuilderLayout>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between text-gray-700">
            <span>{label}</span>
            <span>${parseFloat(value ?? 0).toFixed(2)}</span>
        </div>
    );
}
