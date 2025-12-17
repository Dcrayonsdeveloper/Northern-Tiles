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

export default function Index({ products }) {
    const destroy = (product) => {
        if (!confirm(`Delete product "${product.name}"?`)) return;
        router.delete(route('admin.products.destroy', product.slug));
    };

    return (
        <DashboardLayout title="Products">
            <Head title="Products" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Products</div>
                <Link
                    href={route('admin.products.create')}
                    className="btn-primary"
                >
                    Add Product
                </Link>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Name</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Category</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Price</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Stock</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products?.data?.length ? (
                                products.data.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2 text-xs font-medium text-gray-900">
                                            {p.name}
                                            <div className="text-[12px] text-gray-500">{p.slug}</div>
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-600">
                                            {p.category?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-600">{p.price}</td>
                                        <td className="px-4 py-2 text-xs text-gray-600">{p.stock}</td>
                                        <td className="px-4 py-2 text-xs">
                                            {p.is_active ? (
                                                <span className="badge-brand">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="badge-muted">
                                                    Hidden
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('admin.products.edit', p.slug)}
                                                    className="btn-secondary"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(p)}
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
                                    <td className="px-4 py-6 text-xs text-gray-600" colSpan={6}>
                                        No products yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={products?.links} />
            </div>
        </DashboardLayout>
    );
}
