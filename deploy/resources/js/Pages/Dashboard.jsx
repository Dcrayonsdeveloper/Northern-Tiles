import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <DashboardLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-[15px] font-semibold">Welcome</div>
                    <div className="mt-1 text-slate-600">
                        Hi {user?.name}, manage your account and orders.
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-[15px] font-semibold">Quick Links</div>
                    <div className="mt-3 grid gap-2">
                        <Link
                            href={route('shop.index')}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Browse Products
                        </Link>
                        <Link
                            href={route('cart.index')}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                            View Cart
                        </Link>
                        <Link
                            href={route('profile.edit')}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Profile Settings
                        </Link>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-[15px] font-semibold">Status</div>
                    <div className="mt-2 text-slate-600">
                        Your account is active.
                    </div>
                </div>
            </div>

            {user?.is_admin ? (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-[15px] font-semibold">Admin</div>
                    <div className="mt-2 text-slate-600">
                        You have admin access.
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                        <Link
                            href={route('admin.dashboard')}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Open Admin Dashboard
                        </Link>
                        <Link
                            href={route('admin.settings.ui.edit')}
                            className="rounded-lg bg-gray-900 px-3 py-2 text-[13px] font-semibold text-white"
                        >
                            UI Settings
                        </Link>
                    </div>
                </div>
            ) : null}
        </DashboardLayout>
    );
}
