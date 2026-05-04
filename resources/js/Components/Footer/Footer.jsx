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

const YouTubeIcon = () => (
    <svg
        className="h-5 w-5 fill-[#aaa] transition-colors duration-200 hover:fill-white"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

const TikTokIcon = () => (
    <svg
        className="h-5 w-5 fill-[#aaa] transition-colors duration-200 hover:fill-white"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43V8.65a8.16 8.16 0 004.77 1.52V6.79a4.85 4.85 0 01-1.84-.1z" />
    </svg>
);

export default function Footer() {
    const { footerConfig } = usePage().props;

    const brand = footerConfig?.brand ?? {};
    const menus = footerConfig?.menus ?? {};
    const social = footerConfig?.social ?? {};

    const brandName = brand.name || 'Northern TILE Distributors';
    const address = brand.address || '19/324 Settlement Road, Thomastown VIC 3074';
    const email = brand.email || 'info@ntiled.com.au';
    const phone = brand.phone || '03 9464 6623';
    const phone2 = '0416 924 324';
    const hours = brand.hours || { weekday: 'Mon–Fri 9am – 5pm', saturday: 'Sat 9am – 1pm' };

    const facebookUrl = social.facebook || 'https://www.facebook.com/ntiled/';
    const instagramUrl = social.instagram || 'https://www.instagram.com/northern.tile.distributors/';
    const youtubeUrl = social.youtube || 'https://youtube.com';
    const tiktokUrl = social.tiktok || 'https://www.tiktok.com/@northern.tile.distributors';

    const year = new Date().getFullYear();

    // Product link columns with fallbacks
    const productColumns = [
        {
            heading: 'Tiles',
            links: menus.tiles?.items || [
                { label: 'Porcelain', href: '/tiles/porcelain' },
                { label: 'Subway', href: '/tiles/subway' },
                { label: 'External Porcelain', href: '/tiles/external-porcelain' },
                { label: 'Pool Coping', href: '/tiles/pool-coping' },
                { label: 'Specialty Tiles', href: '/tiles/specialty' },
            ],
        },
        {
            heading: 'Flooring',
            links: menus.flooring?.items || [
                { label: 'Hybrid Flooring', href: '/flooring/hybrid' },
                { label: 'Solid Oak', href: '/flooring/solid-oak' },
                { label: 'Engineered Oak', href: '/flooring/engineered-oak' },
                { label: 'Herringbone', href: '/flooring/herringbone' },
                { label: 'Tile-Look', href: '/flooring/tile-look' },
            ],
        },
        {
            heading: 'Stone',
            links: menus.stone?.items || [
                { label: 'Natural Stone', href: '/stone/natural' },
                { label: 'Stone Pavers', href: '/stone/pavers' },
                { label: 'Ethically Sourced', href: '/stone/ethically-sourced' },
            ],
        },
        {
            heading: 'Trade Supplies',
            links: menus.tradeSupplies?.items || [
                { label: 'Mapei', href: '/trade-supplies/mapei' },
                { label: 'ARDEX', href: '/trade-supplies/ardex' },
                { label: 'Soudal', href: '/trade-supplies/soudal' },
                { label: 'Levelling Systems', href: '/trade-supplies/levelling-systems' },
                { label: 'Waterproofing', href: '/trade-supplies/waterproofing' },
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
            ],
        },
    ];

    // Company info links
    const infoLinks = menus.info?.items || [
        { label: 'Blog', href: '/blog' },
        { label: 'About', href: '/about' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms of Service', href: '/terms-of-service' },
    ];

    return (
        <footer className="font-sans">
            {/* Section 1 - Product Links */}
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

            {/* Section 2 - Company Info */}
            <div className="border-t border-[#333] bg-[#1a1a1a]">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Info & Links */}
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
                                        href={`tel:${phone.replace(/\s/g, '')}`}
                                        className="text-[#aaa] transition-colors duration-200 hover:text-white"
                                    >
                                        {phone}
                                    </a>
                                </p>
                                <p>
                                    <a
                                        href={`tel:${phone2.replace(/\s/g, '')}`}
                                        className="text-[#aaa] transition-colors duration-200 hover:text-white"
                                    >
                                        {phone2}
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
                                    href={youtubeUrl}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    aria-label="YouTube"
                                >
                                    <YouTubeIcon />
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
