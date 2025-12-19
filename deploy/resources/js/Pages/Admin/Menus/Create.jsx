import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function Create({ locations }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        location: '',
        is_active: true,
    });

    const [autoSlug, setAutoSlug] = useState(true);

    const handleNameChange = (e) => {
        const name = e.target.value;
        setData('name', name);
        if (autoSlug) {
            setData('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        }
    };

    const handleSlugChange = (e) => {
        setAutoSlug(false);
        setData('slug', e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.menus.store'));
    };

    return (
        <DashboardLayout>
            <Head title="Create Menu" />

            <div className="mb-6">
                <Link
                    href={route('admin.menus.index')}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Menus
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Create Menu</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Menu Details</h2>
                    <div className="mt-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={handleNameChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    placeholder="e.g., Main Navigation"
                                    required
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Slug</label>
                                <input
                                    type="text"
                                    value={data.slug}
                                    onChange={handleSlugChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    placeholder="e.g., main-navigation"
                                    required
                                />
                                {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <select
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                required
                            >
                                <option value="">Select location...</option>
                                {Object.entries(locations).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Brief description of this menu..."
                            />
                            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-gray-300 text-brand focus:ring-brand"
                            />
                            <label htmlFor="is_active" className="text-sm text-gray-700">
                                Active (menu will be displayed on the site)
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={route('admin.menus.index')}
                        className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? 'Creating...' : 'Create Menu'}
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
