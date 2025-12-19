import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function Create({ permissionGroups }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        permissions: [],
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

    const handlePermissionToggle = (permissionId) => {
        setData('permissions', data.permissions.includes(permissionId)
            ? data.permissions.filter((id) => id !== permissionId)
            : [...data.permissions, permissionId]
        );
    };

    const handleGroupToggle = (group) => {
        const groupPermissionIds = group.permissions.map((p) => p.id);
        const allSelected = groupPermissionIds.every((id) => data.permissions.includes(id));

        if (allSelected) {
            setData('permissions', data.permissions.filter((id) => !groupPermissionIds.includes(id)));
        } else {
            const newPermissions = [...new Set([...data.permissions, ...groupPermissionIds])];
            setData('permissions', newPermissions);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.roles.store'));
    };

    return (
        <DashboardLayout>
            <Head title="Create Role" />

            <div className="mb-6">
                <Link
                    href={route('admin.roles.index')}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Roles
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Create Role</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                {/* Role Details */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Role Details</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={handleNameChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="e.g., Content Editor"
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
                                placeholder="e.g., content-editor"
                                required
                            />
                            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Brief description of this role..."
                            />
                            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                        </div>
                    </div>
                </div>

                {/* Permissions */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Select the permissions this role should have.
                    </p>

                    <div className="mt-6 space-y-6">
                        {Object.entries(permissionGroups).map(([groupName, group]) => {
                            const groupPermissionIds = group.permissions.map((p) => p.id);
                            const selectedCount = groupPermissionIds.filter((id) => data.permissions.includes(id)).length;
                            const allSelected = selectedCount === groupPermissionIds.length;
                            const someSelected = selectedCount > 0 && !allSelected;

                            return (
                                <div key={groupName} className="rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <label className="flex cursor-pointer items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={(el) => el && (el.indeterminate = someSelected)}
                                                onChange={() => handleGroupToggle(group)}
                                                className="rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            <span className="font-semibold capitalize text-gray-900">
                                                {groupName}
                                            </span>
                                        </label>
                                        <span className="text-xs text-gray-500">
                                            {selectedCount} of {groupPermissionIds.length} selected
                                        </span>
                                    </div>

                                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {group.permissions.map((permission) => (
                                            <label
                                                key={permission.id}
                                                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-100 p-2 hover:bg-gray-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={data.permissions.includes(permission.id)}
                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                    className="rounded border-gray-300 text-brand focus:ring-brand"
                                                />
                                                <span className="text-sm text-gray-700">{permission.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {errors.permissions && (
                        <p className="mt-4 text-xs text-red-500">{errors.permissions}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={route('admin.roles.index')}
                        className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? 'Creating...' : 'Create Role'}
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
