import ApplicationLogo from '@/Components/ApplicationLogo';
import CartSidebar from '@/Components/Cart/CartSidebar';
import Container from '@/Components/Container';
import { Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Icons ─────────────────────────────────────────────────────────── */
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
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/10"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-slate-900">
                    {getInitials(user.name)}
                </span>
                <span className="hidden text-sm font-medium text-white sm:block">{firstName}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} />
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
 * Trade portal header.
 *
 * Same shape as the public StorefrontHeader — logo, category nav, search,
 * cart — but on a dark trade skin and with every link pointed at /builder,
 * so a builder can never wander into retail pricing by accident.
 */
export default function BuilderHeader({ user, cartCount = 0, categories = [] }) {
    const [cartOpen, setCartOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [query, setQuery] = useState('');
    const { url } = usePage();

    const submitSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        router.visit(q ? `/builder/shop?q=${encodeURIComponent(q)}` : '/builder/shop');
    };

    const isActive = (href) => url.startsWith(href);

    return (
        <>
            {/* ── Trade bar: the constant reminder that these are not retail prices ── */}
            <div className="bg-amber-500 text-slate-900">
                <Container>
                    <div className="flex h-9 items-center justify-between text-[12px] font-semibold">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
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

            <header className="sticky top-0 z-40 bg-slate-900 shadow-lg">
                <Container>
                    <div className="flex h-16 items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setMobileOpen((o) => !o)}
                            className="rounded p-2 text-white/80 hover:bg-white/10 lg:hidden"
                            aria-label="Toggle menu"
                        >
                            <MenuIcon className="h-6 w-6" />
                        </button>

                        <Link href={route('builder.dashboard')} className="flex shrink-0 items-center gap-2">
                            <ApplicationLogo className="h-9 w-auto brightness-0 invert" />
                        </Link>

                        <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search the trade catalogue…"
                                className="w-full rounded-full border-0 bg-white/10 py-2 pl-4 pr-10 text-sm text-white placeholder-white/50 focus:bg-white/15 focus:ring-2 focus:ring-amber-500"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" aria-label="Search">
                                <SearchIcon className="h-4 w-4" />
                            </button>
                        </form>

                        <div className="ml-auto flex items-center gap-1 sm:gap-2">
                            <button
                                type="button"
                                onClick={() => setCartOpen(true)}
                                className="relative rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label="Open cart"
                            >
                                <CartIcon className="h-6 w-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-900">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {user ? <AccountMenu user={user} /> : null}
                        </div>
                    </div>

                    {/* ── Category nav ── */}
                    <nav className="hidden border-t border-white/10 lg:block">
                        <ul className="flex items-center gap-1 overflow-x-auto py-1">
                            <li>
                                <Link
                                    href={route('builder.shop.index')}
                                    className={`block whitespace-nowrap rounded px-3 py-2 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                                        isActive('/builder/shop') && !url.includes('category=')
                                            ? 'text-amber-400'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    All Products
                                </Link>
                            </li>
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <Link
                                        href={`/builder/shop?category=${cat.slug}`}
                                        className="block whitespace-nowrap rounded px-3 py-2 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </Container>

                {/* ── Mobile drawer ── */}
                {mobileOpen && (
                    <div className="border-t border-white/10 bg-slate-900 lg:hidden">
                        <Container>
                            <form onSubmit={submitSearch} className="relative py-3 md:hidden">
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search the trade catalogue…"
                                    className="w-full rounded-full border-0 bg-white/10 py-2 pl-4 pr-10 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-amber-500"
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60" aria-label="Search">
                                    <SearchIcon className="h-4 w-4" />
                                </button>
                            </form>
                            <ul className="pb-3">
                                <li>
                                    <Link
                                        href={route('builder.shop.index')}
                                        onClick={() => setMobileOpen(false)}
                                        className="block rounded px-2 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                                    >
                                        All Products
                                    </Link>
                                </li>
                                {categories.map((cat) => (
                                    <li key={cat.id}>
                                        <Link
                                            href={`/builder/shop?category=${cat.slug}`}
                                            onClick={() => setMobileOpen(false)}
                                            className="block rounded px-2 py-2.5 text-sm text-white/80 hover:bg-white/10"
                                        >
                                            {cat.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </Container>
                    </div>
                )}
            </header>

            <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
}
