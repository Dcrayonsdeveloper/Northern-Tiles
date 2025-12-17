import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <DashboardLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-[15px] font-semibold">Welcome</div>
                    <div className="mt-1 text-slate-600">
                        Hi {user?.name}, manage your account and orders.
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-[15px] font-semibold">Quick Links</div>
                    <div className="mt-2 space-y-2">
                        <Link
                            href={route('shop.index')}
                            className="block text-slate-700 underline hover:text-slate-900"
                        >
                            Browse Products
                        </Link>
                        <Link
                            href={route('cart.index')}
                            className="block text-slate-700 underline hover:text-slate-900"
                        >
                            View Cart
                        </Link>
                        <Link
                            href={route('profile.edit')}
                            className="block text-slate-700 underline hover:text-slate-900"
                        >
                            Profile Settings
                        </Link>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-[15px] font-semibold">Status</div>
                    <div className="mt-2 text-slate-600">
                        Your account is active.
                    </div>
                </div>
            </div>

            {user?.is_admin ? (
                <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-[15px] font-semibold">Admin</div>
                    <div className="mt-2 text-slate-600">
                        You have admin access.
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                        <Link
                            href={route('admin.dashboard')}
                            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:text-slate-900"
                        >
                            Open Admin Dashboard
                        </Link>
                        <Link
                            href={route('admin.settings.ui.edit')}
                            className="rounded-md bg-slate-900 px-3 py-2 text-[13px] font-semibold text-white"
                        >
                            UI Settings
                        </Link>
                    </div>
                </div>
            ) : null}
        </DashboardLayout>
    );
}
