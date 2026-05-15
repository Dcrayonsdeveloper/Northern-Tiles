import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { d } from '@/Support/dictionary';

// Icons
function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function LockIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
}

// Payment method icons
function CashIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );
}

function CardIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    );
}

export default function Index({
    items = [],
    totals = {},
    shippingMethods = [],
    paymentMethods = [],
    isGuest = true,
    user = null,
}) {
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

    const { data, setData, post, processing, errors } = useForm({
        contact: {
            email: user?.email || '',
            phone: user?.phone || '',
            name: user?.name || '',
        },
        shipping_address: {
            name: user?.name || '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Australia',
            phone: user?.phone || '',
        },
        billing_address: {
            name: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Australia',
        },
        billing_same_as_shipping: true,
        shipping_method: shippingMethods[0]?.id || 'standard',
        payment_method: 'cod',
        notes: '',
        marketing_opt_in: false,
    });

    const updateContact = (field, value) => {
        setData('contact', { ...data.contact, [field]: value });
    };

    const updateShippingAddress = (field, value) => {
        setData('shipping_address', { ...data.shipping_address, [field]: value });
    };

    const updateBillingAddress = (field, value) => {
        setData('billing_address', { ...data.billing_address, [field]: value });
    };

    const handleBillingSameAsShipping = (checked) => {
        setBillingSameAsShipping(checked);
        setData('billing_same_as_shipping', checked);
    };

    const placeOrder = (e) => {
        e.preventDefault();
        post(route('checkout.store'));
    };

    const selectedShipping = shippingMethods.find(m => m.id === data.shipping_method);
    const shippingCost = selectedShipping?.price || 0;
    const grandTotal = (totals.subtotal || 0) + shippingCost + (totals.tax || 0) - (totals.discount || 0);

    const isEmpty = items.length === 0;

    return (
        <PublicLayout>
            <Head title={d('checkout.title', 'Checkout')} />

            {/* Breadcrumb */}
            <section className="py-4 border-b border-gray-100">
                <Container>
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href={route('home')} className="hover:text-gray-900">
                            {d('nav.home', 'Home')}
                        </Link>
                        <span>/</span>
                        <Link href={route('shop.index')} className="hover:text-gray-900">
                            {d('nav.shop', 'Shop')}
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900">{d('checkout.title', 'Checkout')}</span>
                    </nav>
                </Container>
            </section>

            <section className="py-8">
                <Container>
                    {isEmpty ? (
                        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {d('checkout.empty.title', 'Your cart is empty')}
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                {d('checkout.empty.description', 'Add items to your cart before checkout.')}
                            </p>
                            <Link
                                href={route('shop.index')}
                                className="mt-6 inline-flex rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                {d('checkout.empty.cta', 'Continue Shopping')}
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={placeOrder}>
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                                {/* Left Column - Forms */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Contact Information */}
                                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {d('checkout.contact.title', 'Contact Information')}
                                        </h2>
                                        {isGuest && (
                                            <p className="mt-1 text-sm text-gray-600">
                                                {d('checkout.contact.guest_note', 'Already have an account?')}{' '}
                                                <Link href="/login" className="font-medium text-brand hover:underline">
                                                    {d('checkout.contact.login', 'Log in')}
                                                </Link>
                                            </p>
                                        )}

                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-medium text-gray-600">
                                                    {d('checkout.contact.email', 'Email')} *
                                                </label>
                                                <input
                                                    type="email"
                                                    value={data.contact.email}
                                                    onChange={(e) => updateContact('email', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                    required
                                                />
                                                {errors['contact.email'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['contact.email']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">
                                                    {d('checkout.contact.phone', 'Phone')}
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={data.contact.phone}
                                                    onChange={(e) => updateContact('phone', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                />
                                            </div>
                                        </div>

                                        {isGuest && (
                                            <label className="mt-4 flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={data.marketing_opt_in}
                                                    onChange={(e) => setData('marketing_opt_in', e.target.checked)}
                                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                                />
                                                <span className="text-xs text-gray-600">
                                                    {d('checkout.contact.marketing', 'Email me with news and offers')}
                                                </span>
                                            </label>
                                        )}
                                    </div>

                                    {/* Shipping Address */}
                                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {d('checkout.shipping.title', 'Shipping Address')}
                                        </h2>

                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-medium text-gray-600">
                                                    {d('checkout.shipping.name', 'Full Name')} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.shipping_address.name}
                                                    onChange={(e) => updateShippingAddress('name', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                    required
                                                />
                                                {errors['shipping_address.name'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['shipping_address.name']}</p>
                                                )}
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-medium text-gray-600">
                                                    {d('checkout.shipping.address1', 'Address Line 1')} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.shipping_address.address_line_1}
                                                    onChange={(e) => updateShippingAddress('address_line_1', e.target.value)}
                                                    placeholder={d('checkout.shipping.address1_placeholder', 'Street address, P.O. box')}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                    required
                                                />
                                                {errors['shipping_address.address_line_1'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['shipping_address.address_line_1']}</p>
                                                )}
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-medium text-gray-600">
                                                    {d('checkout.shipping.address2', 'Address Line 2')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.shipping_address.address_line_2}
                                                    onChange={(e) => updateShippingAddress('address_line_2', e.target.value)}
                                                    placeholder={d('checkout.shipping.address2_placeholder', 'Apartment, suite, unit, building')}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">
                                                    {d('checkout.shipping.city', 'City')} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.shipping_address.city}
                                                    onChange={(e) => updateShippingAddress('city', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                    required
                                                />
                                                {errors['shipping_address.city'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['shipping_address.city']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">
                                                    {d('checkout.shipping.state', 'State')} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.shipping_address.state}
                                                    onChange={(e) => updateShippingAddress('state', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                    required
                                                />
                                                {errors['shipping_address.state'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['shipping_address.state']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">
                                                    {d('checkout.shipping.postal_code', 'PIN Code')} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.shipping_address.postal_code}
                                                    onChange={(e) => updateShippingAddress('postal_code', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                    required
                                                />
                                                {errors['shipping_address.postal_code'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['shipping_address.postal_code']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">
                                                    {d('checkout.shipping.country', 'Country')} *
                                                </label>
                                                <select
                                                    value={data.shipping_address.country}
                                                    onChange={(e) => updateShippingAddress('country', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                    required
                                                >
                                                    <option value="India">India</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Method */}
                                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {d('checkout.shipping_method.title', 'Shipping Method')}
                                        </h2>

                                        <div className="mt-4 space-y-3">
                                            {shippingMethods.map((method) => (
                                                <label
                                                    key={method.id}
                                                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                                                        data.shipping_method === method.id
                                                            ? 'border-gray-900 bg-gray-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name="shipping_method"
                                                            value={method.id}
                                                            checked={data.shipping_method === method.id}
                                                            onChange={(e) => setData('shipping_method', e.target.value)}
                                                            className="text-gray-900 focus:ring-gray-900"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{method.name}</p>
                                                            <p className="text-xs text-gray-500">{method.description}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {method.price === 0 ? (
                                                            <span className="text-green-600">{d('checkout.free', 'Free')}</span>
                                                        ) : (
                                                            `$${method.price}`
                                                        )}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {d('checkout.payment.title', 'Payment Method')}
                                        </h2>

                                        <div className="mt-4 space-y-3">
                                            {paymentMethods.map((method) => (
                                                <label
                                                    key={method.id}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                                                        data.payment_method === method.id
                                                            ? 'border-gray-900 bg-gray-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment_method"
                                                        value={method.id}
                                                        checked={data.payment_method === method.id}
                                                        onChange={(e) => setData('payment_method', e.target.value)}
                                                        className="text-gray-900 focus:ring-gray-900"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        {method.id === 'cod' && <CashIcon className="h-6 w-6 text-gray-500" />}
                                                        {method.id === 'card' && <CardIcon className="h-6 w-6 text-gray-500" />}
                                                        {method.id === 'upi' && (
                                                            <span className="text-xs font-bold text-gray-500">UPI</span>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{method.name}</p>
                                                            <p className="text-xs text-gray-500">{method.description}</p>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Notes */}
                                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {d('checkout.notes.title', 'Order Notes')}
                                        </h2>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={3}
                                            placeholder={d('checkout.notes.placeholder', 'Special instructions for delivery...')}
                                            className="mt-4 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                </div>

                                {/* Right Column - Order Summary */}
                                <div className="lg:col-span-1">
                                    <div className="lg:sticky lg:top-24 rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {d('checkout.summary.title', 'Order Summary')}
                                        </h2>

                                        {/* Items */}
                                        <div className="mt-4 max-h-64 overflow-y-auto">
                                            <div className="space-y-3">
                                                {items.map((item) => (
                                                    <div key={item.id} className="flex gap-3">
                                                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
                                                            <img
                                                                src={item.image_url || '/images/placeholder-product.svg'}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-[10px] font-medium text-white">
                                                                {item.quantity}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                                                    {item.name}
                                                                </p>
                                                                {item.is_sample && (
                                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-green-700">
                                                                        Free Sample
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!item.is_sample && (
                                                                <p className="text-xs text-gray-500">
                                                                    ${parseFloat(item.price || 0).toFixed(2)} / sqm × {parseFloat(item.quantity).toFixed(2)} m²
                                                                </p>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {item.is_sample ? (
                                                                <span className="text-green-600">FREE</span>
                                                            ) : (
                                                                <>${parseFloat(item.line_total || 0).toFixed(2)}</>
                                                            )}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Totals */}
                                        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">{d('checkout.summary.subtotal', 'Subtotal')}</span>
                                                <span className="font-medium text-gray-900">
                                                    ${totals.subtotal?.toLocaleString()}
                                                </span>
                                            </div>
                                            {totals.discount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">{d('checkout.summary.discount', 'Discount')}</span>
                                                    <span className="font-medium text-green-600">
                                                        -${totals.discount?.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">{d('checkout.summary.shipping', 'Shipping')}</span>
                                                <span className="font-medium text-gray-900">
                                                    {(() => {
                                                        const nonSampleShipping = Math.max(0, parseFloat(totals.shipping || 0) - parseFloat(totals.sample_shipping || 0));
                                                        if (nonSampleShipping > 0) {
                                                            return `$${nonSampleShipping.toFixed(2)}`;
                                                        }
                                                        if (parseFloat(totals.subtotal || 0) > 0) {
                                                            return <span className="text-green-600">{d('checkout.free', 'Free')}</span>;
                                                        }
                                                        return '—';
                                                    })()}
                                                </span>
                                            </div>
                                            {totals.sample_count > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">
                                                        Sample shipping
                                                        <span className="ml-1 text-gray-400">({totals.sample_count} sample{totals.sample_count !== 1 ? 's' : ''})</span>
                                                    </span>
                                                    <span className="font-medium text-gray-900">
                                                        ${parseFloat(totals.sample_shipping || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            {totals.tax > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">{d('checkout.summary.tax', 'Tax')}</span>
                                                    <span className="font-medium text-gray-900">
                                                        ${totals.tax?.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                            <div className="flex justify-between">
                                                <span className="text-base font-semibold text-gray-900">
                                                    {d('checkout.summary.total', 'Total')}
                                                </span>
                                                <span className="text-lg font-bold text-gray-900">
                                                    ${grandTotal?.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Place Order Button */}
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    {d('checkout.processing', 'Processing...')}
                                                </>
                                            ) : (
                                                <>
                                                    <LockIcon className="h-4 w-4" />
                                                    {d('checkout.place_order', 'Place Order')}
                                                </>
                                            )}
                                        </button>

                                        <p className="mt-4 text-center text-xs text-gray-500">
                                            {d('checkout.secure_note', 'Your payment information is secure and encrypted.')}
                                        </p>

                                        {errors.checkout && (
                                            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                                                {errors.checkout}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </Container>
            </section>
        </PublicLayout>
    );
}
