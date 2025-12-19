import { d } from '@/Support/dictionary';

function PlusIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function UpsellCard({ product, currency, onAdd }) {
    return (
        <div className="flex-shrink-0 w-32">
            <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <img
                    src={product.image_url || '/images/placeholder-product.svg'}
                    alt={product.name}
                    className="h-full w-full object-cover"
                />
                {product.has_discount && product.discount_percent > 0 && (
                    <div className="absolute left-1 top-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        -{product.discount_percent}%
                    </div>
                )}
            </div>
            <div className="mt-2">
                <p className="text-xs font-medium text-gray-900 line-clamp-2" title={product.name}>
                    {product.name}
                </p>
                <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs font-semibold text-gray-900">
                        {currency}{product.price?.toLocaleString()}
                    </span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-[10px] text-gray-500 line-through">
                            {currency}{product.compare_at_price?.toLocaleString()}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => onAdd(product.id)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                    <PlusIcon className="h-3 w-3" />
                    {d('cart.add', 'Add')}
                </button>
            </div>
        </div>
    );
}

export default function CartUpsells({ upsells, currency = '₹', onAdd }) {
    if (!upsells?.items?.length) {
        return null;
    }

    const titleMap = {
        'cart.upsells.title': d('cart.upsells.title', 'You may also like'),
        'cart.upsells.popular': d('cart.upsells.popular', 'Popular items'),
    };

    const title = titleMap[upsells.title_key] || d('cart.upsells.title', 'You may also like');

    return (
        <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {upsells.items.map((product) => (
                    <UpsellCard
                        key={product.id}
                        product={product}
                        currency={currency}
                        onAdd={onAdd}
                    />
                ))}
            </div>
        </div>
    );
}
