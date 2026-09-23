import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

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

function UserTable({ users, toggleBuilder, emptyMessage }) {
    if (!users?.length) {
        return (
            <div className="px-4 py-8 text-center text-xs text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    // Role badge colors
    const getRoleBadgeClass = (slug) => {
        switch (slug) {
            case 'admin':
                return 'bg-blue-50 text-blue-700 ring-blue-200';
            case 'editor':
                return 'bg-purple-50 text-purple-700 ring-purple-200';
            case 'seller':
                return 'bg-green-50 text-green-700 ring-green-200';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-200';
        }
    };

    return (
        <table className="min-w-full text-left">
            <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                    <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Email</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Roles</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Builder</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 text-xs font-medium text-gray-900">
                            {u.name}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-700">{u.email}</td>
                        <td className="px-4 py-2 text-xs">
                            {u.roles && u.roles.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {u.roles.map((role) => (
                                        <span
                                            key={role.id}
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${getRoleBadgeClass(role.slug)}`}
                                        >
                                            {role.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="badge-muted">User</span>
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
                ))}
            </tbody>
        </table>
    );
}

export default function Index({ users }) {
    const [activeTab, setActiveTab] = useState('all');

    const toggleBuilder = (user) => {
        const message = user.is_builder
            ? `Revoke builder access for ${user.name}? They drop back to retail pricing but keep their account and orders.`
            : `Give ${user.name} builder access? They'll be able to use the trade portal and get builder pricing.`;
        if (!confirm(message)) return;
        router.patch(route('admin.builder.accounts.toggle', user.id), {}, { preserveScroll: true });
    };

    // Categorize users
    const allUsers = users?.data || [];
    
    const categorizedUsers = useMemo(() => {
        const admins = allUsers.filter(u => u.is_admin);
        const builders = allUsers.filter(u => u.is_builder && !u.is_admin);
        const regularUsers = allUsers.filter(u => !u.is_admin && !u.is_builder);
        
        return { admins, builders, regularUsers };
    }, [allUsers]);

    const tabs = [
        { id: 'all', label: 'All Users', count: allUsers.length },
        { id: 'admins', label: 'Admins', count: categorizedUsers.admins.length, color: 'bg-blue-500' },
        { id: 'builders', label: 'Builders / Trade', count: categorizedUsers.builders.length, color: 'bg-amber-500' },
        { id: 'users', label: 'Regular Users', count: categorizedUsers.regularUsers.length, color: 'bg-gray-400' },
    ];

    const getDisplayUsers = () => {
        switch (activeTab) {
            case 'admins':
                return categorizedUsers.admins;
            case 'builders':
                return categorizedUsers.builders;
            case 'users':
                return categorizedUsers.regularUsers;
            default:
                return allUsers;
        }
    };

    const getEmptyMessage = () => {
        switch (activeTab) {
            case 'admins':
                return 'No admin users found.';
            case 'builders':
                return 'No builder/trade users found.';
            case 'users':
                return 'No regular users found.';
            default:
                return 'No users found.';
        }
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

            {/* Category Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-brand text-white shadow-sm'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {tab.color && (
                            <span className={`h-2 w-2 rounded-full ${tab.color}`} />
                        )}
                        {tab.label}
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            activeTab === tab.id
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-100 text-gray-600'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Users Table */}
            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <UserTable 
                        users={getDisplayUsers()} 
                        toggleBuilder={toggleBuilder}
                        emptyMessage={getEmptyMessage()}
                    />
                </div>

                {activeTab === 'all' && <Pagination links={users?.links} />}
            </div>

            {/* Category Summary Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{categorizedUsers.admins.length}</p>
                            <p className="text-xs text-gray-500">Admin Users</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{categorizedUsers.builders.length}</p>
                            <p className="text-xs text-gray-500">Builders / Trade</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{categorizedUsers.regularUsers.length}</p>
                            <p className="text-xs text-gray-500">Regular Users</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
