import BuilderLayout from '@/Layouts/BuilderLayout';
import Container from '@/Components/Container';
import ProductImage from '@/Components/Catalog/ProductImage';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRef, useState, useCallback } from 'react';

/* ── Spec icons (Heroicons outline 24 px) ───────────────────────── */
const SI = {
    tag:      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>,
    style:    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
    swatch:   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>,
    sparkles: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
    cube:     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
    resize:   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>,
    updown:   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>,
    sliders:  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" /></svg>,
    home:     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
    globe:    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
    box:      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
};

// Standard flooring keys in display order
const SPEC_JSON_KEYS = [
    'name', 'style', 'colour', 'finish', 'material',
    'size_nominal', 'thickness', 'core', 'underlay',
    'variation', 'application_space', 'pricing',
    'country_of_origin', 'quantity_per_box',
    'slip_rating', 'number_of_faces',
];

const SPEC_FIELDS = [
    { key: 'Name',               icon: SI.tag      },
    { key: 'Style',              icon: SI.style    },
    { key: 'Colours',            icon: SI.swatch   },
    { key: 'Finish',             icon: SI.sparkles },
    { key: 'Material',           icon: SI.cube     },
    { key: 'Size (Nominal)',      icon: SI.resize   },
    { key: 'Thickness',          icon: SI.updown   },
    { key: 'Core',               icon: SI.cube     },
    { key: 'Underlay',           icon: SI.updown   },
    { key: 'Variation',          icon: SI.sliders  },
    { key: 'Application Space',  icon: SI.home     },
    { key: 'Pricing',            icon: SI.tag      },
    { key: 'Country of Origin',  icon: SI.globe    },
    { key: 'Quantity Per Box',   icon: SI.box      },
    { key: 'Slip Rating',        icon: SI.sliders  },
    { key: 'Number of Faces',    icon: SI.resize   },
];

const EXTRA_ICONS = {
    type: SI.tag, classification: SI.tag, composition: SI.cube,
    environmental: SI.sparkles, recoat_time: SI.updown, tile_over_time: SI.updown,
    flood_test: SI.home, size: SI.resize, base: SI.cube, toxicity: SI.sparkles,
    odour: SI.sparkles, application: SI.home, drying_time: SI.updown,
    primary_use: SI.home, system_component: SI.cube, size_thickness: SI.resize,
    visibility: SI.sliders, compatibility: SI.sliders, installation: SI.home,
    material: SI.cube, packaging: SI.box, slip_rating: SI.updown,
};

function toLabel(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function specsFromJson(json) {
    if (!json || typeof json !== 'object') return [];
    const shown = new Set();
    const rows = [];
    SPEC_JSON_KEYS.forEach((k, i) => {
        const val = json[k];
        if (val && String(val).trim()) {
            rows.push({ label: SPEC_FIELDS[i].key, value: String(val).trim(), icon: SPEC_FIELDS[i].icon });
            shown.add(k);
        }
    });
    Object.entries(json).forEach(([k, val]) => {
        if (!shown.has(k) && val && String(val).trim()) {
            rows.push({ label: toLabel(k), value: String(val).trim(), icon: EXTRA_ICONS[k] ?? SI.tag });
        }
    });
    return rows;
}

function SpecificationsBlock({ specifications, description }) {
    const specs = (specifications && Object.keys(specifications).length)
        ? specsFromJson(specifications)
        : [];
    if (!specs.length) return null;

    const mid = Math.ceil(specs.length / 2);
    const left = specs.slice(0, mid);
    const right = specs.slice(mid);

    const Row = ({ label, value, icon, shade }) => (
        <div className={`flex items-start gap-3 px-4 py-3 ${shade ? 'bg-gray-50' : 'bg-white'}`}>
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                <p className="mt-0.5 text-[13px] font-semibold leading-snug text-gray-800">{value}</p>
            </div>
        </div>
    );

    const [open, setOpen] = useState(true);

    return (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex w-full items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-left transition-colors hover:bg-gray-100"
            >
                <div className="h-3 w-0.5 rounded-full bg-amber-500" />
                <p className="flex-1 text-[11px] font-bold uppercase tracking-[3px] text-gray-500">Product Specifications</p>
                <svg
                    className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x sm:divide-gray-200">
                    <div className="divide-y divide-gray-100">
                        {left.map(({ label, value, icon }, i) => (
                            <Row key={label} label={label} value={value} icon={icon} shade={i % 2 !== 0} />
                        ))}
                    </div>
                    <div className="divide-y divide-gray-100 border-t border-gray-200 sm:border-t-0">
                        {right.map(({ label, value, icon }, i) => (
                            <Row key={label} label={label} value={value} icon={icon} shade={i % 2 !== 0} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Icons ─────────────────────────────────────────────────────────── */
const CL = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const CR = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const Minus = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>;
const Plus = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const Share = ({ c }) => <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;

/* ── Scroll Arrow Button ──────────────────────────────────────────── */
function SBtn({ dir, disabled, onClick }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled} className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed" aria-label={dir === 'l' ? 'Previous' : 'Next'}>
            {dir === 'l' ? <CL c="h-4 w-4" /> : <CR c="h-4 w-4" />}
        </button>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION: Image Gallery with Thumbnails
   ═══════════════════════════════════════════════════════════════════ */
function ImageGallery({ product, savingPct }) {
    const rawImages = [];
    if (product.image_url) rawImages.push(product.image_url);
    if (product.media?.length) {
        product.media
            .filter(m => m.type === 'image')
            .map(m => {
                if (m.path && !/^https?:\/\//i.test(m.path)) {
                    return `/storage/${m.path}`;
                }
                return m.url || m.path;
            })
            .filter(Boolean)
            .forEach(u => { if (!rawImages.includes(u)) rawImages.push(u); });
    }
    const images = rawImages.filter(Boolean).length ? rawImages.filter(Boolean) : [null];

    const [active, setActive] = useState(0);

    const renderThumb = (img, i) => (
        <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`flex-shrink-0 h-16 w-16 overflow-hidden rounded-lg border-2 bg-white transition ${i === active ? 'border-amber-500' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
        >
            <ProductImage src={img} alt="" className="h-full w-full object-contain" />
        </button>
    );

    return (
        <div className="flex gap-2 sm:gap-3">
            {images.length > 1 && (
                <div className="flex flex-col gap-2 overflow-y-auto" style={{ scrollbarWidth: 'none', maxHeight: '100%' }}>
                    {images.map(renderThumb)}
                </div>
            )}
            <div className="relative flex-1 aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <ProductImage src={images[active]} alt={product.name} className="h-full w-full object-contain" />
                {savingPct > 0 && (
                    <div className="absolute left-3 top-3 rounded-md bg-amber-500 px-3 py-1 text-sm font-bold text-slate-900">
                        TRADE −{savingPct}%
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   VARIANT FAMILY SELECTOR (Trade version)
   ═══════════════════════════════════════════════════════════════════ */
function VariantFamilySelector({ familyVariants, perUnit }) {
    const variants = familyVariants?.variants ?? [];
    if (variants.length < 2) return null;

    const familyName = familyVariants?.family?.name;
    const currentIndex = variants.findIndex((v) => v.is_current);

    return (
        <div className="mt-5">
            <div className="flex items-baseline justify-between gap-2">
                <label className="text-[13px] font-semibold text-gray-900">
                    {familyName ? `${familyName} range` : 'Available variants'}
                    <span className="ml-1.5 font-normal text-gray-500">
                        ({variants.length} options{currentIndex >= 0 ? ` · viewing ${currentIndex + 1}` : ''})
                    </span>
                </label>
            </div>

            <div className="mt-2 flex gap-2.5 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
                {variants.map((v) => {
                    const card = (
                        <>
                            <div className="mb-1.5 aspect-square w-full overflow-hidden rounded-md bg-gray-50">
                                {v.image_url && (
                                    <img src={v.image_url} alt={v.label} loading="lazy" className="h-full w-full object-cover" />
                                )}
                            </div>
                            <span title={v.name} className="line-clamp-2 h-[2rem] text-[11px] font-medium leading-tight text-gray-800">
                                {v.label}
                            </span>
                            <span className="mt-0.5 text-[13px] font-bold text-slate-900">
                                ${parseFloat(v.price || 0).toFixed(2)}
                                {perUnit ? <span className="font-normal text-gray-400">{perUnit}</span> : null}
                            </span>
                            {v.compare_at_price > v.price && (
                                <span className="text-[11px] text-gray-400 line-through">${parseFloat(v.compare_at_price).toFixed(2)}</span>
                            )}
                            {!v.in_stock && <span className="text-[11px] font-medium text-red-600">Out of stock</span>}
                        </>
                    );

                    const classes =
                        'flex w-24 flex-shrink-0 flex-col rounded-lg border bg-white p-2 transition-colors sm:w-28 ' +
                        (v.is_current ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-gray-200 hover:border-gray-400') +
                        (v.in_stock ? '' : ' opacity-60');

                    return v.is_current ? (
                        <div key={v.id} aria-current="true" className={classes}>{card}</div>
                    ) : (
                        <Link key={v.id} href={route('builder.products.show', v.slug)} className={classes}>{card}</Link>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION: Compare with Similar Items (Trade version)
   ═══════════════════════════════════════════════════════════════════ */
function CompareWithSimilar({ currentProduct, products }) {
    if (!products?.length) return null;

    const compareItems = [currentProduct, ...products.slice(0, 3)];

    const spec = (p, ...keys) => {
        for (const k of keys) {
            const v = p?.specifications?.[k];
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
        return null;
    };

    const inStock = (p) => {
        if (parseFloat(p.price || 0) <= 0) return false;
        return (p.inventory_quantity ?? 0) > 0 || p.inventory_policy === 'continue';
    };

    const specRows = [
        { label: 'Category', value: (p) => p.category?.name || p.product_type || null },
        { label: 'Size', value: (p) => spec(p, 'size_nominal', 'size', 'size(_nominal)', 'size_actual') },
        { label: 'Finish', value: (p) => spec(p, 'finish') },
        { label: 'Colour', value: (p) => spec(p, 'colour', 'color') },
        { label: 'Material', value: (p) => spec(p, 'material') },
        { label: 'Thickness', value: (p) => spec(p, 'thickness') },
    ].filter((row) => compareItems.some((p) => row.value(p)));

    const addToCart = (productId) => {
        router.post(route('builder.cart.store'), { product_id: productId, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => {
                window.dispatchEvent(new CustomEvent('cart-updated:trade'));
                window.dispatchEvent(new CustomEvent('open-cart-sidebar'));
            },
        });
    };

    return (
        <section className="py-10 border-t border-gray-200">
            <Container>
                <h2 className="text-lg font-bold text-gray-900 mb-6">Compare with Similar Items</h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] table-fixed border-collapse">
                        <colgroup>
                            <col className="w-[150px]" />
                            {compareItems.map((p) => (
                                <col key={p.id} style={{ width: `${100 / compareItems.length}%` }} />
                            ))}
                        </colgroup>
                        <thead>
                            <tr>
                                <th className="p-3" />
                                {compareItems.map((p, i) => (
                                    <th key={p.id} className="p-3 align-top">
                                        <div className="flex flex-col items-center">
                                            <Link href={route('builder.products.show', p.slug)} className="block w-full aspect-square overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
                                                <ProductImage src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                            </Link>
                                            <Link href={route('builder.products.show', p.slug)} className="mt-2 text-[13px] font-medium text-amber-600 hover:underline text-center line-clamp-2">
                                                {p.name}
                                            </Link>
                                            {i === 0 && <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 uppercase">Current</span>}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-gray-100 bg-amber-50/50">
                                <th scope="row" className="px-3 py-2.5 text-left align-middle text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                                    Trade Price
                                </th>
                                {compareItems.map((p) => (
                                    <td key={p.id} className="px-3 py-2.5 text-center align-middle">
                                        <span className="text-[15px] font-bold text-slate-900">${parseFloat(p.price || 0).toFixed(2)}</span>
                                        {p.compare_at_price > p.price && <span className="ml-1 text-[12px] text-gray-400 line-through">${parseFloat(p.compare_at_price || 0).toFixed(2)}</span>}
                                    </td>
                                ))}
                            </tr>
                            {specRows.map((row, i) => (
                                <tr key={row.label} className={`border-t border-gray-100 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                                    <th scope="row" className="px-3 py-2.5 text-left align-middle text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                                        {row.label}
                                    </th>
                                    {compareItems.map((p) => (
                                        <td key={p.id} className="px-3 py-2.5 text-center align-middle text-[13px] text-gray-700">
                                            {row.value(p) || '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            <tr className={`border-t border-gray-100 ${specRows.length % 2 ? 'bg-gray-50/50' : ''}`}>
                                <th scope="row" className="px-3 py-2.5 text-left align-middle text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                                    Availability
                                </th>
                                {compareItems.map((p) => (
                                    <td key={p.id} className="px-3 py-2.5 text-center align-middle">
                                        <span className={`text-[13px] font-medium ${inStock(p) ? 'text-green-600' : 'text-gray-400'}`}>
                                            {inStock(p) ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                            <tr className="border-t border-gray-100">
                                <th scope="row" className="px-3 py-3" />
                                {compareItems.map((p, i) => (
                                    <td key={p.id} className="px-3 py-3 text-center align-middle">
                                        <button type="button" onClick={() => addToCart(p.id)} className={`rounded-none px-4 py-2 text-[13px] font-semibold transition ${i === 0 ? 'bg-slate-900 text-white hover:bg-slate-700' : 'border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'}`}>
                                            Add to Cart
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Container>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION: Products Related to This Item (Trade version)
   ═══════════════════════════════════════════════════════════════════ */
function RelatedProducts({ products, perUnit }) {
    const ref = useRef(null);
    const [cl, setCl] = useState(false);
    const [cr, setCr] = useState(true);
    const ck = useCallback(() => {
        if (!ref.current) return;
        const { scrollLeft: s, scrollWidth: w, clientWidth: c } = ref.current;
        setCl(s > 10);
        setCr(s < w - c - 10);
    }, []);
    const go = (d) => {
        ref.current?.scrollBy({ left: d === 'l' ? -280 : 280, behavior: 'smooth' });
        setTimeout(ck, 350);
    };

    if (!products?.length) return null;

    const addToCart = (productId) => {
        router.post(route('builder.cart.store'), { product_id: productId, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => {
                window.dispatchEvent(new CustomEvent('cart-updated:trade'));
                window.dispatchEvent(new CustomEvent('open-cart-sidebar'));
            },
        });
    };

    return (
        <section className="py-10 border-t border-gray-200">
            <Container>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Products Related to This Item</h2>
                    <div className="flex items-center gap-2">
                        <SBtn dir="l" disabled={!cl} onClick={() => go('l')} />
                        <SBtn dir="r" disabled={!cr} onClick={() => go('r')} />
                    </div>
                </div>
                <div ref={ref} onScroll={ck} className="flex gap-4 overflow-x-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none' }}>
                    {products.map((p) => {
                        const disc = p.compare_at_price > p.price ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100) : 0;
                        return (
                            <div key={p.id} className="flex-shrink-0 w-[200px] rounded-none border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                                <Link href={route('builder.products.show', p.slug)} className="block">
                                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                                        <ProductImage src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />
                                        {disc > 0 && (
                                            <div className="absolute left-0 top-3">
                                                <span className="rounded-r-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-slate-900 shadow-sm">TRADE −{disc}%</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <div className="p-3">
                                    <Link href={route('builder.products.show', p.slug)} className="text-[13px] font-semibold text-gray-900 hover:text-amber-600 line-clamp-2 block min-h-[36px]">{p.name}</Link>
                                    <div className="mt-2">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-[16px] font-bold text-slate-900">${parseFloat(p.price || 0).toFixed(2)}</span>
                                            {perUnit ? <span className="text-[11px] text-gray-400">{perUnit}</span> : null}
                                            {disc > 0 && <span className="text-[13px] text-gray-400 line-through">${parseFloat(p.compare_at_price || 0).toFixed(2)}</span>}
                                        </div>
                                        {disc > 0 && <p className="mt-0.5 text-[12px] font-medium text-green-600">Save {disc}%</p>}
                                    </div>
                                    <button type="button" onClick={() => addToCart(p.id)} className="mt-3 w-full rounded-none bg-slate-900 px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-slate-700 transition">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Container>
        </section>
    );
}

/* ── Utility: strip HTML ──────────────────────────────────────────── */
function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    let text = tmp.textContent || tmp.innerText || '';
    text = text.replace(/✅\s*/g, '• ');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
}

/* ── Utility: remove Product Specifications block from description HTML ── */
function stripSpecsFromHtml(html) {
    if (!html) return html;
    const container = document.createElement('div');
    container.innerHTML = html;

    const fieldRe = [
        /^name\s*:/i, /^style\s*:/i, /^colou?rs?\s*:/i, /^finish\s*:/i, /^material\s*:/i,
        /^size(\s*\(nominal\))?\s*:/i, /^thickness\s*:/i, /^variation\s*:/i,
        /^application\s+space\s*:/i, /^country\s+of\s+origin\s*:/i, /^quantity\s+per\s+box\s*:/i,
    ];
    const isSpecLine = (text) => fieldRe.some((re) => re.test(text));

    let headingEl = null;
    for (const el of container.querySelectorAll('*')) {
        if (/^product\s+specifications$/i.test(el.textContent.trim())) {
            headingEl = el;
            break;
        }
    }
    if (!headingEl) return html;

    let topLevel = headingEl;
    while (topLevel.parentElement && topLevel.parentElement !== container) {
        topLevel = topLevel.parentElement;
    }

    if (topLevel.tagName === 'TABLE') {
        topLevel.remove();
        return container.innerHTML;
    }

    const toRemove = [topLevel];
    let next = topLevel.nextElementSibling;
    while (next) {
        const text = next.textContent.trim();
        if (isSpecLine(text) || text === '') {
            toRemove.push(next);
            next = next.nextElementSibling;
        } else {
            break;
        }
    }

    toRemove.forEach((el) => el.remove());
    return container.innerHTML;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function Show({ product, relatedProducts, familyVariants = null }) {
    const { settings } = usePage().props;
    const [quantity, setQuantity] = useState(1);
    const [area, setArea] = useState(1);
    const [wastage, setWastage] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);
    const [shareNote, setShareNote] = useState('');

    const shareProduct = async () => {
        const url = window.location.href;
        const note = (text) => { setShareNote(text); setTimeout(() => setShareNote(''), 2000); };

        if (navigator.share) {
            try {
                await navigator.share({ title: product.name, url });
                return;
            } catch (err) {
                if (err?.name === 'AbortError') return;
            }
        }

        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(url);
                note('Link copied');
                return;
            } catch {}
        }

        try {
            const field = document.createElement('textarea');
            field.value = url;
            field.setAttribute('readonly', '');
            field.style.position = 'fixed';
            field.style.opacity = '0';
            document.body.appendChild(field);
            field.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(field);
            note(ok ? 'Link copied' : 'Press Ctrl+C to copy');
        } catch {
            note('Copy the address bar link');
        }
    };

    // Trade vs retail pricing
    const retail = parseFloat(product.retail_price ?? product.compare_at_price ?? 0);
    const trade = parseFloat(product.price ?? 0);
    const savingPct = retail > trade ? Math.round(((retail - trade) / retail) * 100) : 0;

    // Unit handling
    const perSqm = product.is_sold_per_sqm === true;
    const unitLabel = product.unit_label ?? 'sqm';
    const perUnit = perSqm ? ` / ${unitLabel}` : '';
    const quantityLabel = (product?.quantity_label ?? '').trim();
    const showWastage = product?.show_wastage !== false && perSqm;

    const sqmPerBox = parseFloat(product?.sqm_per_box) || 0;
    const hasBoxes = sqmPerBox > 0;
    const requiredArea = wastage ? area * 1.1 : area;
    const boxCount = hasBoxes ? Math.max(1, Math.ceil(requiredArea / sqmPerBox)) : 0;
    const billedSqm = hasBoxes
        ? Math.max(sqmPerBox, parseFloat((boxCount * sqmPerBox).toFixed(2)))
        : Math.max(0.01, parseFloat(requiredArea.toFixed(2)));

    // Selectable colour + finish parsed from the spec strings
    const splitSpec = (value) => String(value ?? '')
        .split(/\s*[+/,;]\s*/)
        .map((s) => s.trim())
        .filter(Boolean);

    const colourOptions = splitSpec(product.specifications?.colour || product.specifications?.color);
    const finishOptions = splitSpec(product.specifications?.finish);
    const slipRating = String(product.specifications?.slip_rating ?? '').trim();
    const colourText = colourOptions.join(' + ');
    const finishText = finishOptions.join(' + ');

    const cartOptions = () => {
        const o = {};
        if (colourText) o.colour = colourText;
        if (finishText) o.finish = finishText;
        return o;
    };

    const cartQuantity = () => perSqm ? billedSqm : parseFloat(quantity) || 1;

    const inStock = (parseFloat(product.price) || 0) > 0 && ((product.inventory_quantity ?? 0) > 0 || product.inventory_policy === 'continue');

    // TRADE cart routes and events
    const addToCart = () => {
        if (!inStock) return;
        setAddingToCart(true);
        router.post(route('builder.cart.store'), { product_id: product.id, quantity: cartQuantity(), options: cartOptions() }, {
            preserveScroll: true,
            onSuccess: () => {
                window.dispatchEvent(new CustomEvent('cart-updated:trade'));
                window.dispatchEvent(new CustomEvent('open-cart-sidebar'));
            },
            onFinish: () => setAddingToCart(false),
        });
    };

    const buyNow = () => {
        if (!inStock) return;
        setBuyingNow(true);
        router.post(route('builder.cart.store'), { product_id: product.id, quantity: cartQuantity(), options: cartOptions() }, {
            preserveScroll: true,
            onSuccess: () => {
                window.dispatchEvent(new CustomEvent('cart-updated:trade'));
                router.visit('/builder/checkout');
            },
            onFinish: () => setBuyingNow(false),
        });
    };

    const adjustArea = (delta) => {
        setArea(prev => Math.max(1, prev + delta));
    };

    const lineTotal = trade * cartQuantity();

    return (
        <BuilderLayout title={product.name}>
            <Head title={product.name} />

            {/* Breadcrumb */}
            <section className="py-3 border-b border-gray-100 bg-gray-50/50">
                <Container>
                    <nav className="flex items-center gap-2 text-[13px] text-gray-500">
                        <Link href={route('builder.dashboard')} className="hover:text-gray-900">Trade Portal</Link>
                        <span>/</span>
                        <Link href={route('builder.shop.index')} className="hover:text-gray-900">Catalogue</Link>
                        {product.category && (
                            <>
                                <span>/</span>
                                <Link href={`/builder/shop?category=${product.category.slug}`} className="hover:text-gray-900">{product.category.name}</Link>
                            </>
                        )}
                        <span>/</span>
                        <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
                    </nav>
                </Container>
            </section>

            {/* Product Details */}
            <section className="py-8">
                <Container>
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 items-start">
                        {/* Left: Image Gallery */}
                        <div className="lg:sticky lg:top-4">
                            <ImageGallery product={product} savingPct={savingPct} />
                        </div>

                        {/* Right: Product Info */}
                        <div>
                            {/* Category */}
                            {product.category && (
                                <Link href={`/builder/shop?category=${product.category.slug}`} className="text-[13px] font-medium text-amber-600 hover:underline">{product.category.name}</Link>
                            )}

                            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl leading-tight">{product.name}</h1>

                            {product.sku && (
                                <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">SKU {product.sku}</div>
                            )}

                            {product.short_description && (
                                <p className="mt-3 text-sm leading-relaxed text-gray-600">{product.short_description}</p>
                            )}

                            {/* Trade Price block */}
                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                                    Your trade price
                                </div>
                                <div className="mt-1 flex items-baseline gap-3">
                                    <span className="text-3xl font-bold text-slate-900">${trade.toFixed(2)}</span>
                                    {perUnit ? <span className="text-sm text-gray-500">/ {unitLabel}</span> : null}
                                </div>
                                {retail > trade && (
                                    <div className="mt-1.5 text-sm text-gray-600">
                                        Retail <span className="line-through">${retail.toFixed(2)}</span>
                                        <span className="ml-2 font-semibold text-green-700">
                                            You save ${(retail - trade).toFixed(2)}{perUnit} ({savingPct}%)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Slip rating, colour and finish as plain lines */}
                            {(slipRating || colourText || finishText) && (
                                <dl className="mt-4 space-y-1.5 text-[14px]">
                                    {slipRating && (
                                        <div className="flex gap-2">
                                            <dt className="text-gray-500">Slip Rating :</dt>
                                            <dd className="font-medium text-gray-900">{slipRating}</dd>
                                        </div>
                                    )}
                                    {colourText && (
                                        <div className="flex gap-2">
                                            <dt className="text-gray-500">Colour :</dt>
                                            <dd className="font-medium text-gray-900">{colourText}</dd>
                                        </div>
                                    )}
                                    {finishText && (
                                        <div className="flex gap-2">
                                            <dt className="text-gray-500">Finish :</dt>
                                            <dd className="font-medium text-gray-900">{finishText}</dd>
                                        </div>
                                    )}
                                </dl>
                            )}

                            {/* Variant family selector */}
                            <VariantFamilySelector familyVariants={familyVariants} perUnit={perUnit} />

                            {/* Add to Cart + Buy Now */}
                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={addToCart}
                                    disabled={!inStock || addingToCart || buyingNow}
                                    className="flex-1 rounded-lg bg-slate-900 px-8 py-3 text-sm font-bold text-white uppercase tracking-wide hover:bg-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                                </button>
                                <button
                                    type="button"
                                    onClick={buyNow}
                                    disabled={!inStock || addingToCart || buyingNow}
                                    className="flex-1 rounded-lg border-2 border-slate-900 px-8 py-3 text-sm font-bold text-slate-900 uppercase tracking-wide hover:bg-slate-900/5 transition disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {buyingNow ? 'Processing...' : 'Buy Now'}
                                </button>
                            </div>

                            {/* Stock status */}
                            <div className="relative mt-4">
                                {!inStock && (
                                    <span className="absolute -top-1 right-0 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        Out of Stock
                                    </span>
                                )}
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className={`text-[13px] font-medium ${inStock ? 'text-green-700' : 'text-red-600'}`}>
                                        {inStock ? 'In Stock' : 'Currently unavailable — check back soon'}
                                    </span>
                                </div>
                            </div>

                            {/* Quantity selector */}
                            <div className="mt-5">
                                <div className="flex flex-wrap items-center gap-4">
                                    {perSqm ? (
                                        /* Area-based quantity for tiles/flooring */
                                        <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5">
                                            {quantityLabel ? (
                                                <span className="text-[13px] font-semibold text-gray-700">{quantityLabel}</span>
                                            ) : (
                                                <span className="text-[13px] font-semibold text-gray-700">Area</span>
                                            )}
                                            <button type="button" onClick={() => adjustArea(-1)} disabled={area <= 1 || !inStock} className="text-gray-500 hover:text-amber-600 disabled:opacity-30 transition"><Minus c="h-4 w-4" /></button>
                                            <span className="min-w-[2rem] text-center text-[15px] font-bold text-gray-900">{area}</span>
                                            <span className="text-[13px] text-gray-500">{unitLabel}</span>
                                            <button type="button" onClick={() => adjustArea(1)} disabled={!inStock} className="text-gray-500 hover:text-amber-600 disabled:opacity-30 transition"><Plus c="h-4 w-4" /></button>
                                        </div>
                                    ) : (
                                        /* Simple quantity for non-sqm products */
                                        <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5">
                                            <span className="text-[13px] font-semibold text-gray-700">Qty</span>
                                            <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1 || !inStock} className="text-gray-500 hover:text-amber-600 disabled:opacity-30 transition"><Minus c="h-4 w-4" /></button>
                                            <span className="min-w-[2rem] text-center text-[15px] font-bold text-gray-900">{quantity}</span>
                                            <button type="button" onClick={() => setQuantity(q => q + 1)} disabled={!inStock} className="text-gray-500 hover:text-amber-600 disabled:opacity-30 transition"><Plus c="h-4 w-4" /></button>
                                        </div>
                                    )}
                                    {showWastage && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-semibold text-amber-700">+10% wastage</span>
                                            <button type="button" onClick={() => setWastage(w => !w)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${wastage ? 'bg-amber-500' : 'bg-gray-300'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${wastage ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {showWastage && hasBoxes && <p className="mt-1.5 text-[11px] text-gray-400">We round up to the full box</p>}
                            </div>

                            {/* Subtotal line */}
                            {perSqm && showWastage ? (
                                hasBoxes ? (
                                    <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-700">
                                        <span className="font-semibold text-gray-900">{boxCount} {boxCount === 1 ? 'Box' : 'Boxes'}</span>
                                        <span className="text-gray-500"> = {billedSqm.toFixed(2)} m²</span>
                                        <span className="ml-2 text-[12px] font-bold text-slate-900">${(trade * billedSqm).toFixed(2)}</span>
                                        {wastage && <span className="ml-2 text-[11px] text-amber-700">(incl. 10% wastage)</span>}
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-700">
                                        <span className="font-semibold text-gray-900">{billedSqm.toFixed(2)} m²</span>
                                        <span className="ml-2 text-[12px] font-bold text-slate-900">${(trade * billedSqm).toFixed(2)}</span>
                                        {wastage && <span className="ml-2 text-[11px] text-amber-700">(incl. 10% wastage)</span>}
                                    </div>
                                )
                            ) : !perSqm && (
                                <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] text-gray-700">
                                    <span className="text-gray-500">Line total</span>
                                    <span className="ml-2 font-bold text-slate-900">${lineTotal.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Product Specifications */}
                            <div className="mt-4">
                                <SpecificationsBlock specifications={product.specifications} description={product.description} />
                            </div>

                            {/* Share */}
                            <div className="mt-4 flex items-center gap-4">
                                <button type="button" onClick={shareProduct} className="flex items-center gap-1.5 text-[13px] text-gray-600 transition hover:text-amber-600">
                                    <Share c="h-5 w-5" />
                                    {shareNote || 'Share'}
                                </button>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="mt-6 border-t border-gray-200 pt-5">
                                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-1">Description</h2>
                                    <div
                                        className="prose prose-sm max-w-none text-gray-600"
                                        dangerouslySetInnerHTML={{ __html: stripSpecsFromHtml(product.description) }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </Container>
            </section>

            {/* Compare with Similar Items */}
            <CompareWithSimilar currentProduct={product} products={relatedProducts} />

            {/* Products Related to This Item */}
            <RelatedProducts products={relatedProducts} perUnit={perUnit} />
        </BuilderLayout>
    );
}
