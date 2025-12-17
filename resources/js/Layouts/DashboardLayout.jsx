import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function SidebarLink({ href, active, children }) {
    return (
        <Link
            href={href}
            className={
                (active
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900') +
                ' flex items-center rounded-md px-3 py-2 text-[13px] font-medium'
            }
        >
            {children}
        </Link>
    );
}

export default function DashboardLayout({ title, children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = useMemo(() => {
        const items = [
            {
                key: 'dashboard',
                label: 'Dashboard',
                href: route('dashboard'),
                active: route().current('dashboard'),
            },
            {
                key: 'profile',
                label: 'Profile',
                href: route('profile.edit'),
                active: route().current('profile.*'),
            },
        ];

        if (user?.is_admin) {
            items.push(
                {
                    key: 'admin',
                    label: 'Admin',
                    href: route('admin.dashboard'),
                    active: route().current('admin.dashboard'),
                },
                {
                    key: 'ui',
                    label: 'UI Settings',
                    href: route('admin.settings.ui.edit'),
                    active: route().current('admin.settings.ui.*'),
                },
            );
        }

        return items;
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50 text-[13px] text-slate-900">
            {mobileOpen ? (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close sidebar"
                />
            ) : null}

            <aside
                className={
                    (mobileOpen
                        ? 'translate-x-0'
                        : '-translate-x-full') +
                    ' fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white p-4 transition-transform md:static md:z-auto md:w-64 md:translate-x-0'
                }
            >
                <div className="flex items-center justify-between">
                    <Link href={route('home')} className="flex items-center gap-3">
                        <ApplicationLogo className="h-auto w-auto max-w-[110px]" />
                        <span className="sr-only">Jikra</span>
                    </Link>

                    <button
                        type="button"
                        className="rounded p-2 text-slate-500 hover:text-slate-700 md:hidden"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <div className="mt-5 space-y-1">
                    {navItems.map((item) => (
                        <SidebarLink key={item.key} href={item.href} active={item.active}>
                            {item.label}
                        </SidebarLink>
                    ))}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4">
                    <SidebarLink href={route('home')} active={false}>
                        Back to Store
                    </SidebarLink>
                </div>
            </aside>

            <div className="md:pl-64">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="rounded p-2 text-slate-500 hover:text-slate-700 md:hidden"
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open sidebar"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                    <path d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
                                </svg>
                            </button>

                            <div className="text-[15px] font-semibold leading-none text-slate-900">
                                {title}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-md border border-transparent bg-white px-2 py-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 focus:outline-none"
                                        >
                                            {user?.name}
                                            <svg
                                                className="ms-2 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
