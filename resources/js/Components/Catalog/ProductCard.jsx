import { Link, router } from '@inertiajs/react';
import FavoriteButton from './FavoriteButton';
import { StarRating } from './StarRating';

export default function ProductCard({ product, isFavorite, onToggleFavorite, showFavorite = true }) {
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    const addToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.post(route('cart.store'), { product_id: product.id, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => {
                window.dispatchEvent(new CustomEvent('cart-updated'));
                window.dispatchEvent(new CustomEvent('open-cart-sidebar'));
            },
        });
    };

    return (
        <div className="group relative overflow-hidden rounded-none border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            {/* Image */}
            <Link href={route('products.show', product.slug)} className="block">
                <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                    <img
                        src={product.image_url || '/images/placeholder-product.svg'}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/images/placeholder-product.svg'; }}
                    />

                    {/* Discount badge — top left pill */}
                    {hasDiscount && (
                        <div className="absolute left-0 top-3">
                            <span className="rounded-r-full bg-brand px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                                {discountPercent}% off
                            </span>
                        </div>
                    )}

                    {product.is_new && !hasDiscount && (
                        <div className="absolute left-0 top-3">
                            <span className="rounded-r-full bg-green-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                                New
                            </span>
                        </div>
                    )}

                    {product.stock_quantity === 0 && (
                        <div className="absolute left-0 top-3">
                            <span className="rounded-r-full bg-gray-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                                Out of Stock
                            </span>
                        </div>
                    )}

                    {/* Favorite */}
                    {showFavorite && (
                        <div className="absolute right-2 top-2">
                            <FavoriteButton
                                productId={product.id}
                                isFavorite={isFavorite}
                                onToggle={onToggleFavorite}
                                size="sm"
                            />
                        </div>
                    )}
                </div>
            </Link>

            {/* Content */}
            <div className="p-3">
                {/* Title */}
                <Link
                    href={route('products.show', product.slug)}
                    className="block text-[13px] font-semibold text-gray-900 hover:text-brand line-clamp-2 min-h-[36px]"
                >
                    {product.name}
                </Link>

                {/* Rating */}
                {(product.average_rating > 0 || product.rating_avg > 0) && (product.review_count > 0 || product.rating_count > 0) && (
                    <div className="mt-1.5">
                        <StarRating
                            rating={product.average_rating || product.rating_avg || 0}
                            size="xs"
                            showCount={true}
                            reviewCount={product.review_count || product.rating_count || 0}
                            usePrimaryColor={true}
                        />
                    </div>
                )}

                {/* Price */}
                <div className="mt-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[16px] font-bold text-gray-900">
                            ${parseFloat(product.price || 0).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-gray-400">/ sqm</span>
                        {hasDiscount && (
                            <span className="text-[13px] text-gray-400 line-through">
                                ${parseFloat(product.compare_at_price || 0).toFixed(2)}
                            </span>
                        )}
                    </div>
                    {hasDiscount && (
                        <p className="mt-0.5 text-[12px] font-medium text-green-600">
                            Save {discountPercent}%
                        </p>
                    )}
                </div>

                {/* Add to Cart */}
                <button
                    type="button"
                    onClick={addToCart}
                    className="mt-3 block w-full rounded-none bg-brand px-3 py-2.5 text-center text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
}
