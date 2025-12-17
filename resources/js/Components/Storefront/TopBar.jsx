import { Link } from '@inertiajs/react';

function MenuLink({ item }) {
    const href = item?.url ?? '#';
    const target = item?.target ?? '_self';

    const isExternal = typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'));
    const useAnchor = isExternal || target === '_blank';

    if (useAnchor) {
        return (
            <a
                href={href}
                target={target}
                rel={target === '_blank' ? 'noreferrer noopener' : undefined}
                className="underline"
            >
                {item?.label}
            </a>
        );
    }

    return (
        <Link className="underline" href={href}>
            {item?.label}
        </Link>
    );
}

export default function TopBar({ topBar, menuItems = [] }) {
    if (!topBar?.enabled && !(menuItems ?? []).length) {
        return null;
    }

    const showAnnouncement = Boolean(topBar?.enabled);

    const backgroundColor = topBar?.backgroundColor ?? '#205258';
    const textColor = topBar?.textColor ?? '#ffffff';
    const message = topBar?.message ?? '';
    const linkLabel = topBar?.link?.label;
    const linkRoute = topBar?.link?.route;

    return (
        <div className="text-xs" style={{ backgroundColor, color: textColor }}>
            <div
                className={
                    'mx-auto flex max-w-7xl items-center px-4 py-2 sm:px-6 lg:px-8' +
                    (showAnnouncement ? ' justify-between' : ' justify-end')
                }
            >
                {showAnnouncement ? <span>{message}</span> : null}

                <div className="hidden items-center gap-4 sm:flex">
                    {showAnnouncement && linkLabel && linkRoute ? (
                        <Link className="underline" href={route(linkRoute)}>
                            {linkLabel}
                        </Link>
                    ) : null}

                    {(menuItems ?? []).map((item, idx) => (
                        <MenuLink key={(item?.label ?? 'item') + idx} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}
