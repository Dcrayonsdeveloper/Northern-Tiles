import { Link, usePage } from '@inertiajs/react';
import { useCallback } from 'react';
import ProductCard from '@/Components/Catalog/ProductCard';

// Dictionary helper
function useDict() {
    const { dictionary } = usePage().props;
    return useCallback((key, fallback = '') => {
        return dictionary?.items?.[key] ?? fallback ?? key;
    }, [dictionary]);
}

export default function NewArrivals({ data }) {
    const d = useDict();

    const products = data?.products || [];
    const titleKey = data?.title_key || 'home.new_arrivals.title';
    const title = d(titleKey, 'New Arrivals');

    if (!products.length) {
        return null;
    }

    return (
        <section className="new-arrivals py-8">
            <div className="flex items-end justify-between mb-5">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                <Link
                    href={route('shop.index', { sort: 'newest' })}
                    className="text-sm font-medium text-brand hover:text-brand/80"
                >
                    {d('home.view_all', 'View all')}
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
}
