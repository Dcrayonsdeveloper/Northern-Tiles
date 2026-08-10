import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';

function Pagination({ links }) {
    if (!links?.length) return null;

    return (
        <div className="flex flex-wrap gap-2 p-3">
            {links.map((l, idx) => (
                <Link
                    key={idx}
                    href={l.url ?? '#'}
                    preserveScroll
                    className={
                        (l.active
                            ? 'bg-brand text-white border-brand'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-brand/10 hover:text-brand') +
                        ' rounded-md border px-2.5 py-1.5 text-xs font-medium' +
                        (!l.url ? ' pointer-events-none opacity-50' : '')
                    }
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </div>
    );
}

export default function Index({ users }) {
    const toggleBuilder = (user) => {
        const message = user.is_builder
            ? `Revoke builder access for ${user.name}? They drop back to retail pricing but keep their account and orders.`
            : `Give ${user.name} builder access? They'll be able to use the trade portal and get builder pricing.`;
        if (!confirm(message)) return;
        router.patch(route('admin.builder.accounts.toggle', user.id), {}, { preserveScroll: true });
    };

    return (
        <DashboardLayout title="Users">
            <Head title="Users" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Users</div>
                <Link href={route('admin.users.create')} className="btn-primary">
                    + New User
                </Link>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Name</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Email</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Admin</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Builder</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users?.data?.length ? (
                                users.data.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2 text-xs font-medium text-gray-900">
                                            {u.name}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-700">{u.email}</td>
                                        <td className="px-4 py-2 text-xs">
                                            {u.is_admin ? (
                                                <span className="badge-brand">Yes</span>
                                            ) : (
                                                <span className="badge-muted">No</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-xs">
                                            {u.is_builder ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                                                    Trade
                                                </span>
                                            ) : (
                                                <span className="badge-muted">No</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-xs">
                                            {u.is_active ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                                                    <span className="h-1 w-1 rounded-full bg-red-500" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('admin.users.edit', u.id)}
                                                    className="btn-secondary"
                                                >
                                                    Edit
                                                </Link>
                                                {/* Promote an existing customer to trade, or drop them
                                                    back to retail, without leaving this screen. */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleBuilder(u)}
                                                    className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                                                        u.is_builder
                                                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {u.is_builder ? 'Revoke trade' : 'Make builder'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="px-4 py-6 text-xs text-gray-600" colSpan={6}>
                                        No users.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={users?.links} />
            </div>
        </DashboardLayout>
    );
}
