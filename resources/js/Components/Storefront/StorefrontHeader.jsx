import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

import { CartIcon, MenuIcon, SearchIcon, UserIcon } from './Icons';
import MegaMenu from './MegaMenu';
import MobileMenu from './MobileMenu';
import TopBar from './TopBar';

export default function StorefrontHeader({ user, cartCount = 0, topBar, menus }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const topMenuItems = menus?.header_top ?? [];

    // Default nav items (fallback when no menu is configured)
    const defaultNavItems = [
        { label: 'Home', url: route('home'), target: '_self' },
        { label: 'New Arrivals', url: route('shop.index', { category: 'new-arrivals' }), target: '_self' },
        { label: 'Best Sellers', url: route('shop.index', { category: 'best-sellers' }), target: '_self' },
        { label: 'Kitchen Accessories', url: route('shop.index', { category: 'kitchen-accessories' }), target: '_self' },
        { label: 'Mobile Accessories', url: route('shop.index', { category: 'mobile-accessories' }), target: '_self' },
        { label: 'Corporate Gifting', url: route('shop.index', { category: 'corporate-gifting' }), target: '_self' },
        { label: 'Contact', url: route('pages.contact'), target: '_self' },
    ];

    // Use full menu data for MegaMenu (includes children, is_mega, images, etc.)
    const navItems = (menus?.header_main ?? []).length > 0
        ? menus.header_main
        : defaultNavItems;

    // Mobile menu items (use dedicated mobile menu or fallback to header)
    const mobileItems = (menus?.mobile ?? []).length > 0
        ? menus.mobile
        : navItems;

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
            <TopBar topBar={topBar} menuItems={topMenuItems} />

            <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                <Link href={route('home')} className="flex items-center">
                    <ApplicationLogo className="h-auto w-auto max-w-[110px]" />
                    <span className="sr-only">Jikra</span>
                </Link>

                {/* Desktop Mega Menu */}
                <div className="hidden flex-1 justify-center md:flex">
                    <MegaMenu items={navItems} />
                </div>

                <div className="ml-auto flex items-center gap-4">

                    <Link
                        href={route('shop.index')}
                        className="rounded p-2 text-gray-400 hover:text-gray-600"
                        aria-label="Search"
                    >
                        <SearchIcon className="h-[19px] w-[19px]" />
                    </Link>

                    <Link
                        href={route('cart.index')}
                        className="relative rounded p-2 text-gray-400 hover:text-gray-600"
                        aria-label="Cart"
                    >
                        <CartIcon className="h-[19px] w-[19px]" />
                        <span
                            className="cartCount absolute -right-1 -top-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
                            data-cart-count=""
                            style={{ display: cartCount > 0 ? 'inline-flex' : 'none' }}
                        >
                            {cartCount}
                        </span>
                    </Link>

                    {user ? (
                        <>
                            <Link
                                href={route('dashboard')}
                                className="rounded p-2 text-gray-400 hover:text-gray-600"
                                aria-label="Account"
                            >
                                <UserIcon className="h-[19px] w-[19px]" />
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                Logout
                            </Link>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="rounded p-2 text-gray-400 hover:text-gray-600"
                            aria-label="Login"
                        >
                            <UserIcon className="h-[19px] w-[19px]" />
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="rounded p-2 text-gray-400 hover:text-gray-600 md:hidden"
                        aria-label="Open menu"
                    >
                        <MenuIcon className="h-6 w-6" />
                    </button>
                </div>
            </div>

            <MobileMenu
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                navItems={mobileItems}
                user={user}
            />
        </header>
    );
}
