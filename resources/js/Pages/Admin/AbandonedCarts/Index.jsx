import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

function StatCard({ label, value, subvalue, color = 'brand' }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className={`mt-1 text-2xl font-bold text-${color}`}>{value}</div>
            {subvalue && <div className="mt-1 text-xs text-gray-500">{subvalue}</div>}
        </div>
    );
}

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
                        (l.active ? 'bg-brand text-white border-brand' : 'bg-white text-gray-700 border-gray-200 hover:bg-brand/10') +
                        ' rounded-md border px-2.5 py-1.5 text-xs font-medium' +
                        (!l.url ? ' pointer-events-none opacity-50' : '')
                    }
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </div>
    );
}

export default function Index({ carts, statistics, filters }) {
    const [search, setSearch] = useState(filters?.search || '');

    const debouncedSearch = useCallback(
        debounce((value) => {
            router.get(route('admin.abandoned-carts.index'), { ...filters, search: value }, { preserveState: true, replace: true });
        }, 300),
        [filters]
    );

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        debouncedSearch(value);
    };

    const handleFilterChange = (key, value) => {
        router.get(
            route('admin.abandoned-carts.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    return (
        <DashboardLayout title="Abandoned Carts">
            <Head title="Abandoned Carts" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Abandoned Carts</div>
                <div className="flex items-center gap-2">
                    <Link href={route('admin.abandoned-carts.flows')} className="btn-secondary">
                        Manage Flows
                    </Link>
                    <Link href={route('admin.email-templates.index')} className="btn-secondary">
                        Email Templates
                    </Link>
                </div>
            </div>

            {/* Statistics */}
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Total Abandoned"
                    value={statistics?.total_abandoned || 0}
                    subvalue={`Last ${statistics?.period || '30d'}`}
                />
                <StatCard
                    label="Recovered"
                    value={statistics?.total_recovered || 0}
                    subvalue={`${statistics?.recovery_rate || 0}% recovery rate`}
                    color="green-600"
                />
                <StatCard
                    label="Emails Sent"
                    value={statistics?.messages_sent || 0}
                />
                <StatCard
                    label="Pending Emails"
                    value={statistics?.messages_pending || 0}
                />
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={search}
                        onChange={handleSearchChange}
                        className="admin-input w-full"
                    />
                </div>
                <div>
                    <select
                        value={filters?.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="admin-select w-full"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="sent">Emails Sent</option>
                        <option value="recovered">Recovered</option>
                    </select>
                </div>
                <div>
                    <select
                        value={filters?.period || '30d'}
                        onChange={(e) => handleFilterChange('period', e.target.value)}
                        className="admin-select w-full"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Email</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Items</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Value</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Abandoned At</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {carts?.data?.length ? (
                                carts.data.map((cart) => (
                                    <tr key={cart.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-medium text-gray-900">{cart.email || 'No email'}</div>
                                            {cart.customer && (
                                                <div className="text-[11px] text-gray-500">{cart.customer.name}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {cart.items_count} items
                                        </td>
                                        <td className="px-4 py-3 text-xs font-medium text-gray-900">
                                            ${cart.items?.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {cart.abandoned_at ? new Date(cart.abandoned_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {cart.recovered_order_id ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                                    Recovered
                                                </span>
                                            ) : cart.abandoned_cart_messages?.some(m => m.status === 'sent') ? (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                                    Email Sent
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={route('admin.abandoned-carts.show', cart.id)}
                                                className="btn-secondary text-xs px-2 py-1"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="px-4 py-10 text-center text-xs text-gray-600" colSpan={6}>
                                        No abandoned carts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={carts?.links} />
            </div>
        </DashboardLayout>
    );
}
