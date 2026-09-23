import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

function StatusBadge({ active }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
            active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
            {active ? 'Active' : 'Inactive'}
        </span>
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

export default function Index({ rooms, filters }) {
    const [search, setSearch] = useState(filters?.search || '');

    const debouncedSearch = useCallback(
        debounce((value) => {
            router.get(route('admin.visualizer.index'), { ...filters, search: value }, { preserveState: true, replace: true });
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
            route('admin.visualizer.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const destroy = (room) => {
        if (!confirm(`Delete room scene "${room.name}"? This action cannot be undone.`)) return;
        router.delete(route('admin.visualizer.destroy', room.id));
    };

    const toggleStatus = (room) => {
        router.post(route('admin.visualizer.toggle-status', room.id));
    };

    return (
        <DashboardLayout title="Tile Visualizer">
            <Head title="Tile Visualizer - Room Scenes" />

            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-gray-900">Tile Visualizer</div>
                    <p className="text-xs text-gray-500 mt-1">Manage room scenes for the tile visualizer</p>
                </div>
                <Link href={route('admin.visualizer.create')} className="btn-primary">
                    Add Room Scene
                </Link>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <input
                        type="text"
                        placeholder="Search rooms..."
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
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Room Scene</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Products</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Order</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rooms?.data?.length ? (
                                rooms.data.map((room) => (
                                    <tr key={room.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {room.image_url ? (
                                                    <img
                                                        src={room.image_url}
                                                        alt={room.name}
                                                        className="h-12 w-20 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-20 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div>
                                                    <Link
                                                        href={route('admin.visualizer.edit', room.id)}
                                                        className="text-xs font-medium text-gray-900 hover:text-brand"
                                                    >
                                                        {room.name}
                                                    </Link>
                                                    <div className="text-[11px] text-gray-500">
                                                        /{room.slug}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {room.products_count} featured
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {room.sort_order}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge active={room.is_active} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleStatus(room)}
                                                    className="btn-secondary text-xs px-2 py-1"
                                                    title={room.is_active ? 'Disable' : 'Enable'}
                                                >
                                                    {room.is_active ? 'Disable' : 'Enable'}
                                                </button>
                                                <Link
                                                    href={route('admin.visualizer.edit', room.id)}
                                                    className="btn-secondary text-xs px-2 py-1"
                                                    title="Edit"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(room)}
                                                    className="btn-secondary text-red-600 hover:bg-red-50 text-xs px-2 py-1"
                                                    title="Delete"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="px-4 py-10 text-center text-xs text-gray-600" colSpan={5}>
                                        No room scenes found. <Link href={route('admin.visualizer.create')} className="text-brand hover:underline">Add your first room scene</Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={rooms?.links} />
            </div>

            {/* Help text */}
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <h3 className="text-sm font-medium text-blue-900">About the Tile Visualizer</h3>
                <p className="mt-1 text-xs text-blue-700">
                    Room scenes are displayed on the public tile visualizer page. Users can select a room and preview how different tiles look.
                    You can optionally assign featured products to each room that will appear first in the tile picker.
                </p>
                <a href="/visualizer" target="_blank" className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800">
                    View Public Visualizer
                    <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        </DashboardLayout>
    );
}
