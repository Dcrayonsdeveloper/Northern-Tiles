import DashboardLayout from '@/Layouts/DashboardLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function UiSettings({ topBar }) {
    const { data, setData, put, processing, errors } = useForm({
        enabled: Boolean(topBar?.enabled ?? true),
        backgroundColor: topBar?.backgroundColor ?? '#138ee9',
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

            <div className="admin-card">
                <div className="text-sm font-semibold text-gray-900">Top Bar</div>
                <div className="mt-1 text-xs text-gray-600">
                    Control the announcement bar shown at the very top of the storefront.
                </div>

                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            id="enabled"
                            type="checkbox"
                            checked={data.enabled}
                            onChange={(e) => setData('enabled', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="enabled" className="text-xs font-medium text-slate-700">
                            Enable Top Bar
                        </label>
                    </div>
                    {errors.enabled ? <div className="text-[12px] text-red-600">{errors.enabled}</div> : null}

                    <div>
                        <label className="block text-xs font-medium text-slate-700">Message</label>
                        <TextInput
                            type="text"
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            className="mt-1 block w-full h-9 text-[13px]"
                        />
                        {errors.message ? <div className="mt-1 text-[12px] text-red-600">{errors.message}</div> : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium text-slate-700">Background Color</label>
                            <TextInput
                                type="text"
                                value={data.backgroundColor}
                                onChange={(e) => setData('backgroundColor', e.target.value)}
                                className="mt-1 block w-full h-9 text-[13px]"
                            />
                            {errors.backgroundColor ? (
                                <div className="mt-1 text-[12px] text-red-600">{errors.backgroundColor}</div>
                            ) : null}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700">Text Color</label>
                            <TextInput
                                type="text"
                                value={data.textColor}
                                onChange={(e) => setData('textColor', e.target.value)}
                                className="mt-1 block w-full h-9 text-[13px]"
                            />
                            {errors.textColor ? (
                                <div className="mt-1 text-[12px] text-red-600">{errors.textColor}</div>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium text-slate-700">Link Label (optional)</label>
                            <TextInput
                                type="text"
                                value={data.linkLabel}
                                onChange={(e) => setData('linkLabel', e.target.value)}
                                className="mt-1 block w-full h-9 text-[13px]"
                            />
                            {errors.linkLabel ? (
                                <div className="mt-1 text-[12px] text-red-600">{errors.linkLabel}</div>
                            ) : null}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700">Link Route Name (optional)</label>
                            <TextInput
                                type="text"
                                value={data.linkRoute}
                                onChange={(e) => setData('linkRoute', e.target.value)}
                                className="mt-1 block w-full h-9 text-[13px]"
                            />
                            {errors.linkRoute ? (
                                <div className="mt-1 text-[12px] text-red-600">{errors.linkRoute}</div>
                            ) : null}
                            <div className="mt-1 text-[12px] text-slate-500">Example: pages.contact</div>
                        </div>
                    </div>

                    <div>
                        <PrimaryButton disabled={processing}>
                            Save
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
