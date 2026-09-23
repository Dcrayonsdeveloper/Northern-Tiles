import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

export default function Edit({ room, defaultFloorBounds }) {
    const [imagePreview, setImagePreview] = useState(room.image_url);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: room.name,
        slug: room.slug,
        image: null,
        floor_bounds: room.floor_bounds || defaultFloorBounds,
        sort_order: room.sort_order || 0,
        is_active: room.is_active,
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFloorBoundsChange = (key, value) => {
        setData('floor_bounds', {
            ...data.floor_bounds,
            [key]: parseFloat(value) || 0,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.visualizer.update', room.id));
    };

    // Product search
    const searchProducts = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }
            setSearching(true);
            try {
                const response = await fetch(route('admin.visualizer.search-products') + `?q=${encodeURIComponent(query)}`);
                const results = await response.json();
                // Filter out already added products
                const existingIds = room.products?.map(p => p.id) || [];
                setSearchResults(results.filter(p => !existingIds.includes(p.id)));
            } catch (e) {
                console.error('Search failed:', e);
            }
            setSearching(false);
        }, 300),
        [room.products]
    );

    const handleProductSearchChange = (e) => {
        const value = e.target.value;
        setProductSearch(value);
        searchProducts(value);
    };

    const addProduct = (productId) => {
        router.post(route('admin.visualizer.add-product', room.id), { product_id: productId }, {
            preserveScroll: true,
            onSuccess: () => {
                setProductSearch('');
                setSearchResults([]);
            },
        });
    };

    const removeProduct = (productId) => {
        if (!confirm('Remove this product from the room?')) return;
        router.post(route('admin.visualizer.remove-product', room.id), { product_id: productId }, {
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout title={`Edit: ${room.name}`}>
            <Head title={`Edit Room: ${room.name}`} />

            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-gray-900">Edit Room Scene</div>
                    <p className="text-xs text-gray-500 mt-1">{room.name}</p>
                </div>
                <Link href={route('admin.visualizer.index')} className="btn-secondary">
                    ← Back to List
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Room Details</h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Room Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="admin-input w-full"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Slug
                            </label>
                            <input
                                type="text"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                className="admin-input w-full"
                            />
                            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Sort Order
                            </label>
                            <input
                                type="number"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                className="admin-input w-full"
                                min="0"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                />
                                <span className="text-xs font-medium text-gray-700">Active</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Room Image</h3>

                    <div className="flex gap-6">
                        <div className="flex-1">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="admin-input w-full"
                            />
                            {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
                            <p className="mt-2 text-[11px] text-gray-500">
                                Leave empty to keep current image.
                            </p>
                        </div>

                        {imagePreview && (
                            <div className="flex-shrink-0">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="h-32 w-48 object-cover rounded-lg border border-gray-200"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Floor Bounds (Advanced)</h3>
                    <p className="text-xs text-gray-500 mb-4">
                        Define where tiles should be rendered on the image (as percentages).
                    </p>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">X Position (%)</label>
                            <input
                                type="number"
                                value={data.floor_bounds?.x ?? 0}
                                onChange={(e) => handleFloorBoundsChange('x', e.target.value)}
                                className="admin-input w-full"
                                min="0"
                                max="100"
                                step="1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Y Position (%)</label>
                            <input
                                type="number"
                                value={data.floor_bounds?.y ?? 0}
                                onChange={(e) => handleFloorBoundsChange('y', e.target.value)}
                                className="admin-input w-full"
                                min="0"
                                max="100"
                                step="1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Width (%)</label>
                            <input
                                type="number"
                                value={data.floor_bounds?.width ?? 100}
                                onChange={(e) => handleFloorBoundsChange('width', e.target.value)}
                                className="admin-input w-full"
                                min="0"
                                max="100"
                                step="1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Height (%)</label>
                            <input
                                type="number"
                                value={data.floor_bounds?.height ?? 100}
                                onChange={(e) => handleFloorBoundsChange('height', e.target.value)}
                                className="admin-input w-full"
                                min="0"
                                max="100"
                                step="1"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link href={route('admin.visualizer.index')} className="btn-secondary">
                        Cancel
                    </Link>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Featured Products Section */}
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Featured Products (Optional)</h3>
                <p className="text-xs text-gray-500 mb-4">
                    Add products that will be shown first in the tile picker when this room is selected.
                </p>

                {/* Product Search */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search products to add..."
                        value={productSearch}
                        onChange={handleProductSearchChange}
                        className="admin-input w-full"
                    />
                    {searching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    )}

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
                            {searchResults.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => addProduct(product.id)}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
                                >
                                    {product.image_url ? (
                                        <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                                    ) : (
                                        <div className="h-8 w-8 rounded bg-gray-100" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-gray-900 truncate">{product.name}</div>
                                        <div className="text-[11px] text-gray-500">{product.sku}</div>
                                    </div>
                                    <span className="text-xs text-brand">+ Add</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Current Products */}
                {room.products?.length > 0 ? (
                    <div className="space-y-2">
                        {room.products.map((product) => (
                            <div
                                key={product.id}
                                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                            >
                                {product.image_url ? (
                                    <img src={product.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                                ) : (
                                    <div className="h-10 w-10 rounded bg-gray-100" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-900">{product.name}</div>
                                    <div className="text-[11px] text-gray-500">
                                        ${parseFloat(product.price || 0).toFixed(2)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeProduct(product.id)}
                                    className="text-xs text-red-600 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 text-center py-4">
                        No featured products. All products will be shown in the tile picker.
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
}
