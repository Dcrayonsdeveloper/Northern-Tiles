import ApplicationLogo from '@/Components/ApplicationLogo';
import CartSidebar from '@/Components/Cart/CartSidebar';
import Container from '@/Components/Container';
import { Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Icons ─────────────────────────────────────────────────────────── */
function ChevronDownIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function CartIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 17a2 2 0 100 4 2 2 0 000-4zM9 19a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );
}

function SearchIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function MenuIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function CloseIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function ChevronDown({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0]?.[0] ?? '?').toUpperCase();
}

/* ── Account dropdown ──────────────────────────────────────────────── */
function AccountMenu({ user }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const firstName = user.name?.split(' ')[0] ?? 'Account';

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const handleLogout = useCallback((e) => {
        e.preventDefault();
        setOpen(false);
        router.post(route('logout'));
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white py-1 pl-1 pr-2 transition-colors hover:bg-gray-50"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-navy-dark">
                    {getInitials(user.name)}
                </span>
                <span className="hidden text-sm font-semibold text-navy-dark sm:block">{firstName}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <div className="truncate text-sm font-semibold text-gray-900">{user.name}</div>
                        <div className="truncate text-xs text-gray-500">{user.email}</div>
                        {user.builder_company ? (
                            <div className="mt-1.5 inline-flex rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                {user.builder_company}
                            </div>
                        ) : null}
                    </div>

                    <Link href={route('builder.dashboard')} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        Trade Dashboard
                    </Link>
                    <Link href={route('orders.index')} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        My Orders
                    </Link>
                    <Link href={route('profile.edit')} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        My Account
                    </Link>
                    {/* Retail site stays one click away — trade accounts still buy
                        non-catalogue items at normal prices. */}
                    <a href="/" className="block border-t border-gray-100 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        Main Website →
                    </a>
                    {user.is_admin ? (
                        <a href="/admin/dashboard" className="block px-4 py-2.5 text-sm font-medium text-brand hover:bg-gray-50">
                            Admin Panel
                        </a>
                    ) : null}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full border-t border-gray-100 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                        Log Out
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * One root in the trade nav.
 *
 * A root with children opens a dropdown and goes nowhere itself: the shop
 * filters on one slug exactly, and since the category rebuild every product
 * hangs off a sub-category, so following a root landed on "0 products
 * available to your account". Hover opens it on a mouse; the root is a
 * <button> so tap and keyboard reach the same menu, which is the only way in
 * on a touch device.
 *
 * A root with no children holds its products directly and stays a plain link.
 */
function NavCategory({ category }) {
    const [open, setOpen] = useState(false);
    const timer = useRef(null);

    const children = category.children ?? [];

    const enter = () => { clearTimeout(timer.current); setOpen(true); };
    const leave = () => { timer.current = setTimeout(() => setOpen(false), 150); };

    useEffect(() => () => clearTimeout(timer.current), []);

    if (children.length === 0) {
        return (
            <li>
                <Link
                    href={`/builder/shop?category=${category.slug}`}
                    className="block whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-navy/70 transition-colors hover:border-gold/40 hover:text-navy"
                >
                    {category.name}
                </Link>
            </li>
        );
    }

    return (
        <li className="relative" onMouseEnter={enter} onMouseLeave={leave}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="true"
                className={`flex items-center gap-1 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                    open ? 'border-gold text-navy' : 'border-transparent text-navy/70 hover:border-gold/40 hover:text-navy'
                }`}
            >
                {category.name}
                <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 pt-1">
                    <div className="min-w-[240px] rounded-md border border-gray-100 bg-white py-2 shadow-lg">
                        {children.map((child) => (
                            <Link
                                key={child.id}
                                href={`/builder/shop?category=${child.slug}`}
                                onClick={() => setOpen(false)}
                                className="block px-5 py-2 text-[13px] text-navy/80 transition-colors hover:bg-gray-50 hover:text-navy"
                            >
                                {child.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </li>
    );
}

/**
 * Trade portal header.
 *
 * Same shape as the public StorefrontHeader — logo, category nav, search,
 * cart — but on a dark trade skin and with every link pointed at /builder,
 * so a builder can never wander into retail pricing by accident.
 */
export default function BuilderHeader({ user, cartCount: initialCartCount = 0, categories = [] }) {
    const [cartOpen, setCartOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [cartCount, setCartCount] = useState(initialCartCount);
    const { url } = usePage();

    useEffect(() => { setCartCount(initialCartCount); }, [initialCartCount]);

    // Close mobile menu on escape key and prevent body scroll when open
    useEffect(() => {
        if (!mobileOpen) return;
        const handleEscape = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    // Keep the trade badge live between Inertia navigations by listening for
    // the trade-scoped cart event. Mirror the pattern StorefrontHeader uses
    // for retail. Without this the badge was stale after add-to-cart.
    useEffect(() => {
        const handle = async (event) => {
            if (event?.detail?.count !== undefined) {
                setCartCount(event.detail.count);
                return;
            }
            try {
                const r = await fetch('/api/builder/cart/count', {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'same-origin',
                });
                if (r.ok) {
                    const d = await r.json();
                    setCartCount(d.count ?? 0);
                }
            } catch (e) { /* silent — bad-network fallback */ }
        };
        const handleOpenCart = () => setCartOpen(true);
        window.addEventListener('cart-updated:trade', handle);
        window.addEventListener('open-cart-sidebar', handleOpenCart);
        return () => {
            window.removeEventListener('cart-updated:trade', handle);
            window.removeEventListener('open-cart-sidebar', handleOpenCart);
        };
    }, []);

    const submitSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        router.visit(q ? `/builder/shop?q=${encodeURIComponent(q)}` : '/builder/shop');
    };

    const isActive = (href) => url.startsWith(href);

    return (
        <>
            {/* ── Trade bar: the constant reminder that these are not retail prices ── */}
            <div className="bg-gold text-navy-dark">
                <Container>
                    <div className="flex h-9 items-center justify-between text-[12px] font-semibold">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-navy-dark px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-light">
                                Trade
                            </span>
                            <span className="hidden sm:inline">
                                Builder &amp; Contractor Portal — your pricing, applied at checkout
                            </span>
                            <span className="sm:hidden">Builder Portal</span>
                        </div>
                        {user?.builder_company ? (
                            <span className="hidden truncate md:block">{user.builder_company}</span>
                        ) : null}
                    </div>
                </Container>
            </div>

            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
                <Container>
                    <div className="flex h-16 items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setMobileOpen((o) => !o)}
                            className="rounded p-2 text-navy hover:bg-gray-100 lg:hidden"
                            aria-label="Toggle menu"
                        >
                            <MenuIcon className="h-6 w-6" />
                        </button>

                        <Link href={route('builder.dashboard')} className="flex shrink-0 items-center gap-2">
                            <ApplicationLogo className="h-9 w-auto" />
                        </Link>

                        <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search the trade catalogue…"
                                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-4 pr-10 text-sm text-navy-dark placeholder-gray-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/40"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy" aria-label="Search">
                                <SearchIcon className="h-4 w-4" />
                            </button>
                        </form>

                        <div className="ml-auto flex items-center gap-1 sm:gap-2">
                            <button
                                type="button"
                                onClick={() => setCartOpen(true)}
                                className="relative rounded-full p-2 text-navy transition-colors hover:bg-gray-100"
                                aria-label="Open cart"
                            >
                                <CartIcon className="h-6 w-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy-dark">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {user ? <AccountMenu user={user} /> : null}
                        </div>
                    </div>

                    {/* ── Category nav ── */}
                    <nav className="hidden border-t border-gray-100 lg:block">
                        {/* No overflow-x-auto here: the dropdown is absolutely positioned
                            inside this list, and a scroll container clipped it to a
                            sliver. Wrapping is the right behaviour for a handful of
                            roots anyway. */}
                        <ul className="flex flex-wrap items-center gap-1 py-1">
                            <li>
                                <Link
                                    href={route('builder.shop.index')}
                                    className={`block whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                                        isActive('/builder/shop') && !url.includes('category=')
                                            ? 'border-gold text-navy'
                                            : 'border-transparent text-navy/70 hover:border-gold/40 hover:text-navy'
                                    }`}
                                >
                                    All Products
                                </Link>
                            </li>
                            {categories.map((cat) => (
                                <NavCategory key={cat.id} category={cat} />
                            ))}
                        </ul>
                    </nav>
                </Container>

                {/* ── Mobile drawer ── */}
                <div
                    className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Sidebar */}
                    <div
                        className={`absolute inset-y-0 left-0 w-72 bg-white shadow-xl overflow-y-auto transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
                            <Link href={route('builder.dashboard')} onClick={() => setMobileOpen(false)}>
                                <ApplicationLogo className="h-8 w-auto" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Close menu"
                            >
                                <CloseIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="border-b border-gray-100 px-4 py-3">
                            <form onSubmit={submitSearch} className="relative">
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search the trade catalogue…"
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-10 text-sm text-navy-dark placeholder-gray-400 focus:border-gold focus:bg-white focus:ring-2 focus:ring-gold/40"
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Search">
                                    <SearchIcon className="h-4 w-4" />
                                </button>
                            </form>
                        </div>

                        {/* Navigation */}
                        <nav className="px-4 py-4">
                            <Link
                                href={route('builder.shop.index')}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-navy-dark hover:bg-gray-50"
                            >
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                                All Products
                            </Link>

                            {categories.map((cat) => (
                                <div key={cat.id} className="mt-2">
                                    {(cat.children ?? []).length > 0 ? (
                                        <>
                                            <div className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                {cat.name}
                                            </div>
                                            <ul className="space-y-0.5">
                                                {cat.children.map((child) => (
                                                    <li key={child.id}>
                                                        <Link
                                                            href={`/builder/shop?category=${child.slug}`}
                                                            onClick={() => setMobileOpen(false)}
                                                            className="block rounded-lg px-3 py-2.5 text-sm text-navy/80 hover:bg-gray-50 hover:text-navy-dark"
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <Link
                                            href={`/builder/shop?category=${cat.slug}`}
                                            onClick={() => setMobileOpen(false)}
                                            className="block rounded-lg px-3 py-2.5 text-sm text-navy/80 hover:bg-gray-50 hover:text-navy-dark"
                                        >
                                            {cat.name}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* Footer links */}
                        <div className="mt-auto border-t border-gray-200 px-4 py-4">
                            <Link
                                href={route('builder.dashboard')}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy/80 hover:bg-gray-50"
                            >
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>
                                Trade Dashboard
                            </Link>
                            <Link
                                href={route('orders.index')}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy/80 hover:bg-gray-50"
                            >
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                </svg>
                                My Orders
                            </Link>
                            <a
                                href="/"
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy/80 hover:bg-gray-50"
                            >
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                                Main Website
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} scope="trade" />
        </>
    );
}
