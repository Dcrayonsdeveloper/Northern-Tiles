import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Site({ settings }) {
    const { data, setData, put, processing, errors } = useForm({
        name: settings?.name ?? 'Northern TILE Distributors',
        seo: {
            title: settings?.seo?.title ?? 'Northern TILE Distributors',
            description: settings?.seo?.description ?? '',
        },
        home: {
            hero_title: settings?.home?.hero_title ?? 'Northern TILE Distributors',
            hero_subtitle: settings?.home?.hero_subtitle ?? '',
        },
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.settings.site.update'));
    };

    return (
        <DashboardLayout title="Site Settings">
            <Head title="Site Settings" />

            <div className="mx-auto max-w-4xl admin-card">
                <div className="text-sm font-semibold text-gray-900">Site Settings</div>
                <div className="mt-1 text-xs text-gray-600">
                    Basic site name, SEO defaults, and homepage hero text.
                </div>

                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Site Name</label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.name ? <div className="mt-1 text-[12px] text-red-600">{errors.name}</div> : null}
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3">
                        <div className="text-xs font-semibold text-gray-900">SEO</div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Default Title</label>
                                <input
                                    value={data.seo.title}
                                    onChange={(e) => setData('seo', { ...data.seo, title: e.target.value })}
                                    className="mt-1 admin-input"
                                />
                                {errors['seo.title'] ? (
                                    <div className="mt-1 text-[12px] text-red-600">{errors['seo.title']}</div>
                                ) : null}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Default Description</label>
                                <input
                                    value={data.seo.description}
                                    onChange={(e) => setData('seo', { ...data.seo, description: e.target.value })}
                                    className="mt-1 admin-input"
                                />
                                {errors['seo.description'] ? (
                                    <div className="mt-1 text-[12px] text-red-600">{errors['seo.description']}</div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3">
                        <div className="text-xs font-semibold text-gray-900">Homepage</div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Hero Title</label>
                                <input
                                    value={data.home.hero_title}
                                    onChange={(e) => setData('home', { ...data.home, hero_title: e.target.value })}
                                    className="mt-1 admin-input"
                                />
                                {errors['home.hero_title'] ? (
                                    <div className="mt-1 text-[12px] text-red-600">{errors['home.hero_title']}</div>
                                ) : null}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Hero Subtitle</label>
                                <input
                                    value={data.home.hero_subtitle}
                                    onChange={(e) => setData('home', { ...data.home, hero_subtitle: e.target.value })}
                                    className="mt-1 admin-input"
                                />
                                {errors['home.hero_subtitle'] ? (
                                    <div className="mt-1 text-[12px] text-red-600">{errors['home.hero_subtitle']}</div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
