import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ parents = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        parent_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.categories.store'));
    };

    return (
        <DashboardLayout title="Add Category">
            <Head title="Add Category" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Add Category</div>
                <Link
                    href={route('admin.categories.index')}
                    className="btn-secondary"
                >
                    Back
                </Link>
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
                        <label className="block text-xs font-medium text-gray-700">Parent category</label>
                        <select
                            value={data.parent_id}
                            onChange={(e) => setData('parent_id', e.target.value)}
                            className="mt-1 admin-select w-full"
                        >
                            <option value="">None — make this a root category</option>
                            {parents.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        {errors.parent_id ? <div className="mt-1 text-[12px] text-red-600">{errors.parent_id}</div> : null}
                        <div className="mt-1 text-[12px] text-gray-500">
                            Roots appear in the navigation bar; anything under one appears in its dropdown.
                            Products should be filed in a sub-category, not a root.
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Slug (optional)</label>
                        <input
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.slug ? <div className="mt-1 text-[12px] text-red-600">{errors.slug}</div> : null}
                        <div className="mt-1 text-[12px] text-gray-500">
                            Leave blank to auto-generate.
                        </div>
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
