import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';

export default function UiSettings({ topBar }) {
    const { data, setData, put, processing, errors } = useForm({
        enabled: Boolean(topBar?.enabled ?? true),
        backgroundColor: topBar?.backgroundColor ?? '#205258',
        textColor: topBar?.textColor ?? '#ffffff',
        message: topBar?.message ?? '',
        linkLabel: topBar?.link?.label ?? '',
        linkRoute: topBar?.link?.route ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.settings.ui.update'));
    };

    return (
        <DashboardLayout title="UI Settings">
            <Head title="UI Settings" />

            <div className="mx-auto max-w-3xl">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-[15px] font-semibold">Top Bar</div>
                    <div className="mt-1 text-slate-600">
                        Control the announcement bar shown at the very top of the storefront.
                    </div>

                    <form onSubmit={submit} className="mt-4 space-y-5">
                            <div className="flex items-center gap-3">
                                <input
                                    id="enabled"
                                    type="checkbox"
                                    checked={data.enabled}
                                    onChange={(e) => setData('enabled', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor="enabled" className="font-medium text-slate-700">
                                    Enable Top Bar
                                </label>
                            </div>
                            {errors.enabled ? (
                                <div className="text-red-600">{errors.enabled}</div>
                            ) : null}

                            <div>
                                <label className="block font-medium text-slate-700">
                                    Message
                                </label>
                                <input
                                    type="text"
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-200 bg-white px-3 py-2"
                                />
                                {errors.message ? (
                                    <div className="mt-1 text-red-600">{errors.message}</div>
                                ) : null}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block font-medium text-slate-700">
                                        Background Color
                                    </label>
                                    <input
                                        type="text"
                                        value={data.backgroundColor}
                                        onChange={(e) => setData('backgroundColor', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-200 bg-white px-3 py-2"
                                    />
                                    {errors.backgroundColor ? (
                                        <div className="mt-1 text-red-600">
                                            {errors.backgroundColor}
                                        </div>
                                    ) : null}
                                </div>
                                <div>
                                    <label className="block font-medium text-slate-700">
                                        Text Color
                                    </label>
                                    <input
                                        type="text"
                                        value={data.textColor}
                                        onChange={(e) => setData('textColor', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-200 bg-white px-3 py-2"
                                    />
                                    {errors.textColor ? (
                                        <div className="mt-1 text-red-600">{errors.textColor}</div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block font-medium text-slate-700">
                                        Link Label (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.linkLabel}
                                        onChange={(e) => setData('linkLabel', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-200 bg-white px-3 py-2"
                                    />
                                    {errors.linkLabel ? (
                                        <div className="mt-1 text-red-600">{errors.linkLabel}</div>
                                    ) : null}
                                </div>
                                <div>
                                    <label className="block font-medium text-slate-700">
                                        Link Route Name (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.linkRoute}
                                        onChange={(e) => setData('linkRoute', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-200 bg-white px-3 py-2"
                                    />
                                    {errors.linkRoute ? (
                                        <div className="mt-1 text-red-600">{errors.linkRoute}</div>
                                    ) : null}
                                    <div className="mt-1 text-[12px] text-slate-500">
                                        Example: pages.contact
                                    </div>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white"
                                >
                                    Save
                                </button>
                            </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
