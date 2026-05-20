import Container from '@/Components/Container';
import PublicLayout from '@/Layouts/PublicLayout';
import { d } from '@/Support/dictionary';
import { Head, Link } from '@inertiajs/react';

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function OrderItem({ item, currency }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">
                    {d('checkout.qty', 'Qty')}: {item.quantity}
                </p>
            </div>
            <p className="text-sm font-medium text-gray-900">
                {currency}{(item.line_total || item.price * item.quantity).toLocaleString()}
            </p>
        </div>
    );
}

export default function Success({ order }) {
    const currency = '$';

    return (
        <PublicLayout>
            <Head title={d('checkout.success.title', 'Order Confirmed')} />

            <Container className="py-12">
                <div className="mx-auto max-w-2xl">
                    {/* Success Icon and Message */}
                    <div className="text-center mb-8">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="mt-4 text-2xl font-bold text-gray-900">
                            {d('checkout.success.heading', 'Thank you for your order!')}
                        </h1>
                        <p className="mt-2 text-gray-600">
                            {d('checkout.success.message', 'Your order has been placed successfully. We\'ll send you an email confirmation shortly.')}
                        </p>
                    </div>

                    {/* Order Details Card */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        {/* Order Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {d('checkout.success.order_number', 'Order Number')}
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {order.order_number}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                        {d('checkout.success.order_date', 'Order Date')}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {order.created_at}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Status */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                    {d('checkout.success.status', 'Status')}:
                                </span>
                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 capitalize">
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                {d('checkout.success.items', 'Order Items')}
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {order.items?.map((item, index) => (
                                    <OrderItem key={index} item={item} currency={currency} />
                                ))}
                            </div>
                        </div>

                        {/* Order Totals */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{d('cart.subtotal', 'Subtotal')}</span>
                                    <span className="text-gray-900">{currency}{order.subtotal?.toLocaleString()}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{d('cart.discount', 'Discount')}</span>
                                        <span className="text-green-600">-{currency}{order.discount?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{d('cart.shipping', 'Shipping')}</span>
                                    <span className="text-gray-900">
                                        {order.shipping_cost > 0
                                            ? `${currency}${order.shipping_cost?.toLocaleString()}`
                                            : d('cart.free', 'Free')}
                                    </span>
                                </div>
                                {order.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{d('cart.tax', 'Tax')}</span>
                                        <span className="text-gray-900">{currency}{order.tax?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                                    <span className="text-gray-900">{d('cart.total', 'Total')}</span>
                                    <span className="text-gray-900">{currency}{order.total?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                    {d('checkout.success.shipping_address', 'Shipping Address')}
                                </h3>
                                <div className="text-sm text-gray-600">
                                    <p>{order.shipping_address.name}</p>
                                    <p>{order.shipping_address.address_line_1}</p>
                                    {order.shipping_address.address_line_2 && (
                                        <p>{order.shipping_address.address_line_2}</p>
                                    )}
                                    <p>
                                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                                    </p>
                                    <p>{order.shipping_address.country}</p>
                                    {order.shipping_address.phone && (
                                        <p className="mt-1">{d('checkout.phone', 'Phone')}: {order.shipping_address.phone}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="px-6 py-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                {d('checkout.success.payment_method', 'Payment Method')}
                            </h3>
                            <p className="text-sm text-gray-600 capitalize">
                                {order.payment_method === 'cod' && d('checkout.payment.cod', 'Cash on Delivery')}
                                {order.payment_method === 'upi' && d('checkout.payment.upi', 'UPI')}
                                {order.payment_method === 'card' && d('checkout.payment.card', 'Credit/Debit Card')}
                                {!['cod', 'upi', 'card'].includes(order.payment_method) && order.payment_method}
                            </p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mt-6 bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            {d('checkout.success.email_sent', 'A confirmation email has been sent to')}{' '}
                            <strong>{order.customer_email}</strong>
                        </p>
                    </div>

                    {/* Trustpilot Review CTA */}
                    {import.meta.env.VITE_TRUSTPILOT_REVIEW_URL && (
                        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 text-center">
                            <p className="text-sm text-gray-600 mb-3">Happy with your order? Share your experience!</p>
                            <a
                                href={import.meta.env.VITE_TRUSTPILOT_REVIEW_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-md bg-[#00b67a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00a169]"
                            >
                                ★ Review us on Trustpilot
                            </a>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={route('shop.index')}
                            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                        >
                            {d('checkout.success.continue_shopping', 'Continue Shopping')}
                        </Link>
                        <Link
                            href={route('home')}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {d('checkout.success.back_home', 'Back to Home')}
                        </Link>
                    </div>
                </div>
            </Container>
        </PublicLayout>
    );
}
