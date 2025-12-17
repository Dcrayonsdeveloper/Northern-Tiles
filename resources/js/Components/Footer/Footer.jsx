import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import FooterColumn from './FooterColumn';

export default function Footer() {
    const { footerConfig } = usePage().props;

    const brand = footerConfig?.brand ?? {};
    const menus = footerConfig?.menus ?? {};

    const brandName = brand.name || 'Jikra';
    const logoUrl = brand.logoUrl || null;
    const tagline = brand.tagline || '';
    const address = brand.address || '';
    const email = brand.email || '';
    const phone = brand.phone || '';

    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-10">
                <div className="grid gap-8 md:grid-cols-5">
                    {/* Column 1: Brand */}
                    <div>
                        <Link href="/">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={brandName}
                                    className="h-auto w-auto max-w-[100px]"
                                />
                            ) : (
                                <ApplicationLogo className="h-auto w-auto max-w-[100px]" />
                            )}
                        </Link>

                        {tagline && (
                            <p className="mt-3 text-sm text-slate-600">
                                {tagline}
                            </p>
                        )}

                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                            {address && <p>{address}</p>}

                            {email && (
                                <p>
                                    <a
                                        href={`mailto:${email}`}
                                        className="hover:text-brand"
                                    >
                                        {email}
                                    </a>
                                </p>
                            )}

                            {phone && (
                                <p>
                                    <a
                                        href={`tel:${phone.replace(/\s/g, '')}`}
                                        className="hover:text-brand"
                                    >
                                        {phone}
                                    </a>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Shop */}
                    <FooterColumn
                        title={menus.shop?.title || 'Shop'}
                        items={menus.shop?.items}
                    />

                    {/* Column 3: Company */}
                    <FooterColumn
                        title={menus.company?.title || 'Company'}
                        items={menus.company?.items}
                    />

                    {/* Column 4: Help */}
                    <FooterColumn
                        title={menus.help?.title || 'Help & Support'}
                        items={menus.help?.items}
                    />

                    {/* Column 5: Policies */}
                    <FooterColumn
                        title={menus.policies?.title || 'Policies'}
                        items={menus.policies?.items}
                    />
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-200">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-slate-500">
                    <p>
                        &copy; <span>{year}</span> {brandName}. All rights
                        reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
