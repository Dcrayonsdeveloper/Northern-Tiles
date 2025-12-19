import { Link } from '@inertiajs/react';

function FooterLink({ item }) {
    const href = item?.href ?? '#';
    const target = item?.target ?? '_self';

    const isExternal =
        typeof href === 'string' &&
        (href.startsWith('http://') || href.startsWith('https://'));
    const useAnchor = isExternal || target === '_blank';

    if (useAnchor) {
        return (
            <a
                href={href}
                target={target}
                rel={target === '_blank' ? 'noreferrer noopener' : undefined}
                className="text-slate-600 hover:text-brand"
            >
                {item?.label}
            </a>
        );
    }

    return (
        <Link href={href} className="text-slate-600 hover:text-brand">
            {item?.label}
        </Link>
    );
}

export default function FooterColumn({ title, items = [] }) {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <ul className="mt-3 space-y-2 text-sm">
                {items.map((item, idx) => (
                    <li key={`${item.label}-${idx}`}>
                        <FooterLink item={item} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
