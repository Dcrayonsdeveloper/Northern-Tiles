import { useState } from 'react';
import { d } from '@/Support/dictionary';

function TagIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

export default function CouponInput({ appliedCoupon, currency = '$', onApply, onRemove }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const applyCoupon = async () => {
        if (!code.trim()) {
            setError(d('cart.coupon.enter_code', 'Please enter a coupon code'));
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/cart/coupon/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
                body: JSON.stringify({ code: code.trim().toUpperCase() }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(data.message);
                setCode('');
                if (onApply) {
                    onApply(data);
                }
            } else {
                setError(data.error || d('cart.coupon.invalid', 'Invalid coupon code'));
            }
        } catch (err) {
            setError(d('cart.coupon.error', 'Failed to apply coupon. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const removeCoupon = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/cart/coupon', {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'same-origin',
            });

            const data = await response.json();

            if (data.success) {
                if (onRemove) {
                    onRemove();
                }
            } else {
                setError(data.error || d('cart.coupon.remove_error', 'Failed to remove coupon'));
            }
        } catch (err) {
            setError(d('cart.coupon.error', 'Failed to remove coupon. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    // If coupon is applied, show applied state
    if (appliedCoupon) {
        return (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                        <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-green-800">
                                    {appliedCoupon.code}
                                </span>
                                {appliedCoupon.gives_free_shipping && (
                                    <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                        {d('cart.coupon.free_shipping', 'Free Shipping')}
                                    </span>
                                )}
                            </div>
                            {appliedCoupon.title && (
                                <p className="text-xs text-green-700 mt-0.5">
                                    {appliedCoupon.title}
                                </p>
                            )}
                            <p className="text-xs text-green-600 mt-1">
                                {d('cart.coupon.you_save', 'You save')} {currency}{appliedCoupon.discount_amount?.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={removeCoupon}
                        disabled={loading}
                        className="rounded p-1 text-green-600 hover:bg-green-100 hover:text-green-700 disabled:opacity-50"
                        aria-label={d('cart.coupon.remove', 'Remove coupon')}
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                    {d('cart.coupon.title', 'Discount Code')}
                </span>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setError('');
                        setSuccess('');
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            applyCoupon();
                        }
                    }}
                    placeholder={d('cart.coupon.placeholder', 'Enter code')}
                    className="flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-gray-500 focus:ring-gray-500 uppercase placeholder:normal-case"
                    disabled={loading}
                />
                <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={loading || !code.trim()}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center gap-1">
                            <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                        </span>
                    ) : (
                        d('cart.coupon.apply', 'Apply')
                    )}
                </button>
            </div>

            {/* Error message */}
            {error && (
                <p className="text-xs text-red-600">
                    {error}
                </p>
            )}

            {/* Success message */}
            {success && (
                <p className="text-xs text-green-600">
                    {success}
                </p>
            )}
        </div>
    );
}
