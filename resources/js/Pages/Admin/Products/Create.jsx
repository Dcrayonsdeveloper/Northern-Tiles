import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

// Tag Input Component (simplified for create)
function TagInput({ tags = [], onChange, popularTags = [] }) {
    const [input, setInput] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input.trim());
        } else if (e.key === 'Backspace' && !input && tags.length) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = (name) => {
        if (!name || tags.some(t => t.name?.toLowerCase() === name.toLowerCase() || t.toLowerCase?.() === name.toLowerCase())) return;
        onChange([...tags, name]);
        setInput('');
    };

    const removeTag = (index) => {
        onChange(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="admin-card">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Tags</h3>

            <div className="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-md min-h-[38px] focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                {tags.map((tag, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-full"
                    >
                        {typeof tag === 'string' ? tag : tag.name}
                        <button type="button" onClick={() => removeTag(idx)} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-[100px] text-xs border-0 p-0 focus:ring-0"
                    placeholder={tags.length ? '' : 'Add tags...'}
                />
            </div>

            {popularTags?.length > 0 && (
                <div className="mt-2">
                    <span className="text-[10px] text-gray-500">Popular: </span>
                    {popularTags.slice(0, 8).map((tag) => (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => addTag(tag.name)}
                            className="text-[10px] text-brand hover:underline mr-2"
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Create({ categories, vendors, popularTags, statuses }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        sku: '',
        short_description: '',
        description: '',
        brand: '',
        product_type: '',
        category_ids: [],
        seller_id: '',
        price: '',
        compare_at_price: '',
        cost: '',
        inventory_quantity: 0,
        inventory_policy: 'deny',
        weight: '',
        length_mm: '',
        width_mm: '',
        height_mm: '',
        sqm_per_box: '',
        is_digital: false,
        requires_shipping: true,
        status: 'draft',
        published_at: '',
        meta_title: '',
        meta_description: '',
        noindex: false,
        tags: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.products.store'));
    };

    return (
        <DashboardLayout title="Add Product">
            <Head title="Add Product" />

            <form onSubmit={submit}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.products.index')} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div className="text-sm font-semibold text-gray-900">Add Product</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.products.index')} className="btn-secondary text-xs">
                            Cancel
                        </Link>
                        <button type="submit" disabled={processing} className="btn-primary text-xs">
                            {processing ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Basic Info */}
                        <div className="admin-card">
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Title</label>
                                    <input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="Product title"
                                    />
                                    {errors.name && <div className="mt-1 text-[11px] text-red-600">{errors.name}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={6}
                                        className="mt-1 admin-textarea w-full"
                                        placeholder="Product description..."
                                    />
                                    {errors.description && <div className="mt-1 text-[11px] text-red-600">{errors.description}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Media placeholder */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Media</h3>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-200">
                                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="mt-2 text-xs text-gray-500">Save the product first to upload media</p>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Pricing</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="0.00"
                                    />
                                    {errors.price && <div className="mt-1 text-[11px] text-red-600">{errors.price}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Compare at price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.compare_at_price}
                                        onChange={(e) => setData('compare_at_price', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Cost per item</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.cost}
                                        onChange={(e) => setData('cost', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Inventory</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">SKU</label>
                                    <input
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="SKU-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Quantity</label>
                                    <input
                                        type="number"
                                        value={data.inventory_quantity}
                                        onChange={(e) => setData('inventory_quantity', parseInt(e.target.value) || 0)}
                                        className="mt-1 admin-input w-full"
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700">When sold out</label>
                                <select
                                    value={data.inventory_policy}
                                    onChange={(e) => setData('inventory_policy', e.target.value)}
                                    className="mt-1 admin-select w-full"
                                >
                                    <option value="deny">Stop selling</option>
                                    <option value="continue">Continue selling</option>
                                </select>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Shipping</h3>
                            <div className="flex items-center gap-4 mb-3">
                                <label className="flex items-center gap-2 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={!data.is_digital}
                                        onChange={(e) => setData('is_digital', !e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand"
                                    />
                                    This is a physical product
                                </label>
                            </div>
                            {!data.is_digital && (
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.weight}
                                            onChange={(e) => setData('weight', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Length (mm)</label>
                                        <input
                                            type="number"
                                            value={data.length_mm}
                                            onChange={(e) => setData('length_mm', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Width (mm)</label>
                                        <input
                                            type="number"
                                            value={data.width_mm}
                                            onChange={(e) => setData('width_mm', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Height (mm)</label>
                                        <input
                                            type="number"
                                            value={data.height_mm}
                                            onChange={(e) => setData('height_mm', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">m² per box</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={data.sqm_per_box}
                                            onChange={(e) => setData('sqm_per_box', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                            placeholder="e.g. 1.44"
                                        />
                                        <p className="mt-1 text-[10px] text-gray-400">Coverage per box (used for cart box count)</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SEO */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Search engine listing</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Page title</label>
                                    <input
                                        value={data.meta_title}
                                        onChange={(e) => setData('meta_title', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder={data.name || 'Product title'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Meta description</label>
                                    <textarea
                                        value={data.meta_description}
                                        onChange={(e) => setData('meta_description', e.target.value)}
                                        rows={2}
                                        className="mt-1 admin-textarea w-full"
                                        maxLength={160}
                                    />
                                    <div className="mt-1 text-[10px] text-gray-500">{data.meta_description?.length || 0}/160</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">URL handle</label>
                                    <input
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="Auto-generated from title"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Status */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Status</h3>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="admin-select w-full"
                            >
                                {statuses?.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                )) || (
                                    <>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="scheduled">Scheduled</option>
                                    </>
                                )}
                            </select>
                            {data.status === 'scheduled' && (
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-700">Publish date</label>
                                    <input
                                        type="datetime-local"
                                        value={data.published_at}
                                        onChange={(e) => setData('published_at', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Organization */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Organization</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Product type</label>
                                    <input
                                        value={data.product_type}
                                        onChange={(e) => setData('product_type', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="e.g., Shoes, Electronics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Vendor</label>
                                    <select
                                        value={data.seller_id}
                                        onChange={(e) => setData('seller_id', e.target.value || null)}
                                        className="mt-1 admin-select w-full"
                                    >
                                        <option value="">Select vendor</option>
                                        {vendors?.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Categories</label>
                                    <select
                                        multiple
                                        value={data.category_ids?.map(String) || []}
                                        onChange={(e) => setData('category_ids', Array.from(e.target.selectedOptions, o => parseInt(o.value)))}
                                        className="mt-1 admin-select w-full h-32"
                                    >
                                        {categories?.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="mt-1 text-[10px] text-gray-500">Hold Ctrl/Cmd to select multiple</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Brand</label>
                                    <input
                                        value={data.brand}
                                        onChange={(e) => setData('brand', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <TagInput
                            tags={data.tags}
                            onChange={(tags) => setData('tags', tags)}
                            popularTags={popularTags}
                        />
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
