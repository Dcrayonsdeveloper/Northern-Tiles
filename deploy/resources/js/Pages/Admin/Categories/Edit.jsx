import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function Edit({ category }) {
    const { data, setData, put, processing, errors } = useForm({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.categories.update', category.slug));
    };

    const destroy = () => {
        if (!confirm(`Delete category "${category.name}"?`)) return;
        router.delete(route('admin.categories.destroy', category.slug));
    };

    return (
        <DashboardLayout title="Edit Category">
            <Head title="Edit Category" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Edit Category</div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('admin.categories.index')}
                        className="btn-secondary"
                    >
                        Back
                    </Link>
                    <button
                        type="button"
                        onClick={destroy}
                        className="btn-secondary text-red-600 hover:bg-red-50"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div className="mt-4 max-w-2xl admin-card">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Name</label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.name ? <div className="mt-1 text-[12px] text-red-600">{errors.name}</div> : null}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Slug</label>
                        <input
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.slug ? <div className="mt-1 text-[12px] text-red-600">{errors.slug}</div> : null}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
