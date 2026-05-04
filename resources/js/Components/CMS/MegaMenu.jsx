import { Link } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

function MenuItem({ item, isChild = false }) {
    const hasChildren = item.children && item.children.length > 0;
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const linkClasses = isChild
        ? 'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand'
        : 'inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand';

    const href = item.url || '#';
    const isExternal = href.startsWith('http://') || href.startsWith('https://');
    const target = item.target || '_self';

    if (!hasChildren) {
        if (isExternal || target === '_blank') {
            return (
                <a
                    href={href}
                    target={target}
                    rel={target === '_blank' ? 'noreferrer noopener' : undefined}
                    className={linkClasses}
                >
                    {item.label}
                </a>
            );
        }

        return (
            <Link href={href} className={linkClasses}>
                {item.label}
            </Link>
        );
    }

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                type="button"
                className={`${linkClasses} ${isOpen ? 'text-brand' : ''}`}
                aria-expanded={isOpen}
            >
                {item.label}
                <svg
                    className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className={`absolute ${isChild ? 'left-full top-0' : 'left-0 top-full'} z-50 mt-0 min-w-[200px] rounded-md border border-gray-200 bg-white py-2 shadow-lg`}>
                    {item.children.map((child) => (
                        <MenuItem key={child.id || child.label} item={child} isChild />
                    ))}
                </div>
            )}
        </div>
    );
}

function MegaMenuPanel({ item, isOpen, onClose }) {
    if (!isOpen) return null;

    const columns = item.children || [];

    return (
        <div
            className="absolute left-0 top-full z-50 w-full border-t border-gray-200 bg-white shadow-lg"
            onMouseLeave={onClose}
        >
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-4 gap-8">
                    {columns.map((column, idx) => (
                        <div key={column.id || idx}>
                            {column.label && (
                                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                    {column.label}
                                </h3>
                            )}
                            <ul className="space-y-2">
                                {(column.children || []).map((link) => {
                                    const href = link.url || '#';
                                    const isExternal = href.startsWith('http://') || href.startsWith('https://');

                                    if (isExternal) {
                                        return (
                                            <li key={link.id || link.label}>
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="text-sm text-gray-600 hover:text-brand"
                                                >
                                                    {link.label}
                                                </a>
                                            </li>
                                        );
                                    }

                                    return (
                                        <li key={link.id || link.label}>
                                            <Link
                                                href={href}
                                                className="text-sm text-gray-600 hover:text-brand"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                            {column.image_url && (
                                <div className="mt-4">
                                    <img
                                        src={column.image_url}
                                        alt={column.label || 'Menu image'}
                                        className="h-32 w-full rounded-md object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {item.featured_products && item.featured_products.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                        <h3 className="mb-4 text-sm font-semibold text-gray-900">Featured Products</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {item.featured_products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={route('products.show', product.slug)}
                                    className="group flex items-center gap-3 rounded-md p-2 hover:bg-gray-50"
                                >
                                    {product.image_url && (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="h-12 w-12 rounded-md object-cover"
                                        />
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 group-hover:text-brand">
                                            {product.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ${product.price?.toLocaleString()}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MegaMenu({ menu, variant = 'dropdown' }) {
    const [openMegaIndex, setOpenMegaIndex] = useState(null);
    const items = menu?.items || [];

    if (!items.length) return null;

    if (variant === 'mega') {
        return (
            <nav className="relative hidden border-b border-gray-200 bg-white lg:block">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-1">
                        {items.map((item, idx) => {
                            const hasMegaPanel = item.children && item.children.length > 0 && item.is_mega;

                            if (hasMegaPanel) {
                                return (
                                    <div
                                        key={item.id || idx}
                                        className="relative"
                                        onMouseEnter={() => setOpenMegaIndex(idx)}
                                        onMouseLeave={() => setOpenMegaIndex(null)}
                                    >
                                        <button
                                            type="button"
                                            className={`inline-flex items-center gap-1 px-3 py-4 text-sm font-medium ${
                                                openMegaIndex === idx ? 'text-brand' : 'text-gray-700 hover:text-brand'
                                            }`}
                                        >
                                            {item.label}
                                            <svg
                                                className={`h-4 w-4 transition-transform ${
                                                    openMegaIndex === idx ? 'rotate-180' : ''
                                                }`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <MegaMenuPanel
                                            item={item}
                                            isOpen={openMegaIndex === idx}
                                            onClose={() => setOpenMegaIndex(null)}
                                        />
                                    </div>
                                );
                            }

                            return <MenuItem key={item.id || idx} item={item} />;
                        })}
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="hidden items-center gap-1 lg:flex">
            {items.map((item) => (
                <MenuItem key={item.id || item.label} item={item} />
            ))}
        </nav>
    );
}
