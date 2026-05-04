import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import MetaTags from '@/Components/SEO/MetaTags';
import SchemaOrg from '@/Components/SEO/SchemaOrg';
import FavoriteButton from '@/Components/Catalog/FavoriteButton';
import ProductGrid from '@/Components/Catalog/ProductGrid';
import APlusBlock from '@/Components/CMS/APlusBlock';
import api from '@/Support/api';

export default function ProductDetail({
    product,
    recommendations = [],
    recentlyViewed = [],
    isFavorite: initialFavorite = false,
    seoMeta,
    productSchema,
}) {
    const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isFavorite, setIsFavorite] = useState(initialFavorite);

    const images = product.images || [{ url: product.image_url, alt: product.name }];
    const hasVariants = product.variants && product.variants.length > 0;
    const currentPrice = selectedVariant?.price || product.price;
    const comparePrice = selectedVariant?.compare_at_price || product.compare_at_price;
    const inStock = (selectedVariant?.stock_quantity ?? product.stock_quantity) > 0;

    const handleAddToCart = async () => {
        setIsAddingToCart(true);
        try {
            await api.cart.add({
                product_id: product.id,
                variant_id: selectedVariant?.id,
                quantity,
            });
            window.dispatchEvent(new CustomEvent('cart-updated'));
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <PublicLayout>
            <MetaTags meta={seoMeta} />
            <SchemaOrg schema={productSchema} />
            <Head title={product.name} />

            {/* Breadcrumb */}
            <nav className="mb-6 text-sm">
                <ol className="flex items-center gap-2 text-gray-500">
                    <li><Link href="/" className="hover:text-brand">Home</Link></li>
                    <li>/</li>
                    <li><Link href="/shop" className="hover:text-brand">Shop</Link></li>
                    {product.category && (
                        <>
                            <li>/</li>
                            <li>
                                <Link href={route('shop.category', product.category.slug)} className="hover:text-brand">
                                    {product.category.name}
                                </Link>
                            </li>
                        </>
                    )}
                    <li>/</li>
                    <li className="text-gray-900">{product.name}</li>
                </ol>
            </nav>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Image Gallery */}
                <div>
                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                        {images[activeImage]?.url ? (
                            <img
                                src={images[activeImage].url}
                                alt={images[activeImage].alt || product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                                <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto">
                            {images.map((image, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveImage(idx)}
                                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-md ${
                                        activeImage === idx ? 'ring-2 ring-brand' : 'ring-1 ring-gray-200'
                                    }`}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.alt || `${product.name} ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <div className="flex items-start justify-between">
                        <div>
                            {product.category && (
                                <Link
                                    href={route('shop.category', product.category.slug)}
                                    className="text-sm font-medium text-brand hover:underline"
                                >
                                    {product.category.name}
                                </Link>
                            )}
                            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                                {product.name}
                            </h1>
                        </div>
                        <FavoriteButton
                            productId={product.id}
                            isFavorite={isFavorite}
                            onToggle={(id, fav) => setIsFavorite(fav)}
                            size="lg"
                        />
                    </div>

                    {/* Rating */}
                    {product.rating_avg !== undefined && product.rating_count > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        className={`h-5 w-5 ${
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
                            <span className="text-sm text-gray-500">
                                {product.rating_avg.toFixed(1)} ({product.rating_count} reviews)
                            </span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="mt-4 flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-gray-900">
                            ${currentPrice?.toLocaleString()}
                        </span>
                        {comparePrice && comparePrice > currentPrice && (
                            <>
                                <span className="text-xl text-gray-400 line-through">
                                    ${comparePrice.toLocaleString()}
                                </span>
                                <span className="rounded bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-600">
                                    {Math.round(((comparePrice - currentPrice) / comparePrice) * 100)}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    {/* Short Description */}
                    {product.short_description && (
                        <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                            {product.short_description}
                        </p>
                    )}

                    {/* Variants */}
                    {hasVariants && (
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-900">Options</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {product.variants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        type="button"
                                        onClick={() => setSelectedVariant(variant)}
                                        disabled={variant.stock_quantity === 0}
                                        className={`rounded-md border px-4 py-2 text-sm ${
                                            selectedVariant?.id === variant.id
                                                ? 'border-brand bg-brand/10 text-brand'
                                                : variant.stock_quantity === 0
                                                ? 'border-gray-200 bg-gray-50 text-gray-400'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {variant.name}
                                        {variant.stock_quantity === 0 && ' (Out of Stock)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity & Add to Cart */}
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                        <div className="flex items-center rounded-md border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>
                            <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => q + 1)}
                                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={!inStock || isAddingToCart}
                            className="flex-1 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isAddingToCart ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>

                    {/* Stock Status */}
                    <div className="mt-4">
                        {inStock ? (
                            <span className="inline-flex items-center gap-1 text-sm text-green-600">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                In Stock
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-sm text-red-600">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Out of Stock
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {product.tags.map((tag) => (
                                <Link
                                    key={tag.id || tag}
                                    href={`/shop?tag=${tag.slug || tag}`}
                                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
                                >
                                    {tag.name || tag}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Product Description */}
            {product.description && (
                <div className="mt-12">
                    <h2 className="text-xl font-bold text-gray-900">Description</h2>
                    <div
                        className="prose prose-sm mt-4 max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                </div>
            )}

            {/* A+ Content Blocks */}
            {product.content_blocks && product.content_blocks.length > 0 && (
                <div className="mt-12 space-y-8">
                    {product.content_blocks.map((block, idx) => (
                        <APlusBlock key={idx} block={block} />
                    ))}
                </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-xl font-bold text-gray-900">You May Also Like</h2>
                    <div className="mt-6">
                        <ProductGrid
                            products={recommendations}
                            columns={{ sm: 2, md: 3, lg: 4 }}
                        />
                    </div>
                </div>
            )}

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
                    <div className="mt-6">
                        <ProductGrid
                            products={recentlyViewed}
                            columns={{ sm: 2, md: 3, lg: 4 }}
                        />
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
