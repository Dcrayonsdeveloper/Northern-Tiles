import DashboardLayout from '@/Layouts/DashboardLayout';
import Modal from '@/Components/Modal';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const money = (v) => `$${parseFloat(v || 0).toFixed(2)}`;

/* ── Create / edit account modal ───────────────────────────────────── */
function AccountModal({ open, onClose, account }) {
    const isEdit = !!account;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        builder_company: '',
        password: '',
        password_confirmation: '',
        is_active: true,
    });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        if (account) {
            setData({
                name: account.name ?? '',
                email: account.email ?? '',
                builder_company: account.builder_company ?? '',
                password: '',
                password_confirmation: '',
                is_active: !!account.is_active,
            });
        } else {
            reset();
            setData('is_active', true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, account?.id]);

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => onClose() };
        if (isEdit) {
            put(route('admin.builder.accounts.update', account.id), opts);
        } else {
            post(route('admin.builder.accounts.store'), opts);
        }
    };

    return (
        <Modal show={open} onClose={onClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    {isEdit ? 'Edit builder account' : 'New builder account'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    {isEdit
                        ? 'Update the account details, or set a new password.'
                        : 'Builders cannot sign themselves up — create the account here and pass the login details to them.'}
                </p>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Contact name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Email (their login)</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
                        <input
                            type="text"
                            value={data.builder_company}
                            onChange={(e) => setData('builder_company', e.target.value)}
                            placeholder="e.g. Northside Constructions Pty Ltd"
                            className="w-full rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                        />
                        {errors.builder_company && <p className="mt-1 text-xs text-red-600">{errors.builder_company}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Password {isEdit && <span className="font-normal text-gray-400">(leave blank to keep)</span>}
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="w-full rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                            />
                        </div>
                    </div>

                    {isEdit && (
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-gray-300 text-brand focus:ring-brand"
                            />
                            Account active (unticking blocks portal access and login)
                        </label>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        {processing ? 'Saving…' : isEdit ? 'Save changes' : 'Create account'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function BuilderAccounts({ builders, filters, stats }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState(filters?.q ?? '');

    const rows = builders?.data ?? [];

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (account) => { setEditing(account); setModalOpen(true); };

    const revoke = (account) => {
        if (!confirm(`Revoke builder access for ${account.name}? They keep their account and order history, but drop back to retail pricing.`)) return;
        router.patch(route('admin.builder.accounts.toggle', account.id), {}, { preserveScroll: true });
    };

    const approve = (account) => {
        if (!confirm(`Approve ${account.name}${account.builder_company ? ` (${account.builder_company})` : ''}? They'll get portal access and trade pricing immediately.`)) return;
        router.patch(route('admin.builder.accounts.approve', account.id), {}, { preserveScroll: true });
    };

    const unapprove = (account) => {
        if (!confirm(`Move ${account.name} back to pending? They lose trade pricing but keep their account and can still shop at retail.`)) return;
        router.patch(route('admin.builder.accounts.unapprove', account.id), {}, { preserveScroll: true });
    };

    // Three states, not two: an applicant who has not been approved yet is
    // distinct from one who has been switched off.
    const statusOf = (account) => {
        if (!account.builder_approved_at) return 'pending';
        return account.is_active ? 'active' : 'disabled';
    };

    return (
        <DashboardLayout>
            <Head title="Builder Accounts" />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Builder Accounts</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Who can log into the builder portal at <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/builder</code> and buy at trade pricing.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {(stats?.pending ?? 0) > 0 && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                            {stats.pending} awaiting approval
                        </span>
                    )}
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{stats?.active ?? 0}</span> active
                        <span className="text-gray-400"> / {stats?.total ?? 0} total</span>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                        + New builder account
                    </button>
                </div>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    router.get(route('admin.builder.accounts.index'), { q: search }, { preserveState: true, replace: true });
                }}
                className="mb-4"
            >
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email or company…"
                    className="w-full max-w-sm rounded border-gray-300 text-sm focus:border-brand focus:ring-brand"
                />
            </form>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Account</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Company</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Orders</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Spent</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <p className="text-sm font-medium text-gray-900">No builder accounts yet.</p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Create one here, or promote an existing customer from Admin → Users.
                                        </p>
                                    </td>
                                </tr>
                            ) : rows.map((account) => (
                                <tr key={account.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{account.name}</div>
                                        <div className="text-xs text-gray-500">{account.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{account.builder_company || '—'}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{account.orders_count ?? 0}</td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">{money(account.total_spent)}</td>
                                    <td className="px-4 py-3 text-center">
                                        {statusOf(account) === 'pending' ? (
                                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                                Pending
                                            </span>
                                        ) : statusOf(account) === 'active' ? (
                                            <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                                                Disabled
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {statusOf(account) === 'pending' ? (
                                            <button
                                                type="button"
                                                onClick={() => approve(account)}
                                                className="mr-3 rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => unapprove(account)}
                                                className="mr-3 text-sm font-medium text-amber-700 hover:underline"
                                            >
                                                Deactivate
                                            </button>
                                        )}
                                        <button type="button" onClick={() => openEdit(account)} className="mr-3 text-sm font-medium text-brand hover:underline">
                                            Edit
                                        </button>
                                        <button type="button" onClick={() => revoke(account)} className="text-sm font-medium text-red-600 hover:text-red-800">
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {(builders?.links ?? []).length > 3 && (
                <div className="mt-6 flex flex-wrap justify-center gap-1">
                    {builders.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            preserveScroll
                            className={`rounded px-3 py-1.5 text-sm ${
                                link.active
                                    ? 'bg-brand font-semibold text-white'
                                    : link.url
                                        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        : 'cursor-not-allowed border border-gray-200 bg-white text-gray-300'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}

            <AccountModal open={modalOpen} onClose={() => setModalOpen(false)} account={editing} />
        </DashboardLayout>
    );
}
