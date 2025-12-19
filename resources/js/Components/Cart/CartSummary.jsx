import { d } from '@/Support/dictionary';

export default function CartSummary({ totals, shippingEstimate, appliedCoupon }) {
    const {
        subtotal,
        discount,
        shipping,
        tax,
        grand_total,
        currency_symbol: currency,
    } = totals;

    return (
        <div className="space-y-2">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{d('cart.subtotal', 'Subtotal')}</span>
                <span className="font-medium text-gray-900">
                    {currency}{subtotal?.toLocaleString()}
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
                        -{currency}{discount?.toLocaleString()}
                    </span>
                </div>
            )}

            {/* Shipping estimate */}
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{d('cart.shipping', 'Shipping')}</span>
                <span className="font-medium text-gray-900">
                    {appliedCoupon?.gives_free_shipping ? (
                        <span className="text-green-600">{d('cart.free_with_coupon', 'Free (Coupon)')}</span>
                    ) : shippingEstimate?.is_free ? (
                        <span className="text-green-600">{d('cart.free', 'Free')}</span>
                    ) : shippingEstimate?.estimated > 0 ? (
                        `${currency}${shippingEstimate.estimated?.toLocaleString()}`
                    ) : (
                        <span className="text-gray-500">{d('cart.calculated_at_checkout', 'Calculated at checkout')}</span>
                    )}
                </span>
            </div>

            {/* Tax */}
            {tax > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{d('cart.tax', 'Tax')}</span>
                    <span className="font-medium text-gray-900">
                        {currency}{tax?.toLocaleString()}
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
                        {currency}{grand_total?.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
