import ApplicationLogo from '@/Components/ApplicationLogo';
import CartSidebar from '@/Components/Cart/CartSidebar';
import Container from '@/Components/Container';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

import { CartIcon, MenuIcon, SearchIcon, UserIcon } from './Icons';
import MobileMenu from './MobileMenu';

/* ── Live Search Bar ───────────────────────────────────────────────
   Real input with a typewriter placeholder when empty. Calls
   /api/search as the user types (debounced) and renders a dropdown
   of product matches anchored to the input. Submit (Enter) navigates
   to /shop?q=… for the full results page.
─────────────────────────────────────────────────────────────────── */
const TYPEWRITER_WORDS = ['tiles', 'marble', 'hybrid flooring', 'subway tiles', 'timber', 'porcelain', 'stone', 'grout'];

function LiveSearchBar({ className = '', autoFocus = false, onResultClick }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const requestRef = useRef(0);

    // Typewriter placeholder — only animates while the input is empty
    const [displayText, setDisplayText] = useState('');
    const [wordIndex, setWordIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (query) return;
        const word = TYPEWRITER_WORDS[wordIndex];
        const speed = deleting ? 40 : 80;
        const pause = !deleting && charIndex === word.length ? 1800 : deleting && charIndex === 0 ? 400 : speed;
        const timer = setTimeout(() => {
            if (!deleting && charIndex === word.length) setDeleting(true);
            else if (deleting && charIndex === 0) {
                setDeleting(false);
                setWordIndex((p) => (p + 1) % TYPEWRITER_WORDS.length);
            } else setCharIndex((p) => p + (deleting ? -1 : 1));
        }, pause);
        setDisplayText(word.substring(0, charIndex));
        return () => clearTimeout(timer);
    }, [charIndex, deleting, wordIndex, query]);

    // Debounced live search — discards stale responses via requestRef
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            const reqId = ++requestRef.current;
            try {
                const r = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'same-origin',
                });
                if (reqId !== requestRef.current) return;
                if (r.ok) {
                    const d = await r.json();
                    setResults(d.results || []);
                }
            } catch (e) {
                if (reqId === requestRef.current) setResults([]);
            } finally {
                if (reqId === requestRef.current) setLoading(false);
            }
        }, 200);
    }, [query]);

    // Click outside closes the dropdown
    useEffect(() => {
        const onClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    // ESC closes
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                inputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setOpen(false);
        router.visit(`/shop?q=${encodeURIComponent(query.trim())}`);
    };

    const handleResultClick = () => {
        setOpen(false);
        setQuery('');
        onResultClick?.();
    };

    const placeholder = `Search for "${displayText}"`;
    const showDropdown = open && query.trim().length >= 2;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="flex items-center h-[38px] rounded-full border border-gray-200 bg-gray-50 px-4 gap-2 hover:border-brand/40 hover:bg-white focus-within:border-brand focus-within:bg-white transition-all">
                <SearchIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="flex-1 min-w-0 bg-transparent text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none border-0 p-0 focus:ring-0"
                    aria-label="Search products"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        aria-label="Clear search"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </form>

            {showDropdown && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[420px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
                    {loading ? (
                        <div className="px-4 py-6 text-center text-[13px] text-gray-400">Searching…</div>
                    ) : results.length === 0 ? (
                        <div className="px-4 py-6 text-center text-[13px] text-gray-500">
                            No products match "{query}".
                        </div>
                    ) : (
                        <>
                            <ul>
                                {results.map((r) => (
                                    <li key={r.id}>
                                        <Link
                                            href={r.url}
                                            onClick={handleResultClick}
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                                        >
                                            <img src={r.image_url} alt={r.name} className="h-12 w-12 rounded object-cover flex-shrink-0 border border-gray-100" loading="lazy" />
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate text-[13px] font-medium text-gray-900">{r.name}</div>
                                                {r.category && <div className="truncate text-[11px] text-gray-500">{r.category.name}</div>}
                                            </div>
                                            <div className="flex-shrink-0 text-[13px] font-semibold text-brand">${parseFloat(r.price || 0).toFixed(2)}</div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="block w-full border-t border-gray-100 px-4 py-3 text-left text-[12px] font-semibold text-brand hover:bg-gray-50 transition-colors"
                            >
                                See all results for "{query}" →
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Icons ─────────────────────────────────────────────────────────── */
function ChevronDown({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}
function PhoneIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    );
}
function MailIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}
function FacebookIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    );
}
function InstagramIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
    );
}

/* ── Default nav matching ntiled.com.au ────────────────────────────── */
const DEFAULT_NAV = [
    {
        label: 'Hybrid',
        url: '/shop?category=hybrid',
        children: [
            { label: 'Timber Oak Range', url: '/shop?category=hybrid-timber-oak-range' },
            { label: 'Herringbone 7mm', url: '/shop?category=herringbone-hybrid' },
            { label: 'Hybrid Tiles', url: '/shop?category=hybrid-tiles' },
            { label: 'Hybrid 7mm', url: '/shop?category=hybrid-7mm' },
            { label: 'Hybrid 8.5mm', url: '/shop?category=hybrid-8-5mm' },
            { label: 'Hybrid 9.5mm', url: '/shop?category=hybrid-9-5mm' },
            { label: 'Hybrid Tile Look', url: '/shop?category=hybrid-tile-look' },
            { label: 'Hybrid Herringbone', url: '/shop?category=hybrid-herringbone' },
            { label: 'Quads / Scotia', url: '/shop?category=quad' },
        ],
    },
    {
        label: 'Timber',
        url: '/shop?category=timber',
        children: [
            { label: 'Engineered Timber', url: '/shop?category=engineered-timber' },
        ],
    },
    {
        label: 'Stone',
        url: '/shop?category=stone',
    },
    {
        label: 'NTD Tiles',
        url: '/shop?category=ntd-tiles',
        children: [
            { label: 'SWARD', url: '/shop?category=sward-range' },
            { label: 'BALTIC STONE', url: '/shop?category=baltic-stone' },
            { label: 'TUNDRA', url: '/shop?category=tundra' },
            { label: 'ENZO', url: '/shop?category=enzo' },
        ],
    },
    {
        label: 'Tiles',
        url: '/shop?category=tiles',
        children: [
            { label: 'Terrazzo', url: '/shop?category=terrazzo' },
            { label: 'Subway', url: '/shop?category=subway' },
            { label: 'Builders Range', url: '/shop?category=builders-range' },
            { label: '20mm & 10mm External Porcelain', url: '/shop?category=external-porcelain' },
            { label: 'Clearance', url: '/shop?category=clearance' },
            { label: 'Italian Porcelain', url: '/shop?category=italian-porcelain' },
        ],
    },
    {
        label: 'Trade',
        url: '/shop?category=trade',
        children: [
            { label: 'Levelling System (Clips & Wedges)', url: '/shop?category=levelling-clips' },
            { label: 'Tiling & Waterproofing', url: '/shop?category=tiling-waterproofing' },
            { label: 'Mapei', url: '/shop?category=mapei' },
            { label: 'Smart Tile Waste', url: '/shop?category=smart-waste' },
            { label: 'ARDEX', url: '/shop?category=ardex' },
            { label: 'Soudal', url: '/shop?category=soudal' },
        ],
    },
    {
        label: 'Contact Us',
        url: '/contact',
    },
];

/* ── Dropdown nav item ─────────────────────────────────────────────── */
function NavDropdown({ item }) {
    const [open, setOpen] = useState(false);
    const timeout = useRef(null);

    const enter = () => { clearTimeout(timeout.current); setOpen(true); };
    const leave = () => { timeout.current = setTimeout(() => setOpen(false), 150); };

    if (!item.children?.length) {
        return (
            <Link href={item.url} className="px-3 py-3 text-[13px] font-semibold uppercase tracking-[0.5px] text-[#333] hover:text-brand transition-colors font-sans">
                {item.label}
            </Link>
        );
    }

    return (
        <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
            <Link href={item.url} className="flex items-center gap-1 px-3 py-3 text-[13px] font-semibold uppercase tracking-[0.5px] text-[#333] hover:text-brand transition-colors font-sans">
                {item.label}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Link>

            {open && (
                <div className="absolute left-0 top-full z-50 pt-1">
                    <div className="min-w-[240px] rounded-md border border-gray-100 bg-white py-2 shadow-lg">
                        {item.children.map((child, i) => (
                            <Link
                                key={i}
                                href={child.url}
                                className="block px-5 py-2 text-[13px] text-[#444] hover:bg-gray-50 hover:text-brand transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                {child.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Main header ───────────────────────────────────────────────────── */
export default function StorefrontHeader({ user, cartCount: initialCartCount = 0, topBar, menus }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [cartCount, setCartCount] = useState(initialCartCount);

    useEffect(() => { setCartCount(initialCartCount); }, [initialCartCount]);

    useEffect(() => {
        const handleCartUpdate = async (event) => {
            if (event.detail?.count !== undefined) {
                setCartCount(event.detail.count);
            } else {
                try {
                    const r = await fetch('/api/cart/count', { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
                    if (r.ok) { const d = await r.json(); setCartCount(d.count); }
                } catch (e) {}
            }
        };
        const handleOpenCart = () => setCartSidebarOpen(true);
        window.addEventListener('cart-updated', handleCartUpdate);
        window.addEventListener('open-cart-sidebar', handleOpenCart);
        return () => { window.removeEventListener('cart-updated', handleCartUpdate); window.removeEventListener('open-cart-sidebar', handleOpenCart); };
    }, []);

    const navItems = (menus?.header_main ?? []).length > 0 ? menus.header_main : DEFAULT_NAV;
    const mobileItems = (menus?.mobile ?? []).length > 0 ? menus.mobile : navItems;

    return (
        <header className="sticky top-0 z-40" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {/* ── Row 1: Blue top bar ─────────────────────────────────── */}
            <div className="bg-brand text-white">
                <Container>
                    <div className="flex items-center justify-between py-1.5 text-[12px]">
                        <div className="flex items-center gap-5">
                            <a href="tel:0394646623" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                                <PhoneIcon className="h-3.5 w-3.5" />
                                03 9464 6623
                            </a>
                            <span className="hidden sm:inline text-white/40">|</span>
                            <a href="tel:0416924324" className="hidden sm:flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                                <PhoneIcon className="h-3.5 w-3.5" />
                                0416 924 324
                            </a>
                            <a href="mailto:info@ntiled.com.au" className="hidden sm:flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                                <MailIcon className="h-3.5 w-3.5" />
                                info@ntiled.com.au
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <a href="https://www.facebook.com/ntiled/" target="_blank" rel="noreferrer noopener" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
                                <FacebookIcon className="h-4 w-4" />
                            </a>
                            <a href="https://www.instagram.com/northern.tile.distributors/" target="_blank" rel="noreferrer noopener" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
                                <InstagramIcon className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </Container>
            </div>

            {/* ── Row 2: White header — logo left, menu center, icons right ── */}
            <div className="bg-white border-b border-gray-100">
                <Container>
                    <div className="flex items-center justify-between" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                        {/* Logo */}
                        <Link href={route('home')} className="flex-shrink-0">
                            <ApplicationLogo className="h-auto w-auto max-w-[140px]" />
                            <span className="sr-only">Northern TILE Distributors</span>
                        </Link>

                        {/* Search bar (desktop) */}
                        <LiveSearchBar className="hidden sm:block flex-1 max-w-[400px] mx-4 lg:mx-6" />

                        {/* Right icons */}
                        <div className="flex items-center gap-3">
                            {/* Phone (desktop) */}
                            <a href="tel:0394646623" className="hidden xl:flex items-center gap-1.5 text-[13px] font-medium text-[#333] hover:text-brand transition-colors">
                                <PhoneIcon className="h-4 w-4" />
                                03 9464 6623
                            </a>
                            <a href="tel:0416924324" className="hidden xl:flex items-center gap-1.5 text-[13px] font-medium text-[#333] hover:text-brand transition-colors">
                                <PhoneIcon className="h-4 w-4" />
                                0416 924 324
                            </a>

                            <div className="hidden xl:block w-px h-5 bg-gray-200 mx-1" />

                            {/* Search icon (mobile only) */}
                            <button type="button" onClick={() => setMobileSearchOpen((v) => !v)} className="p-2 text-[#333] hover:text-brand transition-colors sm:hidden" aria-label="Search" aria-expanded={mobileSearchOpen}>
                                <SearchIcon className="h-[18px] w-[18px]" />
                            </button>

                            {/* Cart */}
                            <button type="button" onClick={() => setCartSidebarOpen(true)} className="relative p-2 text-[#333] hover:text-brand transition-colors" aria-label="Cart">
                                <CartIcon className="h-[18px] w-[18px]" />
                                {cartCount > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </button>

                            {/* User */}
                            {user ? (
                                <Link href={route('dashboard')} className="p-2 text-[#333] hover:text-brand transition-colors" aria-label="Account">
                                    <UserIcon className="h-[18px] w-[18px]" />
                                </Link>
                            ) : (
                                <Link href="/login" className="p-2 text-[#333] hover:text-brand transition-colors" aria-label="Login">
                                    <UserIcon className="h-[18px] w-[18px]" />
                                </Link>
                            )}

                            {/* Mobile hamburger */}
                            <button type="button" onClick={() => setMobileMenuOpen(true)} className="p-2 text-[#333] hover:text-brand lg:hidden" aria-label="Menu">
                                <MenuIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    {/* Mobile inline search — same header, no overlay */}
                    {mobileSearchOpen && (
                        <div className="sm:hidden pb-3">
                            <LiveSearchBar autoFocus className="w-full" onResultClick={() => setMobileSearchOpen(false)} />
                        </div>
                    )}
                </Container>
            </div>

            {/* ── Row 3: Nav bar (desktop) ────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 hidden lg:block">
                <Container>
                    <nav className="flex items-center justify-center">
                        {navItems.map((item, i) => (
                            <NavDropdown key={i} item={item} />
                        ))}
                    </nav>
                </Container>
            </div>

            <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} navItems={mobileItems} user={user} />
            <CartSidebar open={cartSidebarOpen} onClose={() => setCartSidebarOpen(false)} />
        </header>
    );
}
