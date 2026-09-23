import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Create({ defaultFloorBounds }) {
    const [imagePreviews, setImagePreviews] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        images: [],
        floor_bounds: defaultFloorBounds,
        sort_order: 0,
        is_active: true,
    });

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setData('images', files);
            
            // Generate previews for all selected images
            const previews = [];
            files.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    previews.push(reader.result);
                    if (previews.length === files.length) {
                        setImagePreviews([...previews]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index) => {
        const newImages = [...data.images];
        newImages.splice(index, 1);
        setData('images', newImages);

        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
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
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        Room Images <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs font-normal text-gray-500">(First image will be primary)</span>
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImagesChange}
                                className="admin-input w-full"
                            />
                            {errors.images && <p className="mt-1 text-xs text-red-500">{errors.images}</p>}
                            {errors['images.0'] && <p className="mt-1 text-xs text-red-500">{errors['images.0']}</p>}
                            <p className="mt-2 text-[11px] text-gray-500">
                                Upload one or more room images (PNG, JPG, WebP). Max 10MB each.
                                You can select multiple files at once.
                            </p>
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="h-24 w-full object-cover rounded-lg border border-gray-200"
                                        />
                                        {index === 0 && (
                                            <span className="absolute top-1 left-1 bg-brand text-white text-[10px] px-1.5 py-0.5 rounded">
                                                Primary
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
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
