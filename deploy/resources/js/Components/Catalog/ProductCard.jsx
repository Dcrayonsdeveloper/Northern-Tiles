import { Link } from '@inertiajs/react';
import FavoriteButton from './FavoriteButton';

export default function ProductCard({ product, isFavorite, onToggleFavorite, showFavorite = true }) {
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    return (
        <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            {/* Image Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

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
                {product.rating_avg !== undefined && product.rating_count > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                    key={star}
                                    className={`h-3.5 w-3.5 ${
                                        star <= Math.round(product.rating_avg)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">({product.rating_count})</span>
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
