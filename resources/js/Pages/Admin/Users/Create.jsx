import DashboardLayout from '@/Layouts/DashboardLayout';
import PasswordInput from '@/Components/PasswordInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ roles = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: '', // Empty means regular user (no role)
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    return (
        <DashboardLayout title="New User">
            <Head title="New User" />

            {/* ── Page header ───────────────────────────────────────────── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-5">
                <div>
                    <h1 className="text-base font-bold tracking-tight text-gray-900">New User</h1>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Create a new account. Select a role to grant specific permissions.
                    </p>
                </div>
                <Link href={route('admin.users.index')} className="btn-secondary">
                    ← Back
                </Link>
            </div>

            {/* ── Create form ───────────────────────────────────────────── */}
            <div className="max-w-2xl admin-card">
                <div className="mb-4 border-b border-gray-100 pb-3">
                    <h2 className="text-sm font-semibold text-gray-900">Account Details</h2>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Name</label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 admin-input"
                            autoComplete="off"
                        />
                        {errors.name && <p className="mt-1 text-[12px] text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-1 admin-input"
                            autoComplete="off"
                        />
                        {errors.email && <p className="mt-1 text-[12px] text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Password</label>
                        <PasswordInput
                            unstyled
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 admin-input"
                            autoComplete="new-password"
                        />
                        {errors.password && <p className="mt-1 text-[12px] text-red-600">{errors.password}</p>}
                        <p className="mt-1 text-[11px] text-gray-400">Minimum 8 characters.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Confirm Password</label>
                        <PasswordInput
                            unstyled
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="mt-1 admin-input"
                            autoComplete="new-password"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Role</label>
                        <select
                            value={data.role_id}
                            onChange={(e) => setData('role_id', e.target.value)}
                            className="mt-1 admin-input"
                        >
                            <option value="">Regular User (No admin access)</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name} {role.description && `- ${role.description}`}
                                </option>
                            ))}
                        </select>
                        {errors.role_id && <p className="mt-1 text-[12px] text-red-600">{errors.role_id}</p>}
                        <p className="mt-1 text-[11px] text-gray-400">
                            Administrator role grants full admin panel access. Other roles have specific permissions.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button type="submit" disabled={processing} className="btn-primary disabled:opacity-50">
                            {processing ? 'Creating…' : 'Create User'}
                        </button>
                        <Link href={route('admin.users.index')} className="btn-secondary">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
