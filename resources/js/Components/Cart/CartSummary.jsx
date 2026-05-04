import { d } from '@/Support/dictionary';

const fmt = (v) => parseFloat(v || 0).toFixed(2);

export default function CartSummary({ totals, shippingEstimate, appliedCoupon }) {
    const {
        subtotal,
        discount,
        shipping,
        sample_shipping = 0,
        sample_count = 0,
        tax,
        grand_total,
        currency_symbol: currency,
    } = totals;

    const nonSampleShipping = Math.max(0, parseFloat(shipping || 0) - parseFloat(sample_shipping || 0));

    return (
        <div className="space-y-2">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{d('cart.subtotal', 'Subtotal')}</span>
                <span className="font-medium text-gray-900">
                    {currency}{fmt(subtotal)}
                </span>
            </div>

            {/* Discount */}
            {discount > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                        {d('cart.discount', 'Discount')}
                        {appliedCoupon?.code && (
                            <span className="ml-1 text-green-600">({appliedCoupon.code})</span>
                        )}
                    </span>
                    <span className="font-medium text-green-600">
                        -{currency}{fmt(discount)}
                    </span>
                </div>
            )}

            {/* Shipping estimate (non-sample only) */}
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{d('cart.shipping', 'Shipping')}</span>
                <span className="font-medium text-gray-900">
                    {appliedCoupon?.gives_free_shipping ? (
                        <span className="text-green-600">{d('cart.free_with_coupon', 'Free (Coupon)')}</span>
                    ) : nonSampleShipping > 0 ? (
                        `${currency}${fmt(nonSampleShipping)}`
                    ) : parseFloat(subtotal || 0) > 0 ? (
                        <span className="text-green-600">{d('cart.free', 'Free')}</span>
                    ) : (
                        <span className="text-gray-500">—</span>
                    )}
                </span>
            </div>

            {/* Sample shipping (separate row when samples exist) */}
            {sample_count > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                        Sample shipping
                        <span className="ml-1 text-gray-400">({sample_count} sample{sample_count !== 1 ? 's' : ''})</span>
                    </span>
                    <span className="font-medium text-gray-900">
                        {currency}{fmt(sample_shipping)}
                    </span>
                </div>
            )}

            {/* Tax */}
            {tax > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{d('cart.tax', 'Tax')}</span>
                    <span className="font-medium text-gray-900">
                        {currency}{fmt(tax)}
                    </span>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 pt-2">
                {/* Grand total */}
                <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">
                        {d('cart.total', 'Total')}
                    </span>
                    <span className="text-base font-bold text-gray-900">
                        {currency}{fmt(grand_total)}
                    </span>
                </div>
            </div>
        </div>
    );
}
