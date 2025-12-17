import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ categories }) {
    const destroy = (category) => {
        if (!confirm(`Delete category "${category.name}"?`)) return;
        router.delete(route('admin.categories.destroy', category.slug));
    };

    return (
        <DashboardLayout title="Categories">
            <Head title="Categories" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Categories</div>
                <Link
                    href={route('admin.categories.create')}
                    className="btn-primary"
                >
                    Add Category
                </Link>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">
                                    Name
                                </th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">
                                    Slug
                                </th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories?.length ? (
                                categories.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2 text-xs font-medium text-gray-900">
                                            {c.name}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-600">
                                            {c.slug}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('admin.categories.edit', c.slug)}
                                                    className="btn-secondary"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(c)}
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
                                    <td className="px-4 py-6 text-xs text-gray-600" colSpan={3}>
                                        No categories yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
