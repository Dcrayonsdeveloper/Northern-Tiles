import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import api from '@/Support/api';

export default function Checkout() {
    const [cart, setCart] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'IN',
        shipping_method: 'standard',
        payment_method: 'cod',
        notes: '',
    });

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const response = await api.cart.index();
            setCart(response.data);
        } catch (error) {
            console.error('Failed to load cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('checkout.store'));
    };

    const items = cart?.items || [];
    const subtotal = cart?.subtotal || 0;
    const isEmpty = items.length === 0;

    const shippingCosts = {
        standard: 99,
        express: 199,
        free: 0,
    };

    const shipping = shippingCosts[data.shipping_method] || 0;
    const total = subtotal + shipping;

    if (isLoading) {
        return (
            <PublicLayout>
                <Head title="Checkout" />
                <div className="py-12 text-center">
                    <svg
                        className="mx-auto h-8 w-8 animate-spin text-brand"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <p className="mt-4 text-sm text-gray-500">Loading checkout...</p>
                </div>
            </PublicLayout>
        );
    }

    if (isEmpty) {
        return (
            <PublicLayout>
                <Head title="Checkout" />
                <div className="py-12 text-center">
                    <svg
                        className="mx-auto h-16 w-16 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                    <p className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</p>
                    <p className="mt-2 text-sm text-gray-500">
                        Add items to your cart before checking out.
                    </p>
                    <Link
                        href="/shop"
                        className="mt-6 inline-block rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand/90"
                    >
                        Browse Products
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <Head title="Checkout" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                <p className="mt-2 text-gray-600">Complete your order by filling in the details below.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Information */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input
                                        type="text"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input
                                        type="text"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                                    <input
                                        type="text"
                                        value={data.address_line1}
                                        onChange={(e) => setData('address_line1', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.address_line1 && <p className="mt-1 text-xs text-red-500">{errors.address_line1}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
                                    <input
                                        type="text"
                                        value={data.address_line2}
                                        onChange={(e) => setData('address_line2', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">State</label>
                                    <input
                                        type="text"
                                        value={data.state}
                                        onChange={(e) => setData('state', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                                    <input
                                        type="text"
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.postal_code && <p className="mt-1 text-xs text-red-500">{errors.postal_code}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Country</label>
                                    <select
                                        value={data.country}
                                        onChange={(e) => setData('country', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    >
                                        <option value="IN">India</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Method */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Shipping Method</h2>
                            <div className="mt-4 space-y-3">
                                {[
                                    { value: 'standard', label: 'Standard Shipping', desc: '5-7 business days', price: 99 },
                                    { value: 'express', label: 'Express Shipping', desc: '2-3 business days', price: 199 },
                                    { value: 'free', label: 'Free Shipping', desc: '7-10 business days (Orders above $999)', price: 0 },
                                ].map((method) => (
                                    <label
                                        key={method.value}
                                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 ${
                                            data.shipping_method === method.value
                                                ? 'border-brand bg-brand/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="shipping_method"
                                                value={method.value}
                                                checked={data.shipping_method === method.value}
                                                onChange={(e) => setData('shipping_method', e.target.value)}
                                                className="text-brand focus:ring-brand"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{method.label}</p>
                                                <p className="text-sm text-gray-500">{method.desc}</p>
                                            </div>
                                        </div>
                                        <p className="font-medium text-gray-900">
                                            {method.price === 0 ? 'Free' : `$${method.price}`}
                                        </p>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                            <div className="mt-4 space-y-3">
                                {[
                                    { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
                                    { value: 'upi', label: 'UPI Payment', desc: 'Pay using UPI apps' },
                                    { value: 'card', label: 'Credit/Debit Card', desc: 'Secure card payment' },
                                ].map((method) => (
                                    <label
                                        key={method.value}
                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${
                                            data.payment_method === method.value
                                                ? 'border-brand bg-brand/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value={method.value}
                                            checked={data.payment_method === method.value}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                            className="text-brand focus:ring-brand"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{method.label}</p>
                                            <p className="text-sm text-gray-500">{method.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Order Notes */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Order Notes (Optional)</h2>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                className="mt-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Any special instructions for your order..."
                            />
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

                            {/* Items */}
                            <div className="mt-4 max-h-64 divide-y divide-gray-200 overflow-y-auto">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-3 py-3">
                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                                            {item.product?.image_url && (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{item.product?.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">
                                            ${(item.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <dl className="mt-6 space-y-3 border-t border-gray-200 pt-4">
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-600">Subtotal</dt>
                                    <dd className="text-sm font-medium text-gray-900">${subtotal.toLocaleString()}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-600">Shipping</dt>
                                    <dd className="text-sm font-medium text-gray-900">
                                        {shipping === 0 ? 'Free' : `$${shipping}`}
                                    </dd>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-3">
                                    <dt className="text-base font-semibold text-gray-900">Total</dt>
                                    <dd className="text-base font-semibold text-gray-900">${total.toLocaleString()}</dd>
                                </div>
                            </dl>

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-6 block w-full rounded-md bg-brand px-6 py-3 text-center text-sm font-semibold text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Place Order'}
                            </button>

                            <Link
                                href="/cart"
                                className="mt-3 block w-full text-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                ← Back to Cart
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </PublicLayout>
    );
}
