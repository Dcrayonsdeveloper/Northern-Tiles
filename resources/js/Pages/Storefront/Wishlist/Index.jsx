import Container from '@/Components/Container';
import ProductImage from '@/Components/Catalog/ProductImage';
import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

function HeartIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );
}

function TrashIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
        </svg>
    );
}

function WishlistCard({ product }) {
    const [busy, setBusy] = useState(false);
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

    const remove = () => {
        if (busy) return;
        setBusy(true);
        router.delete(route('wishlist.destroy', product.id), {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    const addToCart = () => {
        if (busy) return;
        setBusy(true);
        router.post(route('cart.store'), { product_id: product.id, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => {
                window.dispatchEvent(new CustomEvent('cart-updated'));
                window.dispatchEvent(new CustomEvent('open-cart-sidebar'));
            },
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <Link href={route('products.show', product.slug)} className="relative block aspect-square w-full overflow-hidden bg-gray-100">
                <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-contain transition-transform duration-500"
                />
                {!product.in_stock && (
                    <span className="absolute left-2 top-2 rounded-md bg-gray-800/90 px-2 py-1 text-[11px] font-semibold text-white">
                        Out of stock
                    </span>
                )}
            </Link>

            <div className="flex flex-1 flex-col p-4">
                <Link href={route('products.show', product.slug)} className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-brand">
                    {product.name}
                </Link>

                {product.category?.name ? (
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">{product.category.name}</div>
                ) : null}

                <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                        ${parseFloat(product.price || 0).toFixed(2)}
                    </span>
                    {product.unit_label ? <span className="text-[11px] text-gray-400">/ {product.unit_label}</span> : null}
                    {hasDiscount && (
                        <span className="text-xs text-gray-500 line-through">
                            ${parseFloat(product.compare_at_price || 0).toFixed(2)}
                        </span>
                    )}
                </div>

                {/* mt-auto pins the actions to the bottom, so buttons line up
                    across a row whatever the length of the product name. */}
                <div className="mt-auto flex items-center gap-2 pt-4">
                    <button
                        type="button"
                        onClick={addToCart}
                        disabled={busy || !product.in_stock}
                        className="flex-1 rounded-lg bg-brand px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Add to Cart
                    </button>
                    <button
                        type="button"
                        onClick={remove}
                        disabled={busy}
                        aria-label={`Remove ${product.name} from wishlist`}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                        <TrashIcon className="h-[18px] w-[18px]" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function WishlistIndex({ products = [] }) {
    return (
        <PublicLayout>
            <Head title="My Wishlist" />

            <section className="py-10">
                <Container>
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-gray-900">My Wishlist</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {products.length === 0
                                    ? 'Nothing saved yet.'
                                    : `${products.length} saved ${products.length === 1 ? 'product' : 'products'}.`}
                            </p>
                        </div>
                        <Link href="/shop" className="text-[13px] font-semibold text-brand hover:underline">
                            Continue shopping →
                        </Link>
                    </div>

                    {products.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
                            <HeartIcon className="mx-auto h-10 w-10 text-gray-300" />
                            <p className="mt-4 text-sm font-semibold text-gray-700">Your wishlist is empty</p>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                                Tap “Add to Wishlist” on any product to keep it here for later.
                            </p>
                            <Link
                                href="/shop"
                                className="mt-6 inline-block rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                            >
                                Browse the range
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {products.map((product) => (
                                <WishlistCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </Container>
            </section>
        </PublicLayout>
    );
}
