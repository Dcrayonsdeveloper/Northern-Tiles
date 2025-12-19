import DashboardLayout from '@/Layouts/DashboardLayout';
import { previewValue } from '@/Support/dictionary';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ locale }) {
    const { data, setData, post, processing, errors } = useForm({
        locale: locale ?? 'en',
        dkey: '',
        value_text: '',
        group: '',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.dictionary.store'));
    };

    const pv = previewValue(data.value_text);

    return (
        <DashboardLayout title="Add Dictionary Entry">
            <Head title="Add Dictionary Entry" />

            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Add Entry</div>
                <Link
                    href={route('admin.dictionary.index', { locale: data.locale })}
                    className="btn-secondary"
                >
                    Back
                </Link>
            </div>

            <div className="mt-4 max-w-4xl admin-card">
                <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Locale</label>
                        <input
                            value={data.locale}
                            onChange={(e) => setData('locale', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.locale ? <div className="mt-1 text-[12px] text-red-600">{errors.locale}</div> : null}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700">Group (optional)</label>
                        <input
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                            className="mt-1 admin-input"
                        />
                        {errors.group ? <div className="mt-1 text-[12px] text-red-600">{errors.group}</div> : null}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Key</label>
                        <input
                            value={data.dkey}
                            onChange={(e) => setData('dkey', e.target.value)}
                            className="mt-1 admin-input"
                            placeholder="auth.sign_in.title"
                        />
                        {errors.dkey ? <div className="mt-1 text-[12px] text-red-600">{errors.dkey}</div> : null}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Value</label>
                        <textarea
                            value={data.value_text}
                            onChange={(e) => setData('value_text', e.target.value)}
                            rows={6}
                            className="mt-1 admin-textarea"
                            placeholder="Welcome back, :name"
                        />
                        {errors.value_text ? (
                            <div className="mt-1 text-[12px] text-red-600">{errors.value_text}</div>
                        ) : null}

                        {pv.placeholders.length ? (
                            <div className="mt-2 text-[12px] text-gray-500">
                                Placeholders: {pv.placeholders.map((p) => `:${p}`).join(', ')}
                            </div>
                        ) : null}
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-3">
                        <input
                            id="is_active"
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="is_active" className="text-xs font-medium text-gray-700">
                            Active
                        </label>
                        {errors.is_active ? (
                            <div className="text-[12px] text-red-600">{errors.is_active}</div>
                        ) : null}
                    </div>

                    <div className="sm:col-span-2">
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
