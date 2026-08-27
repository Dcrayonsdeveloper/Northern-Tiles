import { Link, usePage } from '@inertiajs/react';

function FooterLink({ href = '#', label, external = false }) {
    const isExternal =
        external ||
        (typeof href === 'string' &&
            (href.startsWith('http://') || href.startsWith('https://')));

    if (isExternal) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[13px] text-[#aaa] transition-colors duration-200 hover:text-white"
            >
                {label}
            </a>
        );
    }

    return (
        <Link
            href={href}
            className="text-[13px] text-[#aaa] transition-colors duration-200 hover:text-white"
        >
            {label}
        </Link>
    );
}

function ProductColumn({ heading, links }) {
    return (
        <div>
            <h3 className="mb-4 border-b-2 border-brand pb-2 text-[14px] font-semibold uppercase tracking-[1px] text-white">
                {heading}
            </h3>
            <ul className="space-y-2">
                {links.map((link, idx) => (
                    <li key={idx}>
                        <FooterLink href={link.href} label={link.label} />
                    </li>
                ))}
            </ul>
        </div>
    );
}

const FacebookIcon = () => (
    <svg
        className="h-5 w-5 fill-[#aaa] transition-colors duration-200 hover:fill-white"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const InstagramIcon = () => (
    <svg
        className="h-5 w-5 fill-[#aaa] transition-colors duration-200 hover:fill-white"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

const TikTokIcon = () => (
    <svg
        className="h-5 w-5 fill-[#aaa] transition-colors duration-200 hover:fill-white"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
);

export default function Footer({ minimal = false }) {
    const { footerConfig } = usePage().props;

    const brand = footerConfig?.brand ?? {};
    const menus = footerConfig?.menus ?? {};
    const social = footerConfig?.social ?? {};

    const brandName = brand.name || 'Northern TILE Distributors';
    const address = brand.address || '19/324 Settlement Road, Thomastown VIC 3074';
    const email = brand.email || 'info@ntiled.com.au';
    const phone = brand.phone || '(03) 9464 6623';
    const hours = brand.hours || { weekday: 'Mon–Fri 9am – 5pm', saturday: 'Sat 9am – 1pm' };

    const facebookUrl = social.facebook || 'https://www.facebook.com/ntiled/';
    const instagramUrl = social.instagram || 'https://www.instagram.com/northern.tile.distributors/';
    const tiktokUrl = social.tiktok || 'https://www.tiktok.com/@ntiled';

    const year = new Date().getFullYear();

    // Product link columns with fallbacks.
    //
    // These point at /shop?category=<slug> — the same shape the header nav uses,
    // and the only one that resolves. The previous /tiles/…, /flooring/…,
    // /stone/… and /trade-supplies/… paths matched no route at all, so every
    // link in these five columns 404'd. Slugs below are real rows in the
    // categories table; keep them in step if a category is renamed.
    const productColumns = [
        {
            heading: 'Tiles',
            links: menus.tiles?.items || [
                { label: 'Porcelain', href: '/shop?category=porcelain' },
                { label: 'Subway', href: '/shop?category=subway' },
                { label: 'External Porcelain', href: '/shop?category=external-porcelain' },
                { label: 'Italian Porcelain', href: '/shop?category=italian-porcelain' },
                { label: 'Decorative Tile', href: '/shop?category=decorative-tile' },
                { label: 'Terrazzo', href: '/shop?category=terrazzo' },
            ],
        },
        {
            heading: 'Flooring',
            links: menus.flooring?.items || [
                { label: 'Hybrid Flooring', href: '/shop?category=hybrid' },
                { label: 'Timber Oak Range', href: '/shop?category=hybrid-timber-oak-range' },
                { label: 'Engineered Oak', href: '/shop?category=engineered-oak' },
                { label: 'Engineered Timber', href: '/shop?category=engineered-timber' },
                { label: 'Herringbone', href: '/shop?category=hybrid-herringbone' },
                { label: 'Quads / Scotia', href: '/shop?category=quad' },
            ],
        },
        {
            heading: 'Stone',
            links: menus.stone?.items || [
                { label: 'Natural Stone', href: '/shop?category=stone' },
                { label: 'Marble', href: '/shop?category=marble' },
                { label: 'Baltic Stone', href: '/shop?category=baltic-stone' },
                { label: 'Tundra', href: '/shop?category=tundra' },
            ],
        },
        {
            heading: 'Trade Supplies',
            links: menus.tradeSupplies?.items || [
                { label: 'Mapei', href: '/shop?category=mapei' },
                { label: 'ARDEX', href: '/shop?category=ardex' },
                { label: 'Soudal', href: '/shop?category=soudal' },
                { label: 'Durotech', href: '/shop?category=durotech' },
                { label: 'Levelling Systems', href: '/shop?category=levelling-system' },
                { label: 'Tiling & Waterproofing', href: '/shop?category=tiling-waterproofing' },
            ],
        },
        {
            heading: 'Resources',
            links: menus.resources?.items || [
                { label: 'About Us', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Shipping Info', href: '/shipping' },
                { label: 'Returns', href: '/returns' },
                { label: 'Trade Portal', href: '/builder/register' },
            ],
        },
    ];

    // Company info links. "About" lives in the Resources column above as
    // "About Us"; repeating it here was the same page twice in one footer.
    const infoLinks = menus.info?.items || [
        { label: 'Blog', href: '/blog' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Cookie Policy', href: '/cookie-policy' },
        { label: 'Terms of Service', href: '/terms-of-service' },
        { label: 'Return Policy', href: '/returns' },
    ];

    return (
        <footer className="font-sans">
            {/* Section 1 - Product Links (hidden on the trade portal) */}
            {!minimal && (
                <div className="bg-[#1a1a1a]">
                    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
                            {productColumns.map((col) => (
                                <ProductColumn
                                    key={col.heading}
                                    heading={col.heading}
                                    links={col.links}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Section 2 - Company Info */}
            <div className="border-t border-[#333] bg-[#1a1a1a]">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                    <div className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${minimal ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                        {/* Info & Links (hidden on the trade portal) */}
                        {!minimal && (
                        <div>
                            <h3 className="mb-4 border-b-2 border-brand pb-2 text-[14px] font-semibold uppercase tracking-[1px] text-white">
                                Info &amp; Links
                            </h3>
                            <ul className="space-y-2">
                                {infoLinks.map((link, idx) => (
                                    <li key={idx}>
                                        <FooterLink
                                            href={link.href}
                                            label={link.label}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                        )}

                        {/* Visit Us */}
                        <div>
                            <h3 className="mb-4 border-b-2 border-brand pb-2 text-[14px] font-semibold uppercase tracking-[1px] text-white">
                                Visit Us
                            </h3>
                            <div className="space-y-2 text-[13px] text-[#aaa]">
                                <p>{address}</p>
                                <p className="mt-3">
                                    {hours.weekday || 'Mon–Fri 9am – 5pm'}
                                </p>
                                <p>{hours.saturday || 'Sat 9am – 1pm'}</p>
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="mb-4 border-b-2 border-brand pb-2 text-[14px] font-semibold uppercase tracking-[1px] text-white">
                                Contact
                            </h3>
                            <div className="space-y-2 text-[13px]">
                                <p>
                                    <a
                                        href={`tel:${phone.replace(/\D/g, '')}`}
                                        className="text-[#aaa] transition-colors duration-200 hover:text-white"
                                    >
                                        {phone}
                                    </a>
                                </p>
                                <p>
                                    <a
                                        href={`mailto:${email}`}
                                        className="text-[#aaa] transition-colors duration-200 hover:text-white"
                                    >
                                        {email}
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div>
                            <h3 className="mb-4 border-b-2 border-brand pb-2 text-[14px] font-semibold uppercase tracking-[1px] text-white">
                                Follow Us
                            </h3>
                            <div className="flex items-center gap-4">
                                <a
                                    href={facebookUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    aria-label="Facebook"
                                >
                                    <FacebookIcon />
                                </a>
                                <a
                                    href={instagramUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    aria-label="Instagram"
                                >
                                    <InstagramIcon />
                                </a>
                                <a
                                    href={tiktokUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    aria-label="TikTok"
                                >
                                    <TikTokIcon />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright Bar */}
            <div className="bg-[#111]">
                <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Link href="/">
                        <img src="/images/ntiled_logo.png" alt={brandName} className="h-8 w-auto brightness-0 invert opacity-70" />
                    </Link>
                    <p className="text-[12px] text-[#aaa]">
                        &copy; {year} {brandName}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
