import { Link } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';

// Icons
function ChevronDownIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function ChevronRightIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

// Link component that handles internal/external URLs
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

// Badge component - uses BEM classes from SCSS
function Badge({ text, color = 'brand' }) {
    if (!text) return null;

    return (
        <span className={`menu-badge menu-badge--${color}`}>
            {text}
        </span>
    );
}

// Video thumbnail with play button - uses BEM classes
function VideoThumbnail({ videoUrl, imageUrl, title }) {
    const [showVideo, setShowVideo] = useState(false);

    const getYouTubeId = (url) => {
        const match = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
        return match ? match[1] : null;
    };

    const youtubeId = getYouTubeId(videoUrl);
    const thumbnailUrl = imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null);

    if (showVideo && youtubeId) {
        return (
            <div className="aspect-video overflow-hidden rounded-lg">
                <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                />
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setShowVideo(true)}
            className="video-thumbnail"
        >
            {thumbnailUrl && (
                <img
                    src={thumbnailUrl}
                    alt={title || 'Video'}
                    className="video-thumbnail__image"
                />
            )}
            <div className="video-thumbnail__overlay">
                <div className="video-thumbnail__play">
                    <PlayIcon />
                </div>
            </div>
        </button>
    );
}

// Featured content card - uses BEM classes
function FeaturedCard({ item }) {
    const { title, url, image_url, description, type, date } = item;

    return (
        <MenuLink href={url} className="featured-card">
            {image_url && (
                <div className="featured-card__image">
                    <img src={image_url} alt={title} />
                </div>
            )}
            <div className="featured-card__content">
                {type && (
                    <span className="featured-card__type">{type}</span>
                )}
                <h4 className="featured-card__title">{title}</h4>
                {description && (
                    <p className="featured-card__description">{description}</p>
                )}
                {date && (
                    <p className="featured-card__date">{date}</p>
                )}
            </div>
        </MenuLink>
    );
}

// Regular dropdown item with nested submenu support
function DropdownItem({ item, isNested = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef(null);
    const hasChildren = item.children?.length > 0;

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setIsOpen(false), 100);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    if (!hasChildren) {
        return (
            <MenuLink
                href={item.url}
                target={item.target}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand"
            >
                {item.icon && <span className={`h-4 w-4 ${item.icon}`} />}
                <span className="flex-1">{item.label}</span>
                <Badge text={item.badge_text} color={item.badge_color} />
            </MenuLink>
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
                className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand ${isOpen ? 'bg-gray-50 text-brand' : ''}`}
            >
                {item.icon && <span className={`h-4 w-4 ${item.icon}`} />}
                <span className="flex-1 text-left">{item.label}</span>
                <Badge text={item.badge_text} color={item.badge_color} />
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute left-full top-0 z-50 ml-1 min-w-[180px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                    {item.children.map((child, idx) => (
                        <DropdownItem key={child.id || idx} item={child} isNested />
                    ))}
                </div>
            )}
        </div>
    );
}

// Mega menu column - uses BEM classes for proper overflow handling
function MegaColumn({ column }) {
    return (
        <div className="mega-column">
            {column.label && (
                <h3 className="mega-column__header">
                    {column.url ? (
                        <MenuLink href={column.url}>{column.label}</MenuLink>
                    ) : (
                        column.label
                    )}
                </h3>
            )}
            {column.description && (
                <p className="mega-column__description">{column.description}</p>
            )}
            <ul className="mega-column__list">
                {(column.children || []).map((link, idx) => (
                    <li key={link.id || idx}>
                        <MenuLink
                            href={link.url}
                            target={link.target}
                            className="mega-column__link"
                        >
                            {link.icon && <span className={`mega-column__link-icon ${link.icon}`} />}
                            <span className="mega-column__link-label">{link.label}</span>
                            <Badge text={link.badge_text} color={link.badge_color} />
                        </MenuLink>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Featured sidebar content - uses BEM classes
function FeaturedSidebar({ item }) {
    const featuredContent = item.featured_content || [];
    const hasFeatured = featuredContent.length > 0 || item.image_url || item.video_url;

    if (!hasFeatured) return null;

    return (
        <div className="mega-menu-featured">
            {item.video_url && (
                <VideoThumbnail
                    videoUrl={item.video_url}
                    imageUrl={item.image_url}
                    title={item.label}
                />
            )}

            {!item.video_url && item.image_url && (
                <MenuLink href={item.url} className="featured-card">
                    <div className="featured-card__image">
                        <img src={item.image_url} alt={item.image_alt || item.label || ''} />
                    </div>
                </MenuLink>
            )}

            {featuredContent.length > 0 && (
                <div className="space-y-3">
                    {featuredContent.slice(0, 2).map((content, idx) => (
                        <FeaturedCard key={idx} item={content} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Mega menu panel - enterprise level with proper grid handling
function MegaMenuPanel({ item, containerRef }) {
    const columns = item.children || [];
    const columnCount = Math.min(item.mega_columns || 4, columns.length);
    const featuredContent = item.featured_content || [];
    const hasFeatured = featuredContent.length > 0 || item.image_url || item.video_url;
    const panelRef = useRef(null);

    // Calculate grid columns - reduce if featured sidebar is present
    const gridCols = hasFeatured ? Math.min(columnCount, 3) : Math.min(columnCount, 4);

    // Calculate position based on header - useLayoutEffect for synchronous measurement
    useLayoutEffect(() => {
        if (panelRef.current) {
            const header = panelRef.current.closest('header');
            if (header) {
                const headerRect = header.getBoundingClientRect();
                panelRef.current.style.top = `${headerRect.bottom}px`;
            }
        }
    }, []);

    return (
        <div ref={panelRef} className="mega-menu-panel">
            <div className="mega-menu-inner">
                <div className="flex gap-6">
                    {/* Columns grid with proper min-width handling */}
                    <div
                        className="mega-menu-grid flex-1"
                        style={{
                            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
                        }}
                    >
                        {columns.map((column, idx) => (
                            <MegaColumn key={column.id || idx} column={column} />
                        ))}
                    </div>

                    {/* Featured sidebar */}
                    {hasFeatured && <FeaturedSidebar item={item} />}
                </div>
            </div>
        </div>
    );
}

// Regular dropdown panel
function DropdownPanel({ item }) {
    return (
        <div className="dropdown-panel">
            <div className="p-1">
                {item.children.map((child, idx) => (
                    <DropdownItem key={child.id || idx} item={child} />
                ))}
            </div>
        </div>
    );
}

// Main nav item
function NavItem({ item, isOpen, onOpen, onClose, menuContainerRef }) {
    const hasChildren = item.children?.length > 0;
    const isMega = item.is_mega && hasChildren;

    // Simple link without children
    if (!hasChildren) {
        return (
            <MenuLink
                href={item.url}
                target={item.target}
                className="nav-link"
            >
                <span>{item.label}</span>
                <Badge text={item.badge_text} color={item.badge_color} />
            </MenuLink>
        );
    }

    return (
        <div
            className="nav-item"
            onMouseEnter={onOpen}
            onMouseLeave={onClose}
        >
            <button
                type="button"
                className={`nav-link ${isOpen ? 'is-active' : ''}`}
            >
                <span>{item.label}</span>
                <Badge text={item.badge_text} color={item.badge_color} />
                <ChevronDownIcon className={`nav-chevron ${isOpen ? 'is-open' : ''}`} />
            </button>

            {isOpen && (
                isMega ? (
                    <MegaMenuPanel item={item} containerRef={menuContainerRef} />
                ) : (
                    <DropdownPanel item={item} />
                )
            )}
        </div>
    );
}

// Main MegaMenu component
export default function MegaMenu({ items = [], className = '' }) {
    const [openIndex, setOpenIndex] = useState(null);
    const closeTimeoutRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    const handleOpen = useCallback((index) => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setOpenIndex(index);
    }, []);

    const handleClose = useCallback(() => {
        closeTimeoutRef.current = setTimeout(() => {
            setOpenIndex(null);
        }, 80);
    }, []);

    if (!items.length) return null;

    return (
        <nav ref={menuRef} className={`mega-menu ${className}`}>
            <div className="nav-container">
                {items.map((item, idx) => (
                    <NavItem
                        key={item.id || idx}
                        item={item}
                        isOpen={openIndex === idx}
                        onOpen={() => handleOpen(idx)}
                        onClose={handleClose}
                        menuContainerRef={menuRef}
                    />
                ))}
            </div>
        </nav>
    );
}
