import DashboardLayout from '@/Layouts/DashboardLayout';
import { previewValue } from '@/Support/dictionary';
import { Head, Link, router, useForm } from '@inertiajs/react';

function qs(filters, next) {
    return {
        ...filters,
        ...next,
    };
}

export default function Index({ items, filters, groups, locales }) {
    const { data, setData, post, processing } = useForm({
        locale: filters?.locale ?? 'en',
        json: '',
    });

    const applyFilters = (next) => {
        router.get(route('admin.dictionary.index'), qs(filters, next), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const toggleActive = (entry) => {
        router.put(
            route('admin.dictionary.update', entry.id),
            {
                locale: entry.locale,
                dkey: entry.dkey,
                value_text: entry.value_text,
                group: entry.group,
                is_active: !entry.is_active,
            },
            { preserveScroll: true },
        );
    };

    const destroy = (entry) => {
        if (!confirm(`Delete key "${entry.dkey}"?`)) return;
        router.delete(route('admin.dictionary.destroy', entry.id), { preserveScroll: true });
    };

    const doImport = (e) => {
        e.preventDefault();
        post(route('admin.dictionary.import'), {
            preserveScroll: true,
            onSuccess: () => setData('json', ''),
        });
    };

    return (
        <DashboardLayout title="Dictionary">
            <Head title="Dictionary" />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="text-sm font-semibold text-gray-900">Dictionary</div>
                    <div className="mt-1 text-xs text-gray-600">
                        Manage UI text by key and locale.
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('admin.dictionary.create', { locale: filters?.locale ?? 'en' })}
                        className="btn-primary"
                    >
                        Add Entry
                    </Link>
                    <a
                        href={route('admin.dictionary.export', { locale: filters?.locale ?? 'en' })}
                        className="btn-secondary"
                    >
                        Export JSON
                    </a>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="admin-card lg:col-span-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Locale</label>
                            <select
                                value={filters?.locale ?? 'en'}
                                onChange={(e) => applyFilters({ locale: e.target.value, page: 1 })}
                                className="mt-1 admin-select"
                            >
                                {(locales?.length ? locales : ['en']).map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">Group</label>
                            <select
                                value={filters?.group ?? ''}
                                onChange={(e) => applyFilters({ group: e.target.value || null, page: 1 })}
                                className="mt-1 admin-select"
                            >
                                <option value="">All</option>
                                {groups?.map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">Search</label>
                            <input
                                defaultValue={filters?.q ?? ''}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        applyFilters({ q: e.currentTarget.value || null, page: 1 });
                                    }
                                }}
                                className="mt-1 admin-input"
                                placeholder="Search key or value..."
                            />
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Key</th>
                                    <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Value</th>
                                    <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Group</th>
                                    <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Active</th>
                                    <th className="px-4 py-3 text-[12px] font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items?.data?.length ? (
                                    items.data.map((e) => {
                                        const pv = previewValue(e.value_text);
                                        return (
                                            <tr key={e.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-2 text-xs font-medium text-gray-900">
                                                    {e.dkey}
                                                    <div className="text-[12px] text-gray-500">{e.locale}</div>
                                                </td>
                                                <td className="px-4 py-2 text-xs text-gray-700">
                                                    <div className="line-clamp-2">{e.value_text}</div>
                                                    {pv.placeholders.length ? (
                                                        <div className="mt-1 text-[12px] text-gray-500">
                                                            Placeholders: {pv.placeholders.join(', ')}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-2 text-xs text-gray-600">
                                                    {e.group ?? '-'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(e)}
                                                        className={
                                                            (e.is_active
                                                                ? 'bg-brand/10 text-brand'
                                                                : 'bg-gray-100 text-gray-700') +
                                                            ' rounded-full px-2 py-1 text-[11px] font-semibold'
                                                        }
                                                    >
                                                        {e.is_active ? 'On' : 'Off'}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={route('admin.dictionary.edit', e.id)}
                                                            className="btn-secondary"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => destroy(e)}
                                                            className="btn-secondary text-red-600 hover:bg-red-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td className="px-4 py-6 text-xs text-gray-600" colSpan={5}>
                                            No entries.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {items?.links?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {items.links.map((l, idx) => (
                                <Link
                                    key={idx}
                                    href={l.url ?? '#'}
                                    preserveScroll
                                    className={
                                        (l.active
                                            ? 'bg-brand text-white border-brand'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-brand/10 hover:text-brand') +
                                        ' rounded-md border px-2.5 py-1.5 text-xs font-medium' +
                                        (!l.url ? ' pointer-events-none opacity-50' : '')
                                    }
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="admin-card">
                    <div className="text-sm font-semibold text-gray-900">Import JSON</div>
                    <div className="mt-1 text-xs text-gray-600">
                        Import one locale at a time.
                    </div>

                    <form onSubmit={doImport} className="mt-4 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Locale</label>
                            <input
                                value={data.locale}
                                onChange={(e) => setData('locale', e.target.value)}
                                className="mt-1 admin-input"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700">JSON</label>
                            <textarea
                                value={data.json}
                                onChange={(e) => setData('json', e.target.value)}
                                rows={12}
                                className="mt-1 admin-textarea"
                                placeholder='[{"dkey":"auth.sign_in.title","value_text":"Sign in","group":"auth","is_active":true}]'
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary w-full"
                        >
                            Import
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
