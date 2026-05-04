import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function IconDashboard(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-18v6h8V3h-8Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconUser(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.01-7.5 4.5V21h15v-2.25c0-2.49-3.36-4.5-7.5-4.5Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconPaint(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M20.7 6.3 17.7 3.3a1 1 0 0 0-1.4 0L3 16.6V21h4.4L20.7 7.7a1 1 0 0 0 0-1.4ZM6.6 19H5v-1.6l9.9-9.9 1.6 1.6L6.6 19Zm11.3-11.3-1.6-1.6 1.3-1.3 1.6 1.6-1.3 1.3Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconTag(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M20.59 13.41 12 22l-9-9V2h11l6.59 6.59a2 2 0 0 1 0 2.82ZM7.5 8.5A1.5 1.5 0 1 0 6 7a1.5 1.5 0 0 0 1.5 1.5Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconBox(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M21 7.5 12 2 3 7.5V16.5L12 22l9-5.5V7.5Zm-9 12.1-7-4.3V9.3l7 4.3v6Zm1-6 7-4.3v6l-7 4.3v-6Zm-7.4-5L12 4.6l6.4 4L12 12.4l-6.4-3.8Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconReceipt(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Zm3 5h6v2H9V7Zm0 4h6v2H9v-2Zm0 4h4v2H9v-2Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconUsers(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM8 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 11Zm8 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4ZM8 13c-2.33 0-7 1.17-7 3.5V20h5v-3c0-1.5.73-2.71 1.9-3.6A11.3 11.3 0 0 0 8 13Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconChat(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-4 3v-3H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 6h10v2H7V9Zm0-4h10v2H7V5Zm0 8h7v2H7v-2Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconSettings(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M19.4 13a7.4 7.4 0 0 0 0-2l2-1.5-2-3.5-2.3.6a7.7 7.7 0 0 0-1.7-1L15 2h-6l-.4 2.6a7.7 7.7 0 0 0-1.7 1L4.6 5.9l-2 3.5L4.6 11a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.5 2.3-.6a7.7 7.7 0 0 0 1.7 1L9 22h6l.4-2.6a7.7 7.7 0 0 0 1.7-1l2.3.6 2-3.5-2-1.5ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconBook(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M6 2h12a2 2 0 0 1 2 2v17a1 1 0 0 1-1.45.9L15 20l-3.55 1.9A1 1 0 0 1 10 21V4a2 2 0 0 0-2-2H6Zm4 3h8v2h-8V5Zm0 4h8v2h-8V9Zm0 4h6v2h-6v-2Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconDocument(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm4 18H6V4h7v5h5v11ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconMenu(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconCoupon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"
                fill="currentColor"
            />
        </svg>
    );
}

function IconStar(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill="currentColor"
            />
        </svg>
    );
}

function SidebarLink({ href, active, icon, collapsed, label, children }) {
    return (
        <Link
            href={href}
            className={
                (active
                    ? 'bg-brand text-white'
                    : 'text-slate-700 hover:bg-brand hover:text-white') +
                ' group flex w-full items-center justify-start gap-2 rounded-none px-2.5 py-[11px] text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'
            }
        >
            {icon ? (
                <span
                    className={
                        (active ? 'text-white' : 'text-slate-500 group-hover:text-white') +
                        ' shrink-0'
                    }
                >
                    {icon}
                </span>
            ) : null}
            {collapsed ? null : <span className="truncate">{children}</span>}
        </Link>
    );
}

export default function DashboardLayout({ title, children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth >= 1280;
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1280) {
                setIsMobileOpen(false);
                setIsExpanded(false);
                return;
            }

            setIsMobileOpen(false);
            setIsExpanded(true);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems = useMemo(() => {
        const items = [];

        // For admin users, show Admin Dashboard as main dashboard
        if (user?.is_admin) {
            items.push({
                key: 'dashboard',
                label: 'Dashboard',
                href: route('admin.dashboard'),
                active: route().current('admin.dashboard'),
                icon: <IconDashboard className="h-5 w-5" />,
            });
        } else {
            // For regular users, show user dashboard
            items.push({
                key: 'dashboard',
                label: 'Dashboard',
                href: route('dashboard'),
                active: route().current('dashboard'),
                icon: <IconDashboard className="h-5 w-5" />,
            });
        }

        // Profile for all users
        items.push({
            key: 'profile',
            label: 'Profile',
            href: route('profile.edit'),
            active: route().current('profile.*'),
            icon: <IconUser className="h-5 w-5" />,
        });

        if (user?.is_seller) {
            items.push({
                key: 'seller',
                label: 'Seller',
                href: route('seller.dashboard'),
                active: route().current('seller.*'),
                icon: <IconBox className="h-5 w-5" />,
            });
        }

        if (user?.is_admin) {
            items.push(
                // ── Store ──
                { key: 'divider-store', divider: true, label: 'Store' },
                {
                    key: 'orders',
                    label: 'Orders',
                    href: route('admin.orders.index'),
                    active: route().current('admin.orders.*'),
                    icon: <IconReceipt className="h-5 w-5" />,
                },
                {
                    key: 'categories',
                    label: 'Categories',
                    href: route('admin.categories.index'),
                    active: route().current('admin.categories.*'),
                    icon: <IconTag className="h-5 w-5" />,
                },
                {
                    key: 'products',
                    label: 'Products',
                    href: route('admin.products.index'),
                    active: route().current('admin.products.*'),
                    icon: <IconBox className="h-5 w-5" />,
                },
                {
                    key: 'collections',
                    label: 'Collections',
                    href: route('admin.collections.index'),
                    active: route().current('admin.collections.*'),
                    icon: <IconTag className="h-5 w-5" />,
                },

                // ── Marketing ──
                { key: 'divider-marketing', divider: true, label: 'Marketing' },
                {
                    key: 'coupons',
                    label: 'Coupons',
                    href: route('admin.coupons.index'),
                    active: route().current('admin.coupons.*'),
                    icon: <IconCoupon className="h-5 w-5" />,
                },
                {
                    key: 'abandoned-carts',
                    label: 'Abandoned Carts',
                    href: route('admin.abandoned-carts.index'),
                    active: route().current('admin.abandoned-carts.*'),
                    icon: <IconReceipt className="h-5 w-5" />,
                },
                {
                    key: 'email-templates',
                    label: 'Email Templates',
                    href: route('admin.email-templates.index'),
                    active: route().current('admin.email-templates.*'),
                    icon: <IconChat className="h-5 w-5" />,
                },
                {
                    key: 'announcements',
                    label: 'Announcements',
                    href: route('admin.announcements.index'),
                    active: route().current('admin.announcements.*'),
                    icon: <IconChat className="h-5 w-5" />,
                },

                // ── CMS ──
                { key: 'divider-cms', divider: true, label: 'CMS' },
                {
                    key: 'pages',
                    label: 'Pages',
                    href: route('admin.pages.index'),
                    active: route().current('admin.pages.*'),
                    icon: <IconDocument className="h-5 w-5" />,
                },
                {
                    key: 'posts',
                    label: 'Blog Posts',
                    href: route('admin.posts.index'),
                    active: route().current('admin.posts.*'),
                    icon: <IconBook className="h-5 w-5" />,
                },
                {
                    key: 'authors',
                    label: 'Authors',
                    href: route('admin.authors.index'),
                    active: route().current('admin.authors.*'),
                    icon: <IconUser className="h-5 w-5" />,
                },
                {
                    key: 'menus',
                    label: 'Menus',
                    href: route('admin.menus.index'),
                    active: route().current('admin.menus.*'),
                    icon: <IconMenu className="h-5 w-5" />,
                },
                {
                    key: 'dictionary',
                    label: 'CMS Text',
                    href: route('admin.dictionary.index'),
                    active: route().current('admin.dictionary.*'),
                    icon: <IconBook className="h-5 w-5" />,
                },

                // ── SEO ──
                { key: 'divider-seo', divider: true, label: 'SEO' },
                {
                    key: 'seo',
                    label: 'SEO Management',
                    href: route('admin.seo.index'),
                    active: route().current('admin.seo.*'),
                    icon: <IconDocument className="h-5 w-5" />,
                },

                // ── Admin ──
                { key: 'divider-admin', divider: true, label: 'Admin' },
                {
                    key: 'users',
                    label: 'Users',
                    href: route('admin.users.index'),
                    active: route().current('admin.users.*'),
                    icon: <IconUsers className="h-5 w-5" />,
                },
                {
                    key: 'roles',
                    label: 'Roles & Permissions',
                    href: route('admin.roles.index'),
                    active: route().current('admin.roles.*'),
                    icon: <IconSettings className="h-5 w-5" />,
                },
                {
                    key: 'messages',
                    label: 'Messages',
                    href: route('admin.messages.index'),
                    active: route().current('admin.messages.*'),
                    icon: <IconChat className="h-5 w-5" />,
                },
                {
                    key: 'configuration',
                    label: 'Configuration',
                    href: route('admin.configuration.edit'),
                    active: route().current('admin.configuration.*'),
                    icon: <IconSettings className="h-5 w-5" />,
                },
            );
        }

        return items;
    }, [user]);

    const isCollapsedDesktop = !isExpanded;
    const sidebarCollapsed = isCollapsedDesktop && !isMobileOpen;
    const sidebarWidthClass = isExpanded || isMobileOpen ? 'w-[290px]' : 'w-[82px]';
    const sidebarTranslateClass = isMobileOpen
        ? 'translate-x-0'
        : '-translate-x-full xl:translate-x-0';

    return (
        <div className="min-h-screen bg-gray-50 text-xs text-gray-800">
            {isMobileOpen ? (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/30 xl:hidden"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close sidebar"
                />
            ) : null}

            <aside
                className={
                    sidebarTranslateClass +
                    ' ' +
                    sidebarWidthClass +
                    ' fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white text-gray-900 transition-all duration-300 ease-in-out'
                }
            >
                <div
                    className={
                        (sidebarCollapsed ? 'xl:justify-center' : 'justify-start') +
                        ' flex px-3 pt-4 pb-4'
                    }
                >
                    <Link href={route('home')} className="flex items-center gap-3">
                        {sidebarCollapsed ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">
                                N
                            </div>
                        ) : (
                            <ApplicationLogo className="h-auto w-auto max-w-[110px]" />
                        )}
                        <span className="sr-only">Northern TILE Distributors</span>
                    </Link>

                    <button
                        type="button"
                        className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 xl:hidden"
                        onClick={() => setIsMobileOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col overflow-y-auto duration-300 ease-linear">
                    <nav className="mb-4 px-3">
                        <div className="flex flex-col gap-4">
                            <div>
                                <h2
                                    className={
                                        (sidebarCollapsed ? 'xl:justify-center' : 'justify-start') +
                                        ' mb-2 flex text-[11px] uppercase leading-[18px] text-gray-400'
                                    }
                                >
                                    {sidebarCollapsed ? (
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="text-gray-300"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M5.99915 10.2451C6.96564 10.2451 7.74915 11.0286 7.74915 11.9951V12.0051C7.74915 12.9716 6.96564 13.7551 5.99915 13.7551C5.03265 13.7551 4.24915 12.9716 4.24915 12.0051V11.9951C4.24915 11.0286 5.03265 10.2451 5.99915 10.2451ZM17.9991 10.2451C18.9656 10.2451 19.7491 11.0286 19.7491 11.9951V12.0051C19.7491 12.9716 18.9656 13.7551 17.9991 13.7551C17.0326 13.7551 16.2491 12.9716 16.2491 12.0051V11.9951C16.2491 11.0286 17.0326 10.2451 17.9991 10.2451ZM13.7491 11.9951C13.7491 11.0286 12.9656 10.2451 11.9991 10.2451C11.0326 10.2451 10.2491 11.0286 10.2491 11.9951V12.0051C10.2491 12.9716 11.0326 13.7551 11.9991 13.7551C12.9656 13.7551 13.7491 12.9716 13.7491 12.0051V11.9951Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    ) : (
                                        ""
                                    )}
                                </h2>

                                <ul className="flex flex-col gap-1">
                                    {navItems.map((item) =>
                                        item.divider ? (
                                            <li key={item.key} className={`${sidebarCollapsed ? 'px-2' : 'px-4'} pt-4 pb-1`}>
                                                {sidebarCollapsed ? (
                                                    <div className="h-px bg-gray-200" />
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.label}</span>
                                                )}
                                            </li>
                                        ) : (
                                            <li key={item.key}>
                                                <SidebarLink
                                                    href={item.href}
                                                    active={item.active}
                                                    icon={item.icon}
                                                    collapsed={sidebarCollapsed}
                                                    label={item.label}
                                                >
                                                    {item.label}
                                                </SidebarLink>
                                            </li>
                                        )
                                    )}

                                    <li className="mt-1">
                                        <SidebarLink
                                            href={route('home')}
                                            active={false}
                                            icon={<IconDashboard className="h-5 w-5" />}
                                            collapsed={sidebarCollapsed}
                                            label="Back to Store"
                                        >
                                            Back to Store
                                        </SidebarLink>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                </div>
            </aside>

            <div
                className={
                    (isExpanded ? 'xl:ml-[290px]' : 'xl:ml-[82px]') +
                    ' flex-1 transition-all duration-300 ease-in-out'
                }
            >
                <header className="sticky top-0 z-30 flex w-full border-b border-gray-200 bg-white xl:border-b">
                    <div className="flex w-full flex-col items-center justify-between xl:flex-row xl:px-6">
                        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-1.5 sm:gap-3 xl:justify-normal xl:border-b-0 xl:px-0">
                            <button
                                type="button"
                                className={
                                    (isExpanded ? '' : 'bg-gray-100') +
                                    ' hidden h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 xl:flex'
                                }
                                onClick={() => {
                                    setIsExpanded((v) => !v);
                                    setIsMobileOpen(false);
                                }}
                                aria-label="Toggle Sidebar"
                            >
                                <svg width="14" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>

                            <button
                                type="button"
                                className={
                                    (isMobileOpen ? 'bg-gray-100' : '') +
                                    ' flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 xl:hidden'
                                }
                                onClick={() => setIsMobileOpen((v) => !v)}
                                aria-label="Toggle Mobile Menu"
                            >
                                <svg width="14" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>

                            <div className="hidden xl:block flex-1 px-4">
                                <div className="relative max-w-[430px]">
                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="h-9 w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-brand hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                                                aria-label="Open user menu"
                                            >
                                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.01-7.5 4.5V21h15v-2.25c0-2.49-3.36-4.5-7.5-4.5Z"
                                                        fill="currentColor"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content align="right">
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
                    </div>
                </header>

                <main className="mx-auto max-w-7xl p-3 md:p-4 overflow-visible">{children}</main>
            </div>
        </div>
    );
}
