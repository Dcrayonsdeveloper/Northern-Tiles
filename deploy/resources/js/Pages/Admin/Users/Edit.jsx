import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ user }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        is_admin: Boolean(user?.is_admin ?? false),
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.users.update', user.id));
    };

    return (
        <DashboardLayout title="Edit User">
            <Head title="Edit User" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Edit User</div>
                <Link
                    href={route('admin.users.index')}
                    className="btn-secondary"
                >
                    Back
                </Link>
            </div>

            <div className="mt-4 max-w-2xl admin-card">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Name</label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.name ? <div className="mt-1 text-[12px] text-red-600">{errors.name}</div> : null}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Email</label>
                        <input
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.email ? <div className="mt-1 text-[12px] text-red-600">{errors.email}</div> : null}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            id="is_admin"
                            type="checkbox"
                            checked={data.is_admin}
                            onChange={(e) => setData('is_admin', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="is_admin" className="text-xs font-medium text-gray-700">
                            Admin Access
                        </label>
                        {errors.is_admin ? (
                            <div className="text-[12px] text-red-600">{errors.is_admin}</div>
                        ) : null}
                    </div>

                    <div className="pt-2">
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
