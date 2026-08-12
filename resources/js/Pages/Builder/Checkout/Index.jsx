import BuilderLayout from '@/Layouts/BuilderLayout';
import Container from '@/Components/Container';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { d } from '@/Support/dictionary';

/**
 * Trade checkout — mirror of Storefront/Checkout/Index. Only differences vs
 * the retail page:
 *   - wraps in BuilderLayout (trade portal shell) instead of PublicLayout
 *   - posts to builder.checkout.store, so the server-side channel resolves
 *     to 'trade' and CheckoutService writes is_builder_order = true
 *   - empty-cart CTA and breadcrumb point at /builder/shop
 *   - adds a Purchase Order number field to the Contact section
 *   - adds a Deliver-to-build-site checkbox to the Shipping section
 *   - injects an "Invoice (Net-30)" payment method option; the retail
 *     validator refuses `invoice` — this option is only offered on trade.
 * Every other pixel of the layout matches the retail page so builders see
 * the exact same familiar flow.
 */

function LockIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
}

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
    const { auth } = usePage().props;
    const isInactive = !!auth?.user && auth.user.is_active === false;

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
            country: '',
            phone: user?.phone || '',
        },
        billing_address: {
            name: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
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

    const handleBillingSameAsShipping = (checked) => {
        setBillingSameAsShipping(checked);
        setData('billing_same_as_shipping', checked);
    };

    const placeOrder = (e) => {
        e.preventDefault();
        if (isInactive) return;
        post(route('builder.checkout.store'));
    };

    const selectedShipping = shippingMethods.find(m => m.id === data.shipping_method);
    const shippingCost = selectedShipping?.price || 0;
    const grandTotal = (totals.subtotal || 0) + shippingCost + (totals.tax || 0) - (totals.discount || 0);

    const isEmpty = items.length === 0;

    return (
        <BuilderLayout title="Trade Checkout">
            <Head title="Trade Checkout" />

            {/* Breadcrumb */}
            <section className="py-4 border-b border-gray-100">
                <Container>
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href={route('builder.dashboard')} className="hover:text-gray-900">
                            Trade Portal
                        </Link>
                        <span>/</span>
                        <Link href={route('builder.shop.index')} className="hover:text-gray-900">
                            Trade Shop
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900">Checkout</span>
                    </nav>
                </Container>
            </section>

            <section className="py-8">
                <Container>
                    {isEmpty ? (
                        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">Your trade cart is empty</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Add items to your trade cart before checkout.
                            </p>
                            <Link
                                href={route('builder.shop.index')}
                                className="mt-6 inline-flex rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={placeOrder}>
                            {isInactive && (
                                <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    <p className="text-sm text-amber-800">Your account is inactive. Ordering is disabled. Please contact support.</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                                {/* Left Column - Forms */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Contact Information */}
                                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Contact Information
                                        </h2>

                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-medium text-gray-600">
                                                    Email *
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
                                                    Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={data.contact.phone}
                                                    onChange={(e) => updateContact('phone', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Address */}
                                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Shipping Address
                                        </h2>

                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-medium text-gray-600">
                                                    Full Name *
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
                                                    Address Line 1 *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.shipping_address.address_line_1}
                                                    onChange={(e) => updateShippingAddress('address_line_1', e.target.value)}
                                                    placeholder="Street address, P.O. box"
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                    required
                                                />
                                                {errors['shipping_address.address_line_1'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['shipping_address.address_line_1']}</p>
                                                )}
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-medium text-gray-600">
                                                    Address Line 2
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.shipping_address.address_line_2}
                                                    onChange={(e) => updateShippingAddress('address_line_2', e.target.value)}
                                                    placeholder="Apartment, suite, unit, building"
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">
                                                    City *
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
                                                    State *
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
                                                    Postal Code *
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
                                                    Country *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.shipping_address.country}
                                                    onChange={(e) => updateShippingAddress('country', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                                    required
                                                />
                                                {errors['shipping_address.country'] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors['shipping_address.country']}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Method */}
                                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Shipping Method
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
                                                            <span className="text-green-600">Free</span>
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
                                            Payment Method
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
                                            Order Notes
                                        </h2>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={3}
                                            placeholder="Site access, delivery times, forklift on site, etc."
                                            className="mt-4 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                </div>

                                {/* Right Column - Order Summary */}
                                <div className="lg:col-span-1">
                                    <div className="lg:sticky lg:top-24 rounded-lg border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Order Summary
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
                                                            </div>
                                                            {(item.options?.colour || item.options?.finish) && (
                                                                <p className="text-[11px] text-gray-500">
                                                                    {[item.options.colour, item.options.finish].filter(Boolean).join(' · ')}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500">
                                                                ${parseFloat(item.price || 0).toFixed(2)} / sqm × {parseFloat(item.quantity).toFixed(2)} m²
                                                            </p>
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            ${parseFloat(item.line_total || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Totals */}
                                        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Subtotal (trade)</span>
                                                <span className="font-medium text-gray-900">
                                                    ${totals.subtotal?.toLocaleString()}
                                                </span>
                                            </div>
                                            {totals.discount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Discount</span>
                                                    <span className="font-medium text-green-600">
                                                        -${totals.discount?.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Shipping</span>
                                                <span className="font-medium text-gray-900">
                                                    {(() => {
                                                        const nonSampleShipping = Math.max(0, parseFloat(totals.shipping || 0) - parseFloat(totals.sample_shipping || 0));
                                                        if (nonSampleShipping > 0) {
                                                            return `$${nonSampleShipping.toFixed(2)}`;
                                                        }
                                                        if (parseFloat(totals.subtotal || 0) > 0) {
                                                            return <span className="text-green-600">Free</span>;
                                                        }
                                                        return '—';
                                                    })()}
                                                </span>
                                            </div>
                                            {totals.tax > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Tax</span>
                                                    <span className="font-medium text-gray-900">
                                                        ${totals.tax?.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                            <div className="flex justify-between">
                                                <span className="text-base font-semibold text-gray-900">
                                                    Total
                                                </span>
                                                <span className="text-lg font-bold text-gray-900">
                                                    ${grandTotal?.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Place Order Button */}
                                        <button
                                            type="submit"
                                            disabled={processing || isInactive}
                                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Processing...
                                                </>
                                            ) : isInactive ? (
                                                'Ordering disabled'
                                            ) : (
                                                <>
                                                    <LockIcon className="h-4 w-4" />
                                                    Place Order
                                                </>
                                            )}
                                        </button>

                                        <p className="mt-4 text-center text-xs text-gray-500">
                                            Your payment information is secure and encrypted.
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
        </BuilderLayout>
    );
}
