import { d } from '@/Support/dictionary';

const fmt = (v) => parseFloat(v || 0).toFixed(2);

export default function CartSummary({ totals, shippingEstimate, appliedCoupon }) {
    const {
        subtotal,
        discount,
        shipping,
        shipping_method,
        shipping_quote_required: deliveryQuoted = false,
        sample_count = 0,
        tax,
        grand_total,
        currency_symbol: currency,
    } = totals;

    const samplesOnly = shipping_method === 'sample-flat';

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

            {/* Delivery. Samples on their own ship for a flat fee; anything
                else is quoted after the order, and any samples go with it. */}
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                    {samplesOnly ? (
                        <>
                            Sample shipping
                            <span className="ml-1 text-gray-400">({sample_count} sample{sample_count !== 1 ? 's' : ''})</span>
                        </>
                    ) : d('cart.shipping', 'Shipping')}
                </span>
                <span className="font-medium text-gray-900">
                    {deliveryQuoted ? (
                        <span className="text-amber-700">{d('cart.delivery_quoted', 'To be quoted')}</span>
                    ) : shipping_method === 'free-shipping' ? (
                        <span className="text-green-600">{d('cart.free_with_coupon', 'Free (Coupon)')}</span>
                    ) : parseFloat(shipping || 0) > 0 ? (
                        `${currency}${fmt(shipping)}`
                    ) : (
                        <span className="text-gray-500">—</span>
                    )}
                </span>
            </div>

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
                {deliveryQuoted && (
                    <p className="mt-1 text-right text-[11px] text-gray-500">
                        {d('cart.delivery_excluded', 'Excludes delivery, quoted after you order.')}
                    </p>
                )}
            </div>
        </div>
    );
}
