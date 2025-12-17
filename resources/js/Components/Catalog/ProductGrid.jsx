import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({
    products,
    favoriteIds: initialFavoriteIds = [],
    onToggleFavorite,
    columns = { sm: 2, md: 3, lg: 4 },
    showFavorite = true,
    emptyMessage = 'No products found.'
}) {
    const [favoriteIds, setFavoriteIds] = useState(new Set(initialFavoriteIds));

    const gridColsClass = useMemo(() => {
        const colMap = {
            1: 'grid-cols-1',
            2: 'sm:grid-cols-2',
            3: 'md:grid-cols-3',
            4: 'lg:grid-cols-4',
            5: 'xl:grid-cols-5',
            6: '2xl:grid-cols-6',
        };
        return `grid-cols-1 ${colMap[columns.sm] || ''} ${colMap[columns.md] || ''} ${colMap[columns.lg] || ''}`;
    }, [columns]);

    const handleToggleFavorite = (productId, isFavorite) => {
        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (isFavorite) {
                next.add(productId);
            } else {
                next.delete(productId);
            }
            return next;
        });
        onToggleFavorite?.(productId, isFavorite);
    };

    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg
                    className="h-12 w-12 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                </svg>
                <p className="mt-4 text-sm text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`grid gap-4 ${gridColsClass}`}>
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favoriteIds.has(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    showFavorite={showFavorite}
                />
            ))}
        </div>
    );
}
