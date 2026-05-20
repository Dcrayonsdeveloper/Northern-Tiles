import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// ── Admin pages ───────────────────────────────────────────────────────────────
const ADMIN_PAGES = [
    { label: 'Dashboard',           href: '/admin/dashboard',          section: 'Overview',    keywords: ['home', 'overview', 'stats', 'analytics'] },
    { label: 'Orders',              href: '/admin/orders',             section: 'Store',       keywords: ['order', 'purchase', 'sale', 'invoice', 'customer order'] },
    { label: 'Categories',          href: '/admin/categories',         section: 'Store',       keywords: ['category', 'catalogue', 'group', 'classification'] },
    { label: 'Products',            href: '/admin/products',           section: 'Store',       keywords: ['product', 'item', 'tile', 'sku', 'inventory', 'stock'] },
    { label: 'Collections',         href: '/admin/collections',        section: 'Store',       keywords: ['collection', 'bundle', 'group', 'set'] },
    { label: 'Coupons',             href: '/admin/coupons',            section: 'Marketing',   keywords: ['coupon', 'discount', 'promo', 'code', 'voucher'] },
    { label: 'Abandoned Carts',     href: '/admin/abandoned-carts',    section: 'Marketing',   keywords: ['abandoned', 'cart', 'recovery', 'lost'] },
    { label: 'Email Templates',     href: '/admin/email-templates',    section: 'Marketing',   keywords: ['email', 'template', 'notification', 'mail'] },
    { label: 'Announcements',       href: '/admin/announcements',      section: 'Marketing',   keywords: ['announcement', 'banner', 'notice', 'alert'] },
    { label: 'Pages',               href: '/admin/pages',              section: 'CMS',         keywords: ['page', 'content', 'cms', 'static'] },
    { label: 'Blog Posts',          href: '/admin/posts',              section: 'CMS',         keywords: ['blog', 'post', 'article', 'news', 'write'] },
    { label: 'Authors',             href: '/admin/authors',            section: 'CMS',         keywords: ['author', 'writer', 'contributor'] },
    { label: 'Menus',               href: '/admin/menus',              section: 'CMS',         keywords: ['menu', 'navigation', 'nav', 'link'] },
    { label: 'CMS Text',            href: '/admin/dictionary',         section: 'CMS',         keywords: ['cms', 'text', 'dictionary', 'content', 'copy'] },
    { label: 'SEO Management',      href: '/admin/seo',                section: 'SEO',         keywords: ['seo', 'meta', 'title', 'description', 'sitemap', 'google'] },
    { label: 'Users',               href: '/admin/users',              section: 'Admin',       keywords: ['user', 'account', 'member', 'customer', 'people'] },
    { label: 'Roles & Permissions', href: '/admin/roles',              section: 'Admin',       keywords: ['role', 'permission', 'access', 'rights', 'admin'] },
    { label: 'Messages',            href: '/admin/messages',           section: 'Admin',       keywords: ['message', 'contact', 'inquiry', 'support', 'chat'] },
    { label: 'Configuration',       href: '/admin/configuration',      section: 'Admin',       keywords: ['config', 'setting', 'setup', 'store setting', 'general'] },
];

// Section icons
const SECTION_ICON = {
    Overview:  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm6 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>,
    Store:     <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C4.016 11.227 4.5 12 5.5 12H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>,
    Marketing: <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>,
    CMS:       <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>,
    SEO:       <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>,
    Admin:     <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
};

function matchPages(q) {
    const lower = q.toLowerCase();
    return ADMIN_PAGES.filter((p) =>
        p.label.toLowerCase().includes(lower) ||
        p.keywords.some((k) => k.includes(lower))
    ).slice(0, 5);
}

// ── Persistence ───────────────────────────────────────────────────────────────
const RECENT_KEY = 'admin_recent_searches';
const MAX_RECENT = 6;
const TRENDING   = ['subway tile', 'porcelain', 'mosaic', 'marble', 'gloss', 'matt', 'large format', 'outdoor'];

function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(q) {
    const t = q.trim(); if (!t) return;
    const prev = getRecent().filter((r) => r.toLowerCase() !== t.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify([t, ...prev].slice(0, MAX_RECENT)));
}
function removeRecent(q) {
    localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter((r) => r !== q)));
}

// ── Highlight matching text ───────────────────────────────────────────────────
function Highlight({ text, query }) {
    if (!query) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-transparent font-bold text-gray-900">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GlobalSearch() {
    const [query,     setQuery]     = useState('');
    const [products,  setProducts]  = useState([]);
    const [pages,     setPages]     = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [isOpen,    setIsOpen]    = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const [recent,    setRecent]    = useState([]);

    const containerRef = useRef(null);
    const inputRef     = useRef(null);
    const debounceRef  = useRef(null);

    useEffect(() => {
        function handler(e) {
            if (!containerRef.current?.contains(e.target)) close();
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function open()  { setIsOpen(true); setRecent(getRecent()); }
    function close() { setIsOpen(false); setActiveIdx(-1); }

    function handleChange(e) {
        const val = e.target.value;
        setQuery(val);
        setActiveIdx(-1);
        clearTimeout(debounceRef.current);

        if (val.trim().length < 2) {
            setProducts([]); setPages([]); setLoading(false);
            return;
        }

        // Pages: instant client-side
        setPages(matchPages(val));

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res  = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
                const data = await res.json();
                setProducts(data.products ?? []);
            } catch {
                setProducts([]);
            } finally {
                setLoading(false);
            }
        }, 250);
    }

    function navigate(url) {
        close(); setQuery(''); setProducts([]); setPages([]);
        router.visit(url);
    }

    function selectProduct(p)  { saveRecent(p.name);  navigate(`/admin/products/${p.id}/edit`); }
    function selectPage(p)     { saveRecent(p.label); navigate(p.href); }
    function selectQuery(q)    { saveRecent(q);        navigate(route('admin.products.index', { search: q })); }

    function handleDeleteRecent(e, q) {
        e.stopPropagation();
        removeRecent(q);
        setRecent(getRecent());
    }

    // Flat keyboard-navigable item list
    const isSearching = query.trim().length >= 2;
    const items = [];
    if (isSearching) {
        pages.forEach((p)    => items.push({ type: 'page',    data: p }));
        products.forEach((p) => items.push({ type: 'product', data: p }));
        items.push({ type: 'viewall' });
    } else {
        recent.forEach((r)   => items.push({ type: 'recent',   data: r }));
        TRENDING.forEach((t) => items.push({ type: 'trending', data: t }));
    }

    function handleKeyDown(e) {
        if (!isOpen) { if (e.key === 'ArrowDown') open(); return; }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, items.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = items[activeIdx];
            if (!item) { if (query.trim()) selectQuery(query.trim()); return; }
            if (item.type === 'page')     selectPage(item.data);
            if (item.type === 'product')  selectProduct(item.data);
            if (item.type === 'viewall')  selectQuery(query.trim());
            if (item.type === 'recent')   selectQuery(item.data);
            if (item.type === 'trending') handleChange({ target: { value: item.data } });
        } else if (e.key === 'Escape') {
            close(); inputRef.current?.blur();
        }
    }

    const pageOffset    = 0;
    const productOffset = pages.length;
    const viewAllIdx    = pages.length + products.length;

    return (
        <div ref={containerRef} className="relative w-full max-w-[430px]">

            {/* ── Input ── */}
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor" />
                </svg>
            </span>

            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={open}
                placeholder="Search products & pages..."
                autoComplete="off"
                className="h-9 w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-8 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />

            {query && (
                <button
                    type="button"
                    onClick={() => { setQuery(''); setProducts([]); setPages([]); setLoading(false); inputRef.current?.focus(); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded text-gray-400 hover:text-gray-600"
                    aria-label="Clear"
                >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            {/* ── Dropdown ── */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">

                    {/* ── Searching state ── */}
                    {isSearching && (
                        <>
                            {/* Admin pages section */}
                            {pages.length > 0 && (
                                <div className="border-b border-gray-100">
                                    <div className="px-4 pt-3 pb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin Pages</span>
                                    </div>
                                    {pages.map((page, i) => {
                                        const flatIdx = pageOffset + i;
                                        return (
                                            <button
                                                key={page.href}
                                                type="button"
                                                onMouseDown={() => selectPage(page)}
                                                onMouseEnter={() => setActiveIdx(flatIdx)}
                                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${activeIdx === flatIdx ? 'bg-brand/5' : 'hover:bg-gray-50'}`}
                                            >
                                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${activeIdx === flatIdx ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {SECTION_ICON[page.section]}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-medium text-gray-800">
                                                        <Highlight text={page.label} query={query} />
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">{page.section}</p>
                                                </div>
                                                <svg className="h-3.5 w-3.5 shrink-0 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Products section */}
                            <div>
                                {(pages.length > 0 || !loading) && (
                                    <div className="px-4 pt-3 pb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Products</span>
                                    </div>
                                )}

                                {loading ? (
                                    <div className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-gray-400">
                                        <svg className="h-4 w-4 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Searching products…
                                    </div>
                                ) : products.length === 0 && pages.length === 0 ? (
                                    <div className="px-4 py-6 text-center">
                                        <svg className="mx-auto mb-2 h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803M10.5 7.5v6m3-3h-6" />
                                        </svg>
                                        <p className="text-[13px] font-medium text-gray-600">No results for "{query}"</p>
                                        <p className="mt-0.5 text-[11px] text-gray-400">Try a different keyword</p>
                                    </div>
                                ) : products.length === 0 ? (
                                    <p className="px-4 pb-3 text-[12px] text-gray-400">No products matched</p>
                                ) : (
                                    <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                                        {products.map((product, i) => {
                                            const flatIdx = productOffset + i;
                                            return (
                                                <li key={product.id}>
                                                    <button
                                                        type="button"
                                                        onMouseDown={() => selectProduct(product)}
                                                        onMouseEnter={() => setActiveIdx(flatIdx)}
                                                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${activeIdx === flatIdx ? 'bg-brand/5' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <img
                                                            src={product.image_url}
                                                            alt=""
                                                            className="h-10 w-10 shrink-0 rounded-md border border-gray-100 object-cover"
                                                            onError={(e) => { e.target.src = '/images/placeholder-product.svg'; }}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-[13px] font-medium text-gray-800">
                                                                <Highlight text={product.name} query={query} />
                                                            </p>
                                                            {product.category && (
                                                                <p className="truncate text-[11px] text-gray-400">{product.category.name}</p>
                                                            )}
                                                        </div>
                                                        {product.price != null && (
                                                            <span className="shrink-0 text-[12px] font-semibold text-gray-700">
                                                                ${Number(product.price).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            {/* View all footer */}
                            {!loading && (products.length > 0 || pages.length > 0) && (
                                <button
                                    type="button"
                                    onMouseDown={() => selectQuery(query.trim())}
                                    onMouseEnter={() => setActiveIdx(viewAllIdx)}
                                    className={`flex w-full items-center justify-between border-t border-gray-100 px-4 py-2.5 text-[12px] font-semibold transition-colors ${activeIdx === viewAllIdx ? 'bg-brand/5 text-brand' : 'text-brand hover:bg-brand/5'}`}
                                >
                                    <span>View all products for "{query}"</span>
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}

                    {/* ── Idle state: recent + trending ── */}
                    {!isSearching && (
                        <div className="py-2">
                            {recent.length > 0 && (
                                <div className="mb-1">
                                    <div className="flex items-center justify-between px-4 py-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Recent</span>
                                        <button
                                            type="button"
                                            onMouseDown={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                                            className="text-[10px] text-gray-400 hover:text-gray-600"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    {recent.map((r, i) => (
                                        <div
                                            key={r}
                                            onMouseEnter={() => setActiveIdx(i)}
                                            className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer ${activeIdx === i ? 'bg-brand/5' : 'hover:bg-gray-50'}`}
                                        >
                                            <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            <button type="button" className="flex-1 text-left text-[13px] text-gray-700" onMouseDown={() => selectQuery(r)}>
                                                {r}
                                            </button>
                                            <button type="button" onMouseDown={(e) => handleDeleteRecent(e, r)} className="text-gray-300 hover:text-gray-500" aria-label="Remove">
                                                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={recent.length > 0 ? 'border-t border-gray-100 pt-2' : ''}>
                                <div className="px-4 py-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Trending</span>
                                </div>
                                <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
                                    {TRENDING.map((t, i) => {
                                        const idx = recent.length + i;
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onMouseDown={() => handleChange({ target: { value: t } })}
                                                onMouseEnter={() => setActiveIdx(idx)}
                                                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${activeIdx === idx ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-brand hover:text-brand'}`}
                                            >
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
