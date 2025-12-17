import { Head, Link, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function Edit({ role, permissionGroups, selectedPermissions }) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name || '',
        slug: role.slug || '',
        description: role.description || '',
        permissions: selectedPermissions || [],
    });

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
        put(route('admin.roles.update', role.id));
    };

    const isAdminRole = role.slug === 'admin';

    return (
        <DashboardLayout>
            <Head title={`Edit Role: ${role.name}`} />

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
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Role: {role.name}</h1>
            </div>

            {isAdminRole && (
                <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-yellow-800">
                            This is the admin role. Some settings cannot be changed.
                        </span>
                    </div>
                </div>
            )}

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
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand disabled:bg-gray-50 disabled:text-gray-500"
                                disabled={isAdminRole}
                                required
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Slug</label>
                            <input
                                type="text"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand disabled:bg-gray-50 disabled:text-gray-500"
                                disabled={isAdminRole}
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
                        {isAdminRole
                            ? 'Admin role has all permissions by default.'
                            : 'Select the permissions this role should have.'}
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
                                        <label className={`flex items-center gap-3 ${isAdminRole ? '' : 'cursor-pointer'}`}>
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={(el) => el && (el.indeterminate = someSelected)}
                                                onChange={() => handleGroupToggle(group)}
                                                disabled={isAdminRole}
                                                className="rounded border-gray-300 text-brand focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
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
                                                className={`flex items-center gap-2 rounded-md border border-gray-100 p-2 ${
                                                    isAdminRole ? '' : 'cursor-pointer hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={data.permissions.includes(permission.id)}
                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                    disabled={isAdminRole}
                                                    className="rounded border-gray-300 text-brand focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
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
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
