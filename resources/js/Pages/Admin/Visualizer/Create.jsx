import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Create({ defaultFloorBounds }) {
    const [imagePreview, setImagePreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        image: null,
        floor_bounds: defaultFloorBounds,
        sort_order: 0,
        is_active: true,
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
        post(route('admin.visualizer.store'));
    };

    return (
        <DashboardLayout title="Add Room Scene">
            <Head title="Add Room Scene" />

            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-gray-900">Add Room Scene</div>
                    <p className="text-xs text-gray-500 mt-1">Create a new room for the tile visualizer</p>
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
                                placeholder="e.g. Living Room"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Slug (URL-friendly name)
                            </label>
                            <input
                                type="text"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                className="admin-input w-full"
                                placeholder="Auto-generated from name"
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
                            <p className="mt-1 text-[11px] text-gray-500">Lower numbers appear first</p>
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
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Room Image <span className="text-red-500">*</span></h3>

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
                                Recommended: High-quality room photo (PNG, JPG, WebP). Max 10MB.
                                Tiles will be rendered behind this image.
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
                        Default is full image (0, 0, 100, 100).
                    </p>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">X Position (%)</label>
                            <input
                                type="number"
                                value={data.floor_bounds.x}
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
                                value={data.floor_bounds.y}
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
                                value={data.floor_bounds.width}
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
                                value={data.floor_bounds.height}
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
                        {processing ? 'Creating...' : 'Create Room Scene'}
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
