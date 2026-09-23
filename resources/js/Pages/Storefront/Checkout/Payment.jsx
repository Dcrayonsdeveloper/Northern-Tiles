import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from '@stripe/react-stripe-js';
import PublicLayout from '@/Layouts/PublicLayout';

function formatMoney(amount, currency) {
    try {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: currency || 'AUD',
        }).format(amount);
    } catch {
        return `${currency} ${Number(amount).toFixed(2)}`;
    }
}

function PaymentForm({ order, returnUrl }) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [ready, setReady] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Stripe.js loads asynchronously; submitting before it is ready would
        // silently do nothing and look like a dead button.
        if (!stripe || !elements || submitting) return;

        setSubmitting(true);
        setError(null);

        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: returnUrl },
        });

        // We only get here when the payment could NOT be completed — on
        // success Stripe redirects to return_url, where the server verifies
        // the intent before anything is marked paid. A card requiring 3-D
        // Secure also redirects, so no success branch belongs here.
        if (stripeError) {
            setError(
                stripeError.type === 'card_error' || stripeError.type === 'validation_error'
                    ? stripeError.message
                    : 'Something went wrong while processing your payment. You have not been charged.'
            );
        }

        setSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <PaymentElement onReady={() => setReady(true)} />

            {error && (
                <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800"
                >
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || !ready || submitting}
                className="w-full rounded-full bg-brand px-6 py-3.5 text-[15px] font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90"
            >
                {submitting
                    ? 'Processing…'
                    : `Pay ${formatMoney(order.total, order.currency)}`}
            </button>

            <p className="text-center text-[12px] text-[#777]">
                Payments are processed securely by Stripe. We never see or store your card details.
            </p>
        </form>
    );
}

export default function Payment({ order, publishableKey, intentUrl, returnUrl }) {
    const [clientSecret, setClientSecret] = useState(null);
    const [loadError, setLoadError] = useState(null);

    // loadStripe must not be called on every render — it injects a script tag
    // and returns a new promise each time.
    const stripePromise = useMemo(
        () => (publishableKey ? loadStripe(publishableKey) : null),
        [publishableKey]
    );

    const fetchIntent = useCallback(async () => {
        setLoadError(null);

        try {
            const response = await fetch(intentUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                },
                credentials: 'same-origin',
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                setLoadError(payload.message || 'We could not start the payment. Please try again.');
                return;
            }

            setClientSecret(payload.client_secret);
        } catch {
            setLoadError('We could not reach the payment service. Check your connection and try again.');
        }
    }, [intentUrl]);

    useEffect(() => {
        fetchIntent();
    }, [fetchIntent]);

    return (
        <PublicLayout>
            <Head title={`Payment · Order ${order.number}`} />

            <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
                <div className="mb-8 text-center">
                    <h1 className="text-[26px] font-semibold text-[#222]">Complete your payment</h1>
                    <p className="mt-2 text-[14px] text-[#666]">
                        Order <span className="font-medium text-[#333]">{order.number}</span>
                    </p>
                </div>

                <div className="mb-6 flex items-center justify-between rounded-lg bg-[#f7f7f7] px-5 py-4">
                    <span className="text-[14px] text-[#555]">Amount due</span>
                    <span className="text-[20px] font-semibold text-[#222]">
                        {formatMoney(order.total, order.currency)}
                    </span>
                </div>

                <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 shadow-sm">
                    {loadError && (
                        <div className="space-y-4">
                            <div
                                role="alert"
                                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800"
                            >
                                {loadError}
                            </div>
                            <button
                                type="button"
                                onClick={fetchIntent}
                                className="w-full rounded-full border border-[#ccc] px-6 py-3 text-[15px] font-medium text-[#333] transition hover:bg-[#f5f5f5]"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {!loadError && !clientSecret && (
                        <p className="py-8 text-center text-[14px] text-[#777]">
                            Loading secure payment form…
                        </p>
                    )}

                    {!loadError && clientSecret && stripePromise && (
                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: {
                                    theme: 'stripe',
                                    variables: { colorPrimary: '#085a9c', borderRadius: '8px' },
                                },
                            }}
                        >
                            <PaymentForm order={order} returnUrl={returnUrl} />
                        </Elements>
                    )}
                </div>

                <p className="mt-6 text-center text-[13px] text-[#888]">
                    Your order is saved. If payment fails you can return to this page and try again —
                    a receipt will be emailed to {order.email} once payment completes.
                </p>
            </div>
        </PublicLayout>
    );
}
