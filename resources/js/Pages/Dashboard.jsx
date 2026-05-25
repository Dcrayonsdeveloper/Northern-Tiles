import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function InactiveBanner() {
    return (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
                <p className="text-sm font-semibold text-amber-800">Account inactive</p>
                <p className="mt-0.5 text-xs text-amber-700">
                    Your account is inactive. Ordering is disabled. Please contact support to reactivate your account.
                </p>
            </div>
        </div>
    );
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconShop(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
        </svg>
    );
}

function IconCart(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71L23 6H6" />
        </svg>
    );
}

function IconOrders(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="12" y2="17" />
        </svg>
    );
}

function IconChevron(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}

// ── Action card ───────────────────────────────────────────────────────────────

function ActionCard({ href, icon, label, description }) {
    return (
        <Link
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-150 hover:border-gray-300 hover:shadow-md"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors duration-150 group-hover:bg-brand group-hover:text-white">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900">{label}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{description}</p>
            </div>
            <IconChevron className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-colors duration-150 group-hover:text-brand" />
        </Link>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const actions = [
        {
            href: route('shop.index'),
            icon: <IconShop className="h-5 w-5" />,
            label: 'Browse Products',
            description: 'Explore our full tile catalogue',
        },
        {
            href: route('cart.index'),
            icon: <IconCart className="h-5 w-5" />,
            label: 'View Cart',
            description: 'Review items before checkout',
        },
        ...(!user?.is_admin && !user?.is_seller
            ? [{
                href: route('orders.index'),
                icon: <IconOrders className="h-5 w-5" />,
                label: 'Order History',
                description: 'Track and review past orders',
            }]
            : []),
    ];

    return (
        <DashboardLayout title="Dashboard">
            <Head title="Dashboard" />

            {user && user.is_active === false && <InactiveBanner />}

            {/* ── Welcome hero ─────────────────────────────────────────────── */}
            <div className="relative mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                {/* Brand accent bar */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-brand" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                            Welcome back
                        </p>
                        <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900">
                            {user?.name ?? 'there'}
                        </h1>
                        {user?.email && (
                            <p className="mt-1 text-xs text-gray-400">{user.email}</p>
                        )}
                    </div>

                    {user?.is_active !== false ? (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Account active
                        </span>
                    ) : (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Account inactive
                        </span>
                    )}
                </div>
            </div>

            {/* ── Action cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {actions.map((a) => (
                    <ActionCard key={a.href} {...a} />
                ))}
            </div>

            {/* ── Admin panel ──────────────────────────────────────────────── */}
            {user?.is_admin ? (
                <div className="relative mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gray-400" />
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Admin Access</div>
                            <p className="mt-0.5 text-xs text-gray-400">
                                You have administrator privileges for this store.
                            </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                            Admin
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <Link href={route('admin.dashboard')} className="btn-primary text-xs">
                            Open Admin Dashboard
                        </Link>
                        <Link href={route('admin.settings.ui.edit')} className="btn-secondary text-xs">
                            UI Settings
                        </Link>
                    </div>
                </div>
            ) : null}
        </DashboardLayout>
    );
}
