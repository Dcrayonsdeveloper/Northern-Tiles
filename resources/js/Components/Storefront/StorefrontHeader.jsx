import ApplicationLogo from '@/Components/ApplicationLogo';
import CartSidebar from '@/Components/Cart/CartSidebar';
import Container from '@/Components/Container';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

import { CartIcon, MenuIcon, SearchIcon, UserIcon } from './Icons';
import MegaMenu from './MegaMenu';
import MobileMenu from './MobileMenu';
import TopBar from './TopBar';

export default function StorefrontHeader({ user, cartCount: initialCartCount = 0, topBar, menus }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
    const [cartCount, setCartCount] = useState(initialCartCount);

    // Sync cart count when props change (after Inertia page refresh)
    useEffect(() => {
        setCartCount(initialCartCount);
    }, [initialCartCount]);

    // Listen for cart-updated events to sync cart count
    useEffect(() => {
        const handleCartUpdate = async (event) => {
            if (event.detail?.count !== undefined) {
                setCartCount(event.detail.count);
            } else {
                // Fetch current count from API if not provided
                try {
                    const response = await fetch('/api/cart/count', {
                        headers: { 'Accept': 'application/json' },
                        credentials: 'same-origin',
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setCartCount(data.count);
                    }
                } catch (e) {
                    // Silently fail
                }
            }
        };

        const handleOpenCartSidebar = () => {
            setCartSidebarOpen(true);
        };

        window.addEventListener('cart-updated', handleCartUpdate);
        window.addEventListener('open-cart-sidebar', handleOpenCartSidebar);
        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
            window.removeEventListener('open-cart-sidebar', handleOpenCartSidebar);
        };
    }, []);

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

            <Container className="relative flex items-center justify-between py-3">
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

                    <button
                        type="button"
                        onClick={() => setCartSidebarOpen(true)}
                        className="relative rounded p-2 text-gray-400 hover:text-gray-600"
                        aria-label="Open cart"
                    >
                        <CartIcon className="h-[19px] w-[19px]" />
                        {cartCount > 0 && (
                            <span
                                className="cartCount absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white"
                                data-cart-count=""
                            >
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </button>

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
            </Container>

            <MobileMenu
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                navItems={mobileItems}
                user={user}
            />

            <CartSidebar
                open={cartSidebarOpen}
                onClose={() => setCartSidebarOpen(false)}
            />
        </header>
    );
}
