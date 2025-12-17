import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <DashboardLayout title="Admin Dashboard">
            <Head title="Admin Dashboard" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-[15px] font-semibold">Store Settings</div>
                    <div className="mt-1 text-slate-600">
                        Configure your storefront UI and behavior.
                    </div>
                    <div className="mt-3">
                        <Link
                            href={route('admin.settings.ui.edit')}
                            className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-[13px] font-semibold text-white"
                        >
                            Open UI Settings
                        </Link>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-[15px] font-semibold">Catalog</div>
                    <div className="mt-1 text-slate-600">
                        Products and categories are seeded. Next step: build CRUD.
                    </div>
                    <div className="mt-3">
                        <Link
                            href={route('shop.index')}
                            className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:text-slate-900"
                        >
                            View Shop
                        </Link>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-[15px] font-semibold">Ops</div>
                    <div className="mt-1 text-slate-600">
                        Manage orders, messages, and users.
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
