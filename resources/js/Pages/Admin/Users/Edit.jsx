import DashboardLayout from '@/Layouts/DashboardLayout';
import Modal from '@/Components/Modal';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ── Status badge ─────────────────────────────────────────────────────────────

function AccountBadge({ isActive }) {
    if (isActive) {
        return (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Account active
            </span>
        );
    }
    return (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Account inactive
        </span>
    );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteModal({ user, show, onClose, onConfirm, deleting }) {
    return (
        <Modal show={show} maxWidth="sm" onClose={onClose}>
            <div className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <svg
                        className="h-5 w-5 text-red-600"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>

                <h3 className="text-sm font-semibold text-gray-900">Delete user account?</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold text-gray-700">{user.name}</span>?
                    This action cannot be undone.
                </p>

                <div className="mt-5 flex gap-2.5">
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                        {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Edit({ user }) {
    const { auth } = usePage().props;
    const isSelf = auth?.user?.id === user.id;

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting]   = useState(false);
    const [toggling, setToggling]   = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name:     user?.name     ?? '',
        email:    user?.email    ?? '',
        is_admin: Boolean(user?.is_admin ?? false),
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.users.update', user.id));
    };

    const handleToggleActive = () => {
        if (isSelf || toggling) return;
        setToggling(true);
        router.patch(
            route('admin.users.toggle-active', user.id),
            {},
            { onFinish: () => setToggling(false) },
        );
    };

    const handleDelete = () => {
        if (isSelf || deleting) return;
        setDeleting(true);
        router.delete(route('admin.users.destroy', user.id), {
            onFinish: () => {
                setDeleting(false);
                setShowDeleteModal(false);
            },
        });
    };

    return (
        <DashboardLayout title="Edit User">
            <Head title="Edit User" />

            {/* ── Page header ───────────────────────────────────────────── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-5">
                <div>
                    <h1 className="text-base font-bold tracking-tight text-gray-900">
                        Edit User
                    </h1>
                    <p className="mt-0.5 text-xs text-gray-500">{user.email}</p>
                </div>
                <Link href={route('admin.users.index')} className="btn-secondary">
                    ← Back
                </Link>
            </div>

            {/* ── Account status row ────────────────────────────────────── */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <AccountBadge isActive={user.is_active} />

                <button
                    type="button"
                    onClick={handleToggleActive}
                    disabled={isSelf || toggling}
                    title={isSelf ? 'You cannot change the status of your own account' : undefined}
                    className={`btn-secondary text-xs ${isSelf ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                    {toggling
                        ? 'Updating…'
                        : user.is_active
                            ? 'Deactivate Account'
                            : 'Activate Account'}
                </button>
            </div>

            {/* ── Edit form ─────────────────────────────────────────────── */}
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
                        />
                        {errors.name && (
                            <p className="mt-1 text-[12px] text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.email && (
                            <p className="mt-1 text-[12px] text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            id="is_admin"
                            type="checkbox"
                            checked={data.is_admin}
                            onChange={(e) => setData('is_admin', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                        />
                        <label htmlFor="is_admin" className="text-xs font-medium text-gray-700">
                            Admin Access
                        </label>
                        {errors.is_admin && (
                            <p className="text-[12px] text-red-600">{errors.is_admin}</p>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary disabled:opacity-50"
                        >
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Danger zone ───────────────────────────────────────────── */}
            <div className="mt-5 max-w-2xl rounded-xl border border-red-200 bg-white p-4 shadow-sm">
                <div className="mb-3 border-b border-red-100 pb-3">
                    <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Permanently remove this user. The account is soft-deleted and can be
                        recovered from the database if needed.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={isSelf}
                    title={isSelf ? 'You cannot delete your own account' : undefined}
                    className={`rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                    Delete User
                </button>

                {isSelf && (
                    <p className="mt-2 text-[11px] text-gray-400">
                        You cannot delete your own account.
                    </p>
                )}
            </div>

            {/* ── Delete modal ──────────────────────────────────────────── */}
            <DeleteModal
                user={user}
                show={showDeleteModal}
                onClose={() => !deleting && setShowDeleteModal(false)}
                onConfirm={handleDelete}
                deleting={deleting}
            />
        </DashboardLayout>
    );
}
