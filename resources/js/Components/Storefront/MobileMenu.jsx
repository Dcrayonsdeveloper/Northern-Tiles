import { Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

// Icons
function ChevronRightIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}

function ChevronLeftIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function PlayIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
        </svg>
    );
}

// Link component
function MenuLink({ href, target = '_self', className, children, onClick }) {
    const isExternal = href?.startsWith('http://') || href?.startsWith('https://');

    if (isExternal || target === '_blank') {
        return (
            <a
                href={href || '#'}
                target={target}
                rel={target === '_blank' ? 'noreferrer noopener' : undefined}
                className={className}
                onClick={onClick}
            >
                {children}
            </a>
        );
    }

    return (
        <Link href={href || '#'} className={className} onClick={onClick}>
            {children}
        </Link>
    );
}

// Badge component
function Badge({ text, color = 'brand' }) {
    if (!text) return null;

    const colorClasses = {
        brand: 'bg-brand text-white',
        red: 'bg-red-500 text-white',
        green: 'bg-green-500 text-white',
        orange: 'bg-orange-500 text-white',
    };

    return (
        <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorClasses[color] || colorClasses.brand}`}>
            {text}
        </span>
    );
}

// Featured content in mobile
function MobileFeaturedContent({ item, onClose }) {
    const featuredContent = item.featured_content || [];

    if (!item.image_url && !item.video_url && featuredContent.length === 0) {
        return null;
    }

    return (
        <div className="mobile-menu__featured">
            {item.image_url && !item.video_url && (
                <MenuLink href={item.url} className="mobile-menu__featured-image" onClick={onClose}>
                    <img src={item.image_url} alt={item.image_alt || ''} className="w-full rounded-lg" />
                </MenuLink>
            )}

            {item.video_url && (
                <div className="mobile-menu__featured-video">
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
                        <img
                            src={item.image_url || `https://img.youtube.com/vi/${item.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)?.[1]}/mqdefault.jpg`}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                                <PlayIcon className="h-4 w-4 text-brand" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {featuredContent.length > 0 && (
                <div className="mobile-menu__featured-list mt-4 space-y-3">
                    {featuredContent.slice(0, 2).map((content, idx) => (
                        <MenuLink
                            key={idx}
                            href={content.url}
                            className="mobile-menu__featured-card flex items-center gap-3"
                            onClick={onClose}
                        >
                            {content.image_url && (
                                <img src={content.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                                {content.type && (
                                    <span className="text-[10px] font-semibold uppercase text-brand">{content.type}</span>
                                )}
                                <span className="block truncate text-sm font-medium text-gray-900">{content.title}</span>
                            </div>
                        </MenuLink>
                    ))}
                </div>
            )}
        </div>
    );
}

// Mobile menu item
function MobileMenuItem({ item, onClose, onNavigate }) {
    const hasChildren = item.children?.length > 0;

    if (hasChildren) {
        return (
            <li className="mobile-menu__item">
                <button
                    type="button"
                    onClick={() => onNavigate(item)}
                    className="mobile-menu__link mobile-menu__link--parent"
                >
                    {item.icon && <span className={`mobile-menu__icon ${item.icon}`} />}
                    <span className="mobile-menu__label">{item.label}</span>
                    <Badge text={item.badge_text} color={item.badge_color} />
                    <ChevronRightIcon className="mobile-menu__arrow" />
                </button>
            </li>
        );
    }

    return (
        <li className="mobile-menu__item">
            <MenuLink
                href={item.url || item.href}
                target={item.target}
                className="mobile-menu__link"
                onClick={onClose}
            >
                {item.icon && <span className={`mobile-menu__icon ${item.icon}`} />}
                <span className="mobile-menu__label">{item.label}</span>
                <Badge text={item.badge_text} color={item.badge_color} />
            </MenuLink>
            {item.description && (
                <p className="mobile-menu__description">{item.description}</p>
            )}
        </li>
    );
}

// Main mobile menu component
export default function MobileMenu({ open, onClose, navItems = [], user }) {
    const menuRef = useRef(null);
    const [navigationStack, setNavigationStack] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);

    // Current panel data
    const currentPanel = navigationStack.length > 0
        ? navigationStack[navigationStack.length - 1]
        : { title: 'Menu', items: navItems, parentItem: null };

    // Handle body scroll lock
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            setIsAnimating(true);
        } else {
            document.body.style.overflow = '';
            // Reset navigation when menu closes
            setNavigationStack([]);
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && open) {
                if (navigationStack.length > 0) {
                    handleBack();
                } else {
                    onClose();
                }
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose, navigationStack]);

    // Navigate to submenu
    const handleNavigate = (item) => {
        setNavigationStack([...navigationStack, {
            title: item.label,
            items: item.children || [],
            parentItem: item,
        }]);
    };

    // Go back
    const handleBack = () => {
        setNavigationStack(navigationStack.slice(0, -1));
    };

    if (!open && !isAnimating) {
        return null;
    }

    return (
        <div className={`mobile-menu ${open ? 'is-open' : 'is-closing'}`}>
            {/* Backdrop */}
            <button
                type="button"
                className="mobile-menu__backdrop"
                onClick={onClose}
                aria-label="Close menu"
            />

            {/* Menu container */}
            <aside
                ref={menuRef}
                className="mobile-menu__container"
                onTransitionEnd={() => {
                    if (!open) setIsAnimating(false);
                }}
            >
                {/* Header */}
                <div className="mobile-menu__header">
                    {navigationStack.length > 0 ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="mobile-menu__back"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                            <span>Back</span>
                        </button>
                    ) : (
                        <span className="mobile-menu__title">Menu</span>
                    )}

                    {navigationStack.length > 0 && (
                        <span className="mobile-menu__title">{currentPanel.title}</span>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="mobile-menu__close"
                        aria-label="Close menu"
                    >
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Featured content for mega menus */}
                {currentPanel.parentItem && (
                    <MobileFeaturedContent item={currentPanel.parentItem} onClose={onClose} />
                )}

                {/* Navigation items */}
                <nav className="mobile-menu__nav">
                    <ul className="mobile-menu__list">
                        {currentPanel.items.map((item, idx) => (
                            <MobileMenuItem
                                key={item.id || item.label || idx}
                                item={item}
                                onClose={onClose}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </ul>
                </nav>

                {/* User section (only on main level) */}
                {navigationStack.length === 0 && (
                    <div className="mobile-menu__footer">
                        {user ? (
                            <>
                                <MenuLink
                                    href={route('dashboard')}
                                    className="mobile-menu__footer-link"
                                    onClick={onClose}
                                >
                                    Dashboard
                                </MenuLink>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    className="mobile-menu__footer-link"
                                    onClick={onClose}
                                >
                                    Logout
                                </Link>
                            </>
                        ) : (
                            <>
                                <MenuLink
                                    href="/login"
                                    className="mobile-menu__footer-link"
                                    onClick={onClose}
                                >
                                    Login
                                </MenuLink>
                                <MenuLink
                                    href="/register"
                                    className="mobile-menu__footer-link mobile-menu__footer-link--primary"
                                    onClick={onClose}
                                >
                                    Register
                                </MenuLink>
                            </>
                        )}
                    </div>
                )}
            </aside>
        </div>
    );
}
