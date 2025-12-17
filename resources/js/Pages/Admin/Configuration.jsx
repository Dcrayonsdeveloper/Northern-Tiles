import DashboardLayout from '@/Layouts/DashboardLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import ImageUploadField from '@/Components/Forms/ImageUploadField';
import HeroSlidesEditor from '@/Components/Admin/Config/HeroSlidesEditor';
import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const TABS = [
    { key: 'home', label: 'Home' },
    { key: 'identity', label: 'Identity' },
    { key: 'company', label: 'Company' },
    { key: 'social', label: 'Social' },
    { key: 'seo', label: 'SEO' },
    { key: 'tracking', label: 'Tracking' },
];

export default function Configuration({ config }) {
    const [tab, setTab] = useState('home');

    const initial = useMemo(() => {
        const home = config?.home ?? {};
        const identity = config?.identity ?? {};
        const company = config?.company ?? {};
        const social = config?.social ?? {};
        const seo = config?.seo ?? {};
        const tracking = config?.tracking ?? {};

        return {
            // Home
            hero_slides: home.hero_slides ?? [],

            // Identity
            site_title: identity.site_title ?? '',
            site_tagline: identity.site_tagline ?? '',
            logo: null,
            remove_logo: false,
            logo_dark: null,
            remove_logo_dark: false,
            favicon: null,
            remove_favicon: false,
            footer_logo: null,
            remove_footer_logo: false,

            // Company
            company_legal_name: company.legal_name ?? '',
            company_address: company.address ?? '',
            company_city: company.city ?? '',
            company_state: company.state ?? '',
            company_postal_code: company.postal_code ?? '',
            company_country: company.country ?? '',
            company_email: company.email ?? '',
            company_phone: company.phone ?? '',
            company_vat_number: company.vat_number ?? '',

            // Social
            social_facebook_url: social.facebook_url ?? '',
            social_twitter_url: social.twitter_url ?? '',
            social_instagram_url: social.instagram_url ?? '',
            social_youtube_url: social.youtube_url ?? '',
            social_linkedin_url: social.linkedin_url ?? '',
            social_tiktok_url: social.tiktok_url ?? '',
            twitter_site: social.twitter_site ?? '',
            twitter_creator: social.twitter_creator ?? '',

            // SEO
            seo_meta_title: seo.meta_title ?? '',
            seo_meta_description: seo.meta_description ?? '',
            og_image: null,
            remove_og_image: false,

            // Tracking
            tracking_gtm_id: tracking.gtm_id ?? '',
            tracking_ga4_id: tracking.ga4_id ?? '',
            tracking_meta_pixel_id: tracking.meta_pixel_id ?? '',
        };
    }, [config]);

    const form = useForm(initial);

    const submit = (e) => {
        e.preventDefault();
        form.post(route('admin.configuration.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout title="Configuration">
            <Head title="Configuration" />

            {/* Sticky Header */}
            <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold text-gray-900">Site Configuration</h1>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={submit}
                        disabled={form.processing}
                    >
                        {form.processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {/* Tabs */}
                <div className="admin-card">
                    <div className="flex flex-wrap gap-2">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                className={tab === t.key ? 'btn-primary' : 'btn-secondary'}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Home Tab */}
                {tab === 'home' && (
                    <HeroSlidesEditor
                        value={form.data.hero_slides}
                        onChange={(v) => form.setData('hero_slides', v)}
                        errors={form.errors}
                    />
                )}

                {/* Identity Tab */}
                {tab === 'identity' && (
                    <div className="space-y-4">
                        <div className="admin-card space-y-4">
                            <h2 className="text-sm font-semibold text-gray-900">Site Identity</h2>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <InputLabel value="Site Title" required />
                                    <input
                                        className="admin-input"
                                        value={form.data.site_title}
                                        onChange={(e) => form.setData('site_title', e.target.value)}
                                        placeholder="My Store"
                                    />
                                    <InputError message={form.errors.site_title} />
                                </div>

                                <div>
                                    <InputLabel value="Tagline" />
                                    <input
                                        className="admin-input"
                                        value={form.data.site_tagline}
                                        onChange={(e) => form.setData('site_tagline', e.target.value)}
                                        placeholder="Your trusted shopping destination"
                                    />
                                    <InputError message={form.errors.site_tagline} />
                                </div>
                            </div>
                        </div>

                        <div className="admin-card space-y-4">
                            <h2 className="text-sm font-semibold text-gray-900">Logos & Branding</h2>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <ImageUploadField
                                    label="Site Logo"
                                    name="logo"
                                    currentUrl={config?.identity?.logo_url}
                                    onChange={(file) => {
                                        form.setData('logo', file);
                                        if (file) form.setData('remove_logo', false);
                                    }}
                                    onRemove={() => {
                                        form.setData('remove_logo', true);
                                        form.setData('logo', null);
                                    }}
                                    hint="Max 500x200px, PNG or SVG recommended"
                                    error={form.errors.logo}
                                />

                                <ImageUploadField
                                    label="Dark Mode Logo"
                                    name="logo_dark"
                                    currentUrl={config?.identity?.logo_dark_url}
                                    onChange={(file) => {
                                        form.setData('logo_dark', file);
                                        if (file) form.setData('remove_logo_dark', false);
                                    }}
                                    onRemove={() => {
                                        form.setData('remove_logo_dark', true);
                                        form.setData('logo_dark', null);
                                    }}
                                    hint="Used when dark mode is enabled"
                                    error={form.errors.logo_dark}
                                />

                                <ImageUploadField
                                    label="Favicon"
                                    name="favicon"
                                    currentUrl={config?.identity?.favicon_url}
                                    onChange={(file) => {
                                        form.setData('favicon', file);
                                        if (file) form.setData('remove_favicon', false);
                                    }}
                                    onRemove={() => {
                                        form.setData('remove_favicon', true);
                                        form.setData('favicon', null);
                                    }}
                                    hint="Must be exactly 32x32 pixels"
                                    error={form.errors.favicon}
                                    previewClassName="h-8 w-8"
                                />

                                <ImageUploadField
                                    label="Footer Logo"
                                    name="footer_logo"
                                    currentUrl={config?.identity?.footer_logo_url}
                                    onChange={(file) => {
                                        form.setData('footer_logo', file);
                                        if (file) form.setData('remove_footer_logo', false);
                                    }}
                                    onRemove={() => {
                                        form.setData('remove_footer_logo', true);
                                        form.setData('footer_logo', null);
                                    }}
                                    hint="Optional, falls back to site logo"
                                    error={form.errors.footer_logo}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Company Tab */}
                {tab === 'company' && (
                    <div className="admin-card space-y-4">
                        <h2 className="text-sm font-semibold text-gray-900">Company Information</h2>
                        <p className="text-xs text-gray-500">Used for invoices, legal pages, and structured data (JSON-LD).</p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <InputLabel value="Legal Business Name" />
                                <input
                                    className="admin-input"
                                    value={form.data.company_legal_name}
                                    onChange={(e) => form.setData('company_legal_name', e.target.value)}
                                    placeholder="Acme Corporation Ltd."
                                />
                                <InputError message={form.errors.company_legal_name} />
                            </div>

                            <div>
                                <InputLabel value="VAT / Tax Number" />
                                <input
                                    className="admin-input"
                                    value={form.data.company_vat_number}
                                    onChange={(e) => form.setData('company_vat_number', e.target.value)}
                                    placeholder="GB123456789"
                                />
                                <InputError message={form.errors.company_vat_number} />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Street Address" />
                            <input
                                className="admin-input"
                                value={form.data.company_address}
                                onChange={(e) => form.setData('company_address', e.target.value)}
                                placeholder="123 Business Street"
                            />
                            <InputError message={form.errors.company_address} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <InputLabel value="City" />
                                <input
                                    className="admin-input"
                                    value={form.data.company_city}
                                    onChange={(e) => form.setData('company_city', e.target.value)}
                                    placeholder="London"
                                />
                                <InputError message={form.errors.company_city} />
                            </div>

                            <div>
                                <InputLabel value="State / Province" />
                                <input
                                    className="admin-input"
                                    value={form.data.company_state}
                                    onChange={(e) => form.setData('company_state', e.target.value)}
                                    placeholder="England"
                                />
                                <InputError message={form.errors.company_state} />
                            </div>

                            <div>
                                <InputLabel value="Postal Code" />
                                <input
                                    className="admin-input"
                                    value={form.data.company_postal_code}
                                    onChange={(e) => form.setData('company_postal_code', e.target.value)}
                                    placeholder="SW1A 1AA"
                                />
                                <InputError message={form.errors.company_postal_code} />
                            </div>

                            <div>
                                <InputLabel value="Country" />
                                <input
                                    className="admin-input"
                                    value={form.data.company_country}
                                    onChange={(e) => form.setData('company_country', e.target.value)}
                                    placeholder="United Kingdom"
                                />
                                <InputError message={form.errors.company_country} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <InputLabel value="Contact Email" />
                                <input
                                    type="email"
                                    className="admin-input"
                                    value={form.data.company_email}
                                    onChange={(e) => form.setData('company_email', e.target.value)}
                                    placeholder="support@example.com"
                                />
                                <InputError message={form.errors.company_email} />
                            </div>

                            <div>
                                <InputLabel value="Contact Phone" />
                                <input
                                    type="tel"
                                    className="admin-input"
                                    value={form.data.company_phone}
                                    onChange={(e) => form.setData('company_phone', e.target.value)}
                                    placeholder="+44 20 1234 5678"
                                />
                                <InputError message={form.errors.company_phone} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Social Tab */}
                {tab === 'social' && (
                    <div className="space-y-4">
                        <div className="admin-card space-y-4">
                            <h2 className="text-sm font-semibold text-gray-900">Social Media Links</h2>
                            <p className="text-xs text-gray-500">Links displayed in footer and used for social sharing.</p>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <InputLabel value="Facebook URL" />
                                    <input
                                        type="url"
                                        className="admin-input"
                                        value={form.data.social_facebook_url}
                                        onChange={(e) => form.setData('social_facebook_url', e.target.value)}
                                        placeholder="https://facebook.com/yourpage"
                                    />
                                    <InputError message={form.errors.social_facebook_url} />
                                </div>

                                <div>
                                    <InputLabel value="Twitter / X URL" />
                                    <input
                                        type="url"
                                        className="admin-input"
                                        value={form.data.social_twitter_url}
                                        onChange={(e) => form.setData('social_twitter_url', e.target.value)}
                                        placeholder="https://twitter.com/yourhandle"
                                    />
                                    <InputError message={form.errors.social_twitter_url} />
                                </div>

                                <div>
                                    <InputLabel value="Instagram URL" />
                                    <input
                                        type="url"
                                        className="admin-input"
                                        value={form.data.social_instagram_url}
                                        onChange={(e) => form.setData('social_instagram_url', e.target.value)}
                                        placeholder="https://instagram.com/yourhandle"
                                    />
                                    <InputError message={form.errors.social_instagram_url} />
                                </div>

                                <div>
                                    <InputLabel value="YouTube URL" />
                                    <input
                                        type="url"
                                        className="admin-input"
                                        value={form.data.social_youtube_url}
                                        onChange={(e) => form.setData('social_youtube_url', e.target.value)}
                                        placeholder="https://youtube.com/@yourchannel"
                                    />
                                    <InputError message={form.errors.social_youtube_url} />
                                </div>

                                <div>
                                    <InputLabel value="LinkedIn URL" />
                                    <input
                                        type="url"
                                        className="admin-input"
                                        value={form.data.social_linkedin_url}
                                        onChange={(e) => form.setData('social_linkedin_url', e.target.value)}
                                        placeholder="https://linkedin.com/company/yourcompany"
                                    />
                                    <InputError message={form.errors.social_linkedin_url} />
                                </div>

                                <div>
                                    <InputLabel value="TikTok URL" />
                                    <input
                                        type="url"
                                        className="admin-input"
                                        value={form.data.social_tiktok_url}
                                        onChange={(e) => form.setData('social_tiktok_url', e.target.value)}
                                        placeholder="https://tiktok.com/@yourhandle"
                                    />
                                    <InputError message={form.errors.social_tiktok_url} />
                                </div>
                            </div>
                        </div>

                        <div className="admin-card space-y-4">
                            <h2 className="text-sm font-semibold text-gray-900">Twitter Card Settings</h2>
                            <p className="text-xs text-gray-500">Used for Twitter/X card meta tags when sharing.</p>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <InputLabel value="Site Handle" />
                                    <input
                                        className="admin-input"
                                        value={form.data.twitter_site}
                                        onChange={(e) => form.setData('twitter_site', e.target.value)}
                                        placeholder="@brand"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">The Twitter @username of the website</p>
                                    <InputError message={form.errors.twitter_site} />
                                </div>

                                <div>
                                    <InputLabel value="Creator Handle" />
                                    <input
                                        className="admin-input"
                                        value={form.data.twitter_creator}
                                        onChange={(e) => form.setData('twitter_creator', e.target.value)}
                                        placeholder="@founder"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">The Twitter @username of the content creator</p>
                                    <InputError message={form.errors.twitter_creator} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SEO Tab */}
                {tab === 'seo' && (
                    <div className="admin-card space-y-4">
                        <h2 className="text-sm font-semibold text-gray-900">Default SEO Settings</h2>
                        <p className="text-xs text-gray-500">Default meta tags used when pages don't have their own.</p>

                        <div>
                            <InputLabel value="Default Meta Title" />
                            <input
                                className="admin-input"
                                value={form.data.seo_meta_title}
                                onChange={(e) => form.setData('seo_meta_title', e.target.value)}
                                placeholder="My Store - Best Products Online"
                                maxLength={70}
                            />
                            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                                <span>Recommended: 50-60 characters</span>
                                <span>{form.data.seo_meta_title.length}/70</span>
                            </div>
                            <InputError message={form.errors.seo_meta_title} />
                        </div>

                        <div>
                            <InputLabel value="Default Meta Description" />
                            <textarea
                                className="admin-textarea"
                                rows={3}
                                value={form.data.seo_meta_description}
                                onChange={(e) => form.setData('seo_meta_description', e.target.value)}
                                placeholder="Discover amazing products at great prices. Fast shipping and excellent customer service."
                                maxLength={160}
                            />
                            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                                <span>Recommended: 150-160 characters</span>
                                <span>{form.data.seo_meta_description.length}/160</span>
                            </div>
                            <InputError message={form.errors.seo_meta_description} />
                        </div>

                        <ImageUploadField
                            label="Default OG Image"
                            name="og_image"
                            currentUrl={config?.seo?.og_image_url}
                            onChange={(file) => {
                                form.setData('og_image', file);
                                if (file) form.setData('remove_og_image', false);
                            }}
                            onRemove={() => {
                                form.setData('remove_og_image', true);
                                form.setData('og_image', null);
                            }}
                            hint="Minimum 1200x630px for best results on social media"
                            error={form.errors.og_image}
                            previewClassName="h-20 w-auto max-w-[300px]"
                        />
                    </div>
                )}

                {/* Tracking Tab */}
                {tab === 'tracking' && (
                    <div className="space-y-4">
                        <div className="admin-card space-y-4">
                            <h2 className="text-sm font-semibold text-gray-900">Google Tag Manager</h2>
                            <p className="text-xs text-gray-500">GTM container for managing all tracking tags.</p>

                            <div>
                                <InputLabel value="GTM Container ID" />
                                <input
                                    className="admin-input"
                                    value={form.data.tracking_gtm_id}
                                    onChange={(e) => form.setData('tracking_gtm_id', e.target.value.toUpperCase())}
                                    placeholder="GTM-XXXXXXX"
                                />
                                <p className="mt-1 text-xs text-gray-500">Format: GTM-XXXXXXX</p>
                                <InputError message={form.errors.tracking_gtm_id} />
                            </div>
                        </div>

                        <div className="admin-card space-y-4">
                            <h2 className="text-sm font-semibold text-gray-900">Google Analytics 4</h2>
                            <p className="text-xs text-gray-500">Direct GA4 integration (use either GTM or direct, not both).</p>

                            <div>
                                <InputLabel value="GA4 Measurement ID" />
                                <input
                                    className="admin-input"
                                    value={form.data.tracking_ga4_id}
                                    onChange={(e) => form.setData('tracking_ga4_id', e.target.value.toUpperCase())}
                                    placeholder="G-XXXXXXXXXX"
                                />
                                <p className="mt-1 text-xs text-gray-500">Format: G-XXXXXXXXXX</p>
                                <InputError message={form.errors.tracking_ga4_id} />
                            </div>
                        </div>

                        <div className="admin-card space-y-4">
                            <h2 className="text-sm font-semibold text-gray-900">Meta Pixel (Facebook)</h2>
                            <p className="text-xs text-gray-500">For Facebook/Instagram ads and conversion tracking.</p>

                            <div>
                                <InputLabel value="Pixel ID" />
                                <input
                                    className="admin-input"
                                    value={form.data.tracking_meta_pixel_id}
                                    onChange={(e) => form.setData('tracking_meta_pixel_id', e.target.value.replace(/\D/g, ''))}
                                    placeholder="1234567890123456"
                                />
                                <p className="mt-1 text-xs text-gray-500">Numeric ID from Meta Business Suite</p>
                                <InputError message={form.errors.tracking_meta_pixel_id} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Save Button */}
                <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={form.processing}
                    >
                        {form.processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
