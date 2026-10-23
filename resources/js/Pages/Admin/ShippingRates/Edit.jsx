import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';

/**
 * Delivery charges staff can change without a deploy.
 *
 * An order with tiles pays the rate for the state it is going to, once per
 * order. A state left blank has no rate: its orders are quoted by the team
 * after they are placed, the same as when nothing here is filled in. An order
 * of nothing but samples pays the samples rate wherever it goes.
 */
export default function Edit({ sampleRate, stateRates = {}, states = {} }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        sample_rate: sampleRate ?? '',
        state_rates: Object.fromEntries(
            Object.keys(states).map((code) => [code, stateRates[code] ?? '']),
        ),
    });

    const setRate = (code, value) => setData('state_rates', { ...data.state_rates, [code]: value });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.shipping-rates.update'), { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Shipping Rates">
            <Head title="Shipping Rates" />

            <form onSubmit={submit} className="max-w-2xl space-y-4">
                <div className="admin-card">
                    <div className="text-sm font-semibold text-gray-900">Sample orders</div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                        A flat charge for an order of nothing but samples, anywhere in Australia. Samples ordered with tiles travel with the tiles at no charge.
                    </p>

                    <label htmlFor="sample-rate" className="mt-3 block text-xs font-medium text-gray-700">
                        Samples flat rate (AUD)
                    </label>
                    <input
                        id="sample-rate"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={data.sample_rate}
                        onChange={(e) => setData('sample_rate', e.target.value)}
                        className="admin-input mt-1 w-40 text-xs"
                        required
                    />
                    {errors.sample_rate ? (
                        <p className="mt-1 text-[11px] text-red-600">{errors.sample_rate}</p>
                    ) : null}
                </div>

                <div className="admin-card">
                    <div className="text-sm font-semibold text-gray-900">Tile orders by state / territory</div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                        Charged once per order, by the delivery address. Leave a state blank to quote its deliveries after the order instead.
                    </p>

                    <div className="mt-3 divide-y divide-gray-100">
                        {Object.entries(states).map(([code, name]) => (
                            <div key={code} className="flex items-center justify-between gap-4 py-2">
                                <label htmlFor={`rate-${code}`} className="text-xs text-gray-700">
                                    <span className="font-semibold text-gray-900">{code}</span>
                                    <span className="ml-1.5 text-gray-500">{name}</span>
                                </label>
                                <div className="w-36">
                                    <input
                                        id={`rate-${code}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={data.state_rates[code]}
                                        onChange={(e) => setRate(code, e.target.value)}
                                        placeholder="Quote"
                                        className="admin-input w-full text-right text-xs"
                                    />
                                    {errors[`state_rates.${code}`] ? (
                                        <p className="mt-1 text-[11px] text-red-600">{errors[`state_rates.${code}`]}</p>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    {recentlySuccessful ? <span className="text-[11px] text-emerald-600">Saved</span> : null}
                    <button type="submit" disabled={processing} className="btn-primary disabled:opacity-50">
                        {processing ? 'Saving…' : 'Save rates'}
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
