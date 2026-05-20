import { useCallback, useEffect, useRef, useState } from 'react';
import { d } from '@/Support/dictionary';

// ─── Icons ────────────────────────────────────────────────────────────────────

function TagIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
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

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function CopyIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    );
}

function ChevronIcon({ className, open }) {
    return (
        <svg
            className={`${className} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}

function jsonHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrfToken(),
    };
}

function formatDiscount(coupon, currency) {
    if (coupon.gives_free_shipping) return 'Free Shipping';
    if (coupon.type === 'percentage') return `${coupon.value}% Off`;
    if (coupon.type === 'fixed_amount') return `${currency}${coupon.value} Off`;
    return coupon.title || coupon.code;
}

function formatMin(coupon, currency) {
    if (!coupon.minimum_purchase || coupon.minimum_purchase <= 0) return null;
    return `Min. ${currency}${parseFloat(coupon.minimum_purchase).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Available Offer Row ──────────────────────────────────────────────────────

function OfferRow({ coupon, currency, copiedCode, onCopy, onApply, applyingCode }) {
    const isCopied = copiedCode === coupon.code;
    const isApplying = applyingCode === coupon.code;
    const anyApplying = Boolean(applyingCode);
    const minLabel = formatMin(coupon, currency);

    return (
        <div className={`rounded-lg border px-3 py-2.5 transition-colors ${
            coupon.qualifies
                ? 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                : 'border-dashed border-gray-200 bg-gray-50 opacity-70'
        }`}>
            <div className="flex items-start gap-2">

                {/* Left: code + copy icon + badges + description */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`font-mono text-xs font-bold tracking-wide ${coupon.qualifies ? 'text-gray-900' : 'text-gray-500'}`}>
                            {coupon.code}
                        </span>

                        {/* Inline clipboard copy button */}
                        <span className="group relative inline-flex">
                            <button
                                type="button"
                                onClick={() => onCopy(coupon.code)}
                                aria-label={isCopied ? 'Copied!' : `Copy ${coupon.code}`}
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all active:scale-90 touch-manipulation ${
                                    isCopied
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            >
                                {isCopied
                                    ? <CheckIcon className="h-3 w-3 text-green-500" />
                                    : <CopyIcon className="h-3 w-3 text-gray-500" />
                                }
                            </button>
                            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100">
                                {isCopied ? 'Copied!' : 'Copy'}
                                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                            </span>
                        </span>

                        {coupon.first_order_only && (
                            <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-700">
                                First order
                            </span>
                        )}
                        {coupon.gives_free_shipping && (
                            <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-semibold text-green-700">
                                Free shipping
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 leading-snug">
                        {formatDiscount(coupon, currency)}
                        {minLabel && <span className="ml-1 text-gray-400">· {minLabel}</span>}
                    </p>
                </div>

                {/* Right: Apply button */}
                <button
                    type="button"
                    onClick={() => onApply(coupon.code)}
                    disabled={!coupon.qualifies || anyApplying}
                    title={!coupon.qualifies ? (minLabel ? `Add more items to reach ${minLabel}` : 'Not eligible') : 'Apply this coupon'}
                    className={`mt-0.5 shrink-0 rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                        isApplying
                            ? 'cursor-wait bg-gray-100 text-gray-500'
                            : coupon.qualifies && !anyApplying
                                ? 'bg-gray-900 text-white hover:bg-gray-700 active:scale-95'
                                : 'cursor-not-allowed bg-gray-100 text-gray-400'
                    }`}
                >
                    {isApplying ? (
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                            Applying…
                        </span>
                    ) : 'Apply'}
                </button>

            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CouponInput({ appliedCoupon, currency = '$', onApply, onRemove }) {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState(null);   // { type: 'success'|'error', msg }
    const [action, setAction] = useState(null);    // 'apply' | 'remove' | null (for the text input)
    const [applyingCode, setApplyingCode] = useState(null); // which offer row is applying
    const [offers, setOffers] = useState([]);
    const [showOffers, setShowOffers] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);
    const inflight = useRef(false);
    const statusTimer = useRef(null);

    // Fetch available offers on mount
    useEffect(() => {
        let cancelled = false;
        fetch('/api/cart/coupons', {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (!cancelled && data?.coupons) setOffers(data.coupons); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const showStatus = useCallback((type, msg, ms = 3500) => {
        if (statusTimer.current) clearTimeout(statusTimer.current);
        setStatus({ type, msg });
        statusTimer.current = setTimeout(() => setStatus(null), ms);
    }, []);

    // ── Apply from text input ──────────────────────────────────────────────────
    const applyCoupon = useCallback(async (codeOverride) => {
        const target = (codeOverride ?? code).trim().toUpperCase();
        if (!target || inflight.current) return;
        inflight.current = true;
        setAction('apply');
        setStatus(null);

        try {
            const res = await fetch('/api/cart/coupon/apply', {
                method: 'POST',
                headers: jsonHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify({ code: target }),
            });
            const data = await res.json();

            if (data.success) {
                setCode('');
                setShowOffers(false);
                if (onApply) onApply(data);
            } else {
                showStatus('error', data.error || d('cart.coupon.invalid', 'Invalid coupon code'));
            }
        } catch {
            showStatus('error', d('cart.coupon.error', 'Failed to apply coupon. Please try again.'));
        } finally {
            inflight.current = false;
            setAction(null);
        }
    }, [code, onApply, showStatus]);

    // ── Apply from offer row button ────────────────────────────────────────────
    const applyFromOffers = useCallback(async (offerCode) => {
        const target = offerCode.trim().toUpperCase();
        if (!target || inflight.current) return;
        inflight.current = true;
        setApplyingCode(target);
        setStatus(null);

        try {
            const res = await fetch('/api/cart/coupon/apply', {
                method: 'POST',
                headers: jsonHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify({ code: target }),
            });
            const data = await res.json();

            if (data.success) {
                setCode('');
                setShowOffers(false);
                if (onApply) onApply(data);
            } else {
                showStatus('error', data.error || d('cart.coupon.invalid', 'Invalid coupon code'));
            }
        } catch {
            showStatus('error', d('cart.coupon.error', 'Failed to apply coupon. Please try again.'));
        } finally {
            inflight.current = false;
            setApplyingCode(null);
        }
    }, [onApply, showStatus]);

    // ── Remove ─────────────────────────────────────────────────────────────────
    const removeCoupon = useCallback(async () => {
        if (inflight.current) return;
        inflight.current = true;
        setAction('remove');
        setStatus(null);

        try {
            const res = await fetch('/api/cart/coupon', {
                method: 'DELETE',
                headers: jsonHeaders(),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                if (onRemove) onRemove(data);
                showStatus('success', d('cart.coupon.removed', 'Coupon removed successfully'));
            } else {
                showStatus('error', data.error || 'Unable to remove coupon. Please try again.');
            }
        } catch {
            showStatus('error', 'Unable to remove coupon. Please try again.');
        } finally {
            inflight.current = false;
            setAction(null);
        }
    }, [onRemove, showStatus]);

    // ── Copy to clipboard ─────────────────────────────────────────────────────
    const copyCode = useCallback(async (text) => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const el = document.createElement('textarea');
                el.value = text;
                el.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            }
            setCopiedCode(text);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch {}
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Render: Applied state
    // ─────────────────────────────────────────────────────────────────────────
    if (appliedCoupon) {
        return (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-sm font-bold text-green-800">
                                    {appliedCoupon.code}
                                </span>
                                {appliedCoupon.gives_free_shipping && (
                                    <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                        Free Shipping
                                    </span>
                                )}
                            </div>
                            {appliedCoupon.title && (
                                <p className="mt-0.5 text-xs text-green-700">{appliedCoupon.title}</p>
                            )}
                            {appliedCoupon.discount_amount > 0 && (
                                <p className="mt-0.5 text-xs font-medium text-green-600">
                                    {d('cart.coupon.you_save', 'You save')} {currency}
                                    {parseFloat(appliedCoupon.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            )}
                            {status?.type === 'error' && (
                                <p className="mt-1 text-xs text-red-600">{status.msg}</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={removeCoupon}
                        disabled={action === 'remove'}
                        className="shrink-0 rounded p-1 text-green-600 hover:bg-green-100 hover:text-green-800 disabled:opacity-50"
                        aria-label={d('cart.coupon.remove', 'Remove coupon')}
                        title="Remove coupon"
                    >
                        {action === 'remove' ? (
                            <span className="block h-4 w-4 animate-spin rounded-full border border-green-600 border-t-transparent" />
                        ) : (
                            <XIcon className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render: Input + Available Offers
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center gap-1.5">
                <TagIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                    {d('cart.coupon.title', 'Discount Code')}
                </span>
            </div>

            {/* Success message after removal */}
            {status?.type === 'success' && (
                <div className="flex items-center gap-1.5 rounded-md bg-green-50 px-3 py-2">
                    <CheckIcon className="h-3.5 w-3.5 text-green-600" />
                    <p className="text-xs font-medium text-green-700">{status.msg}</p>
                </div>
            )}

            {/* Input row */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setStatus(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                    placeholder={d('cart.coupon.placeholder', 'Enter code')}
                    className="flex-1 rounded-md border-gray-300 text-sm uppercase placeholder:normal-case shadow-sm focus:border-gray-500 focus:ring-gray-500 disabled:bg-gray-50"
                    disabled={action === 'apply'}
                />
                <button
                    type="button"
                    onClick={() => applyCoupon()}
                    disabled={!code.trim() || action === 'apply'}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {action === 'apply' ? (
                        <span className="flex items-center gap-1.5">
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                        </span>
                    ) : (
                        d('cart.coupon.apply', 'Apply')
                    )}
                </button>
            </div>

            {/* Error message */}
            {status?.type === 'error' && (
                <p className="text-xs text-red-600">{status.msg}</p>
            )}

            {/* Available Offers toggle */}
            {offers.length > 0 && (
                <div>
                    <button
                        type="button"
                        onClick={() => setShowOffers(v => !v)}
                        className="flex w-full items-center justify-between rounded-md px-1 py-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                        <span>Available Offers ({offers.length})</span>
                        <ChevronIcon className="h-3.5 w-3.5" open={showOffers} />
                    </button>

                    {showOffers && (
                        <div className="mt-2 space-y-1.5">
                            {offers.map((offer) => (
                                <OfferRow
                                    key={offer.code}
                                    coupon={offer}
                                    currency={currency}
                                    copiedCode={copiedCode}
                                    applyingCode={applyingCode}
                                    onCopy={copyCode}
                                    onApply={applyFromOffers}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
