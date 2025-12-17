import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ categories }) {
    const { data, setData, post, processing, errors } = useForm({
        category_id: '',
        name: '',
        slug: '',
        short_description: '',
        description: '',
        price: '0.00',
        compare_at_price: '',
        image_url: '',
        stock: 0,
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.products.store'));
    };

    return (
        <DashboardLayout title="Add Product">
            <Head title="Add Product" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Add Product</div>
                <Link
                    href={route('admin.products.index')}
                    className="btn-secondary"
                >
                    Back
                </Link>
            </div>

            <div className="mt-4 max-w-4xl admin-card">
                <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Name</label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.name ? <div className="mt-1 text-[12px] text-red-600">{errors.name}</div> : null}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Category</label>
                        <select
                            value={data.category_id}
                            onChange={(e) => setData('category_id', e.target.value)}
                            className="mt-1 admin-select"
                        >
                            <option value="">None</option>
                            {categories?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id ? (
                            <div className="mt-1 text-[12px] text-red-600">{errors.category_id}</div>
                        ) : null}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Slug (optional)</label>
                        <input
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.slug ? <div className="mt-1 text-[12px] text-red-600">{errors.slug}</div> : null}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Short Description</label>
                        <input
                            value={data.short_description}
                            onChange={(e) => setData('short_description', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.short_description ? (
                            <div className="mt-1 text-[12px] text-red-600">{errors.short_description}</div>
                        ) : null}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Description</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={5}
                            className="mt-1 admin-textarea"
                        />
                        {errors.description ? (
                            <div className="mt-1 text-[12px] text-red-600">{errors.description}</div>
                        ) : null}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Price</label>
                        <input
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.price ? <div className="mt-1 text-[12px] text-red-600">{errors.price}</div> : null}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Compare at Price</label>
                        <input
                            value={data.compare_at_price}
                            onChange={(e) => setData('compare_at_price', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.compare_at_price ? (
                            <div className="mt-1 text-[12px] text-red-600">{errors.compare_at_price}</div>
                        ) : null}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Image URL</label>
                        <input
                            value={data.image_url}
                            onChange={(e) => setData('image_url', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.image_url ? (
                            <div className="mt-1 text-[12px] text-red-600">{errors.image_url}</div>
                        ) : null}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Stock</label>
                        <input
                            value={data.stock}
                            onChange={(e) => setData('stock', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.stock ? <div className="mt-1 text-[12px] text-red-600">{errors.stock}</div> : null}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Status</label>
                        <select
                            value={data.is_active ? '1' : '0'}
                            onChange={(e) => setData('is_active', e.target.value === '1')}
                            className="mt-1 admin-select"
                        >
                            <option value="1">Active</option>
                            <option value="0">Hidden</option>
                        </select>
                        {errors.is_active ? (
                            <div className="mt-1 text-[12px] text-red-600">{errors.is_active}</div>
                        ) : null}
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
