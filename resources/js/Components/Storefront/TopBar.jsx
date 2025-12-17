import { Link } from '@inertiajs/react';

export default function TopBar({ topBar }) {
    if (!topBar?.enabled) {
        return null;
    }

    const backgroundColor = topBar?.backgroundColor ?? '#205258';
    const textColor = topBar?.textColor ?? '#ffffff';
    const message = topBar?.message ?? '';
    const linkLabel = topBar?.link?.label;
    const linkRoute = topBar?.link?.route;

    return (
        <div className="text-xs" style={{ backgroundColor, color: textColor }}>
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
                <span>{message}</span>
                {linkLabel && linkRoute ? (
                    <Link className="underline" href={route(linkRoute)}>
                        {linkLabel}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
