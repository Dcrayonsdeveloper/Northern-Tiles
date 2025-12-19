import { Link } from '@inertiajs/react';
import FavoriteButton from './FavoriteButton';
import { StarRating } from './StarRating';

export default function ProductCard({ product, isFavorite, onToggleFavorite, showFavorite = true }) {
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    return (
        <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            {/* Image Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img
                    src={product.image_url || '/images/placeholder-product.svg'}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { e.target.src = '/images/placeholder-product.svg'; }}
                />

                {/* Badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {hasDiscount && (
                        <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                            -{discountPercent}%
                        </span>
                    )}
                    {product.is_new && (
                        <span className="rounded bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                            New
                        </span>
                    )}
                    {product.stock_quantity === 0 && (
                        <span className="rounded bg-gray-500 px-2 py-0.5 text-xs font-semibold text-white">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Favorite Button */}
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

            {/* Content */}
            <div className="p-4">
                {/* Category */}
                {product.category?.name && (
                    <div className="mb-1 text-xs font-medium text-gray-500">
                        {product.category.name}
                    </div>
                )}

                {/* Title */}
                <Link
                    href={route('products.show', product.slug)}
                    className="block text-sm font-semibold text-gray-900 hover:text-brand line-clamp-2"
                >
                    {product.name}
                </Link>

                {/* Short Description */}
                {product.short_description && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                        {product.short_description}
                    </p>
                )}

                {/* Rating */}
                {(product.average_rating > 0 || product.rating_avg > 0) && (product.review_count > 0 || product.rating_count > 0) && (
                    <div className="mt-2">
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
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-gray-900">
                            ₹{product.price?.toLocaleString()}
                        </span>
                        {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through">
                                ₹{product.compare_at_price?.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <Link
                    href={route('products.show', product.slug)}
                    className="mt-3 block w-full rounded-md bg-gray-900 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
}
