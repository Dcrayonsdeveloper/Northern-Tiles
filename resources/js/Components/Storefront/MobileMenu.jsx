import { Link } from '@inertiajs/react';

import { CloseIcon } from './Icons';

function NavItem({ item, onClick }) {
    const href = item?.href ?? '#';
    const target = item?.target ?? '_self';

    const isExternal = typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'));
    const useAnchor = isExternal || target === '_blank';

    if (useAnchor) {
        return (
            <a
                href={href}
                target={target}
                rel={target === '_blank' ? 'noreferrer noopener' : undefined}
                onClick={onClick}
            >
                <span className="block border-t py-2">{item?.label}</span>
            </a>
        );
    }

    return (
        <Link href={href} onClick={onClick}>
            <span className="block border-t py-2">{item?.label}</span>
        </Link>
    );
}

export default function MobileMenu({ open, onClose, navItems, user }) {
    if (!open) {
        return null;
    }

    return (
        <>
            <button
                type="button"
                className="fixed inset-0 z-40 bg-black/30 md:hidden"
                onClick={onClose}
                aria-label="Close menu"
            />
            <aside className="fixed inset-y-0 right-0 z-50 flex h-screen w-80 max-w-[85vw] flex-col border-l border-slate-200 bg-white shadow-xl md:hidden">
                <div className="flex shrink-0 items-center justify-between px-4 py-4">
                    <span className="text-base font-semibold" style={{ color: '#205258' }}>
                        Menu
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded p-2"
                        aria-label="Close menu"
                    >
                        <CloseIcon className="h-6 w-6" style={{ color: '#205258' }} />
                    </button>
                </div>
                <nav className="overflow-y-auto px-4 pb-8 text-sm">
                    <div className="m-0 p-0">
                        {navItems.map((item) => (
                            <NavItem key={item.label} item={item} onClick={onClose} />
                        ))}

                        {user ? (
                            <>
                                <Link href={route('dashboard')} onClick={onClose}>
                                    <span className="block border-t py-2">Dashboard</span>
                                </Link>
                                <Link href={route('logout')} method="post" onClick={onClose}>
                                    <span className="block border-t py-2">Logout</span>
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" onClick={onClose}>
                                <span className="block border-t py-2">Login</span>
                            </Link>
                        )}
                    </div>
                </nav>
            </aside>
        </>
    );
}
