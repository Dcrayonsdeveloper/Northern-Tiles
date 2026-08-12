import BuilderLayout from '@/Layouts/BuilderLayout';
import Container from '@/Components/Container';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

/**
 * Trade checkout page. Same server-side pipeline as retail checkout —
 * BuilderCheckoutController extends the retail one and hands the cart to the
 * same CheckoutService::processCheckout, so no payment integration is
 * duplicated. Only the presentation and the extra trade fields (PO number,
 * deliver-to-site, invoice payment method) live here.
 */
export default function Index({
    items = [],
    totals = {},
    shippingMethods = [],
    paymentMethods = [],
    isGuest = true,
    user = null,
}) {
    const { auth } = usePage().props;

    // Trade orders always require login (BuilderMiddleware). If we somehow
    // got here without an authenticated user, prefill sensibly anyway.
    const initialUser = user || {
        name: auth?.user?.name ?? '',
        email: auth?.user?.email ?? '',
        phone: auth?.user?.phone ?? '',
    };

    const form = useForm({
        contact: {
            name: initialUser.name ?? '',
            email: initialUser.email ?? '',
            phone: initialUser.phone ?? '',
        },
        shipping_address: {
            name: initialUser.name ?? '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Australia',
            phone: initialUser.phone ?? '',
        },
        billing_same_as_shipping: true,
        shipping_method: shippingMethods?.[0]?.id ?? 'standard',
        payment_method: 'invoice',
        notes: '',
        po_number: '',
        deliver_to_site: false,
        marketing_opt_in: false,
    });

    const grandTotal = useMemo(() => {
        return Number(totals?.grand_total ?? totals?.subtotal ?? 0);
    }, [totals]);

    const submit = (e) => {
        e.preventDefault();
        form.post(route('builder.checkout.store'), {
            preserveScroll: true,
        });
    };

    // Trade payment methods — server accepts 'cod', 'upi', 'card', 'invoice'
    // when channel === 'trade'. Retail POSTs cannot smuggle in 'invoice'
    // (validator rejects on channel === 'retail').
    const tradePaymentMethods = [
        { id: 'invoice', label: 'Invoice (Net-30)' },
        { id: 'card', label: 'Credit / Debit Card' },
        { id: 'cod', label: 'Cash on Delivery' },
    ];

    return (
        <BuilderLayout title="Trade Checkout">
            <Head title="Trade Checkout" />
            <Container>
                <div className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-3">
                    <form onSubmit={submit} className="lg:col-span-2 space-y-6">
                        <h1 className="text-2xl font-bold text-gray-900">Trade Checkout</h1>

                        {/* Contact */}
                        <section className="rounded-lg border bg-white p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Contact</h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Full name" error={form.errors['contact.name']}>
                                    <input
                                        type="text"
                                        value={form.data.contact.name}
                                        onChange={(e) => form.setData('contact', { ...form.data.contact, name: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                </Field>
                                <Field label="Email" error={form.errors['contact.email']}>
                                    <input
                                        type="email"
                                        value={form.data.contact.email}
                                        onChange={(e) => form.setData('contact', { ...form.data.contact, email: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                </Field>
                                <Field label="Phone">
                                    <input
                                        type="tel"
                                        value={form.data.contact.phone}
                                        onChange={(e) => form.setData('contact', { ...form.data.contact, phone: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    />
                                </Field>
                                <Field label="Purchase Order # (optional)">
                                    <input
                                        type="text"
                                        value={form.data.po_number}
                                        onChange={(e) => form.setData('po_number', e.target.value)}
                                        placeholder="PO-2026-01234"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    />
                                </Field>
                            </div>
                        </section>

                        {/* Delivery */}
                        <section className="rounded-lg border bg-white p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Delivery address</h2>
                            <label className="mb-4 flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={form.data.deliver_to_site}
                                    onChange={(e) => form.setData('deliver_to_site', e.target.checked)}
                                    className="rounded border-gray-300 text-brand focus:ring-brand"
                                />
                                Deliver to build site (not the account address)
                            </label>
                            <AddressFields
                                address={form.data.shipping_address}
                                onChange={(addr) => form.setData('shipping_address', addr)}
                                errors={form.errors}
                            />
                        </section>

                        {/* Payment method */}
                        <section className="rounded-lg border bg-white p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Payment</h2>
                            <div className="space-y-2">
                                {tradePaymentMethods.map((m) => (
                                    <label key={m.id} className="flex items-center gap-3 rounded border p-3 cursor-pointer hover:border-brand">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value={m.id}
                                            checked={form.data.payment_method === m.id}
                                            onChange={() => form.setData('payment_method', m.id)}
                                            className="text-brand focus:ring-brand"
                                        />
                                        <span className="text-sm font-medium text-gray-900">{m.label}</span>
                                    </label>
                                ))}
                            </div>
                            {form.errors.payment_method && (
                                <p className="mt-2 text-sm text-red-600">{form.errors.payment_method}</p>
                            )}
                        </section>

                        {/* Notes */}
                        <section className="rounded-lg border bg-white p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Order notes (optional)</h2>
                            <textarea
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                rows={3}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Site access, delivery times, forklift on site, etc."
                            />
                        </section>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full rounded-md bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {form.processing ? 'Placing trade order…' : 'Place trade order'}
                        </button>
                    </form>

                    {/* Order summary */}
                    <aside className="rounded-lg border bg-white p-6 shadow-sm h-fit lg:sticky lg:top-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">Order summary</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {items.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.name || item.product?.name}</p>
                                        <p className="text-xs text-gray-500">{item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900">${parseFloat(item.line_total ?? (item.price * item.quantity)).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 space-y-2 border-t pt-4 text-sm">
                            <SummaryRow label="Subtotal (trade)" value={totals?.subtotal} />
                            {totals?.discount > 0 && <SummaryRow label="Discount" value={-Math.abs(totals.discount)} />}
                            {totals?.shipping !== undefined && <SummaryRow label="Shipping" value={totals.shipping} />}
                            {totals?.tax !== undefined && <SummaryRow label="Tax" value={totals.tax} />}
                            <div className="mt-2 flex items-center justify-between border-t pt-3 text-base font-bold text-gray-900">
                                <span>Total</span>
                                <span>${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-gray-500">
                            Trade orders are invoiced and dispatched per your account's payment terms.
                        </p>
                    </aside>
                </div>
            </Container>
        </BuilderLayout>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
            {children}
            {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
        </label>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex items-center justify-between text-gray-700">
            <span>{label}</span>
            <span>${parseFloat(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
    );
}

function AddressFields({ address, onChange, errors }) {
    const set = (key, value) => onChange({ ...address, [key]: value });
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Full name</span>
                <input type="text" value={address.name || ''} onChange={(e) => set('name', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand" required />
            </label>
            <label className="sm:col-span-2 block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Address line 1</span>
                <input type="text" value={address.address_line_1 || ''} onChange={(e) => set('address_line_1', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand" required />
                {errors['shipping_address.address_line_1'] && <span className="mt-1 block text-sm text-red-600">{errors['shipping_address.address_line_1']}</span>}
            </label>
            <label className="sm:col-span-2 block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Address line 2</span>
                <input type="text" value={address.address_line_2 || ''} onChange={(e) => set('address_line_2', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand" />
            </label>
            <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">City</span>
                <input type="text" value={address.city || ''} onChange={(e) => set('city', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand" required />
            </label>
            <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">State</span>
                <input type="text" value={address.state || ''} onChange={(e) => set('state', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand" required />
            </label>
            <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Postal code</span>
                <input type="text" value={address.postal_code || ''} onChange={(e) => set('postal_code', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand" required />
            </label>
            <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Country</span>
                <input type="text" value={address.country || 'Australia'} onChange={(e) => set('country', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand" required />
            </label>
        </div>
    );
}
