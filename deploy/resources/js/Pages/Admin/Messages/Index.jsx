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

export default function Index({ messages }) {
    const destroy = (m) => {
        if (!confirm('Delete this message?')) return;
        router.delete(route('admin.messages.destroy', m.id));
    };

    return (
        <DashboardLayout title="Messages">
            <Head title="Messages" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Contact Messages</div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">From</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Subject</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Created</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {messages?.data?.length ? (
                                messages.data.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2 text-xs">
                                            <div className="font-medium text-gray-900">{m.name}</div>
                                            <div className="text-[12px] text-gray-500">{m.email}</div>
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-700">
                                            {m.subject ?? '-'}
                                        </td>
                                        <td className="px-4 py-2 text-xs">
                                            {m.is_read ? (
                                                <span className="badge-muted">
                                                    Read
                                                </span>
                                            ) : (
                                                <span className="badge-brand">
                                                    New
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-600">{m.created_at}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('admin.messages.show', m.id)}
                                                    className="btn-secondary"
                                                >
                                                    View
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(m)}
                                                    className="btn-secondary text-red-600 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="px-4 py-6 text-xs text-gray-600" colSpan={5}>
                                        No messages.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={messages?.links} />
            </div>
        </DashboardLayout>
    );
}
