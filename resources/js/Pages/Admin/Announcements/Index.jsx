import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';

function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function stripHtml(html) {
    return html ? html.replace(/<[^>]*>/g, '') : '';
}

export default function Index({ items, activeAnnouncement }) {
    const rows = items?.data ?? [];

    return (
        <DashboardLayout title="Announcements">
            <Head title="Announcements" />

            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-gray-700">Announcements</div>
                <Link href={route('admin.announcements.create')} className="btn-primary">
                    Create
                </Link>
            </div>

            {/* Active announcement preview */}
            <div className="admin-card mb-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Current Active Announcement
                </div>
                {activeAnnouncement ? (
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{activeAnnouncement.title}</div>
                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                                {stripHtml(activeAnnouncement.body_html)}
                            </p>
                            {(activeAnnouncement.starts_at || activeAnnouncement.ends_at) && (
                                <p className="mt-1 text-[11px] text-gray-400">
                                    {activeAnnouncement.starts_at && <>From {formatDateTime(activeAnnouncement.starts_at)}</>}
                                    {activeAnnouncement.starts_at && activeAnnouncement.ends_at && ' · '}
                                    {activeAnnouncement.ends_at && <>Until {formatDateTime(activeAnnouncement.ends_at)}</>}
                                </p>
                            )}
                        </div>
                        <Link
                            href={route('admin.announcements.edit', activeAnnouncement.id)}
                            className="btn-secondary shrink-0"
                        >
                            Edit
                        </Link>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400">No active announcement at this time.</p>
                )}
            </div>

            <div className="admin-card">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                        <thead className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-2 py-2 font-semibold">Title</th>
                                <th className="px-2 py-2 font-semibold">Audience</th>
                                <th className="px-2 py-2 font-semibold">Active</th>
                                <th className="px-2 py-2 font-semibold">Starts</th>
                                <th className="px-2 py-2 font-semibold">Ends</th>
                                <th className="px-2 py-2 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-2 py-2 font-semibold text-gray-900">{a.title}</td>
                                    <td className="px-2 py-2">
                                        <div className="flex flex-wrap gap-1">
                                            {(a.audience ?? []).map((r) => (
                                                <span key={r} className="badge-muted">
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2">
                                        {a.is_active ? <span className="badge-brand">Yes</span> : <span className="badge-muted">No</span>}
                                    </td>
                                    <td className="px-2 py-2 text-gray-700">{formatDateTime(a.starts_at)}</td>
                                    <td className="px-2 py-2 text-gray-700">{formatDateTime(a.ends_at)}</td>
                                    <td className="px-2 py-2 text-right">
                                        <Link href={route('admin.announcements.edit', a.id)} className="btn-secondary">
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-600">
                    <div>
                        Showing {items?.from ?? 0}-{items?.to ?? 0} of {items?.total ?? 0}
                    </div>
                    <div className="flex items-center gap-2">
                        {items?.links?.map((l) => (
                            l.url ? (
                                <Link
                                    key={l.label}
                                    href={l.url}
                                    className={
                                        (l.active ? 'bg-brand text-white' : 'bg-white text-gray-700 hover:bg-gray-50') +
                                        ' rounded-md border border-gray-200 px-2 py-1'
                                    }
                                    preserveScroll
                                    preserveState
                                >
                                    <span dangerouslySetInnerHTML={{ __html: l.label }} />
                                </Link>
                            ) : (
                                <span
                                    key={l.label}
                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-400"
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                />
                            )
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
