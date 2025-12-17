import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';

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
    return (
        <DashboardLayout title="Users">
            <Head title="Users" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Users</div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Name</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Email</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Admin</th>
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
                                                <span className="badge-brand">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="badge-muted">
                                                    No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <Link
                                                href={route('admin.users.edit', u.id)}
                                                className="btn-secondary"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="px-4 py-6 text-xs text-gray-600" colSpan={4}>
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
