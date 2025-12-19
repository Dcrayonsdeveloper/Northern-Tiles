import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function Index({ menus, locations }) {
    const handleDelete = (menu) => {
        if (!confirm(`Are you sure you want to delete the "${menu.name}" menu?`)) return;
        router.delete(route('admin.menus.destroy', menu.id));
    };

    const getLocationLabel = (location) => {
        return locations[location] || location;
    };

    return (
        <DashboardLayout>
            <Head title="Menus" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage navigation menus for your site.
                    </p>
                </div>
                <Link
                    href={route('admin.menus.create')}
                    className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Menu
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {menus.map((menu) => (
                    <div
                        key={menu.id}
                        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{menu.name}</h3>
                                    <p className="text-xs text-gray-500">{menu.slug}</p>
                                </div>
                            </div>
                            <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                    menu.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {menu.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {menu.description && (
                            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                                {menu.description}
                            </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                {getLocationLabel(menu.location)}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                {menu.items_count || 0} items
                            </span>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route('admin.menus.edit', menu.id)}
                                    className="text-sm font-medium text-brand hover:text-brand/80"
                                >
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(menu)}
                                    className="text-sm font-medium text-red-500 hover:text-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                            <Link
                                href={route('admin.menus.edit', menu.id)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Manage Items →
                            </Link>
                        </div>
                    </div>
                ))}

                {menus.length === 0 && (
                    <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <p className="mt-4 text-sm text-gray-500">No menus found.</p>
                        <Link
                            href={route('admin.menus.create')}
                            className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand/80"
                        >
                            Create your first menu
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
