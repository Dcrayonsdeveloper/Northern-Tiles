import { Link } from '@inertiajs/react';

function MinusIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
    );
}

function PlusIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function TrashIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

export default function CartLineItem({
    item,
    currency = '₹',
    updating = false,
    onUpdateQuantity,
    onRemove,
}) {
    const { product, variant, quantity, price, line_total } = item;

    return (
        <div className={`flex gap-4 ${updating ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Product image */}
            <Link
                href={route('products.show', product.slug)}
                className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
                <img
                    src={product.image_url || '/images/placeholder-product.svg'}
                    alt={product.name}
                    className="h-full w-full object-cover"
                />
            </Link>

            {/* Product info */}
            <div className="flex flex-1 flex-col">
                <div className="flex justify-between">
                    <div>
                        <Link
                            href={route('products.show', product.slug)}
                            className="text-sm font-medium text-gray-900 hover:text-gray-700 line-clamp-2"
                        >
                            {product.name}
                        </Link>
                        {variant && (
                            <p className="mt-0.5 text-xs text-gray-500">{variant.name}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500"
                        disabled={updating}
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                    {/* Quantity stepper */}
                    <div className="flex items-center rounded-md border border-gray-200">
                        <button
                            type="button"
                            onClick={() => onUpdateQuantity(Math.max(1, quantity - 1))}
                            disabled={updating || quantity <= 1}
                            className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] px-2 text-center text-sm font-medium">
                            {quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => onUpdateQuantity(quantity + 1)}
                            disabled={updating || quantity >= 99}
                            className="p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                            {currency}{line_total?.toLocaleString()}
                        </p>
                        {quantity > 1 && (
                            <p className="text-xs text-gray-500">
                                {currency}{price?.toLocaleString()} each
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
