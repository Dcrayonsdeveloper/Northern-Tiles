import DashboardLayout from '@/Layouts/DashboardLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function MenuEditor({ title, value = [], onChange, errors = {} }) {
    const items = value ?? [];

    const updateItem = (idx, patch) => {
        const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
        onChange(next);
    };

    const addItem = () => {
        onChange([
            ...items,
            {
                label: '',
                url: '',
                target: '_self',
                is_active: true,
                sort: (items.length + 1) * 10,
            },
        ]);
    };

    const removeItem = (idx) => {
        onChange(items.filter((_, i) => i !== idx));
    };

    const moveItem = (idx, dir) => {
        const next = [...items];
        const to = idx + dir;
        if (to < 0 || to >= next.length) return;
        const tmp = next[idx];
        next[idx] = next[to];
        next[to] = tmp;
        onChange(next);
    };

    return (
        <div className="admin-card">
            <div className="text-sm font-semibold text-gray-900">{title}</div>
            <div className="mt-1 text-xs text-gray-600">Add, remove, and reorder menu items.</div>

            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500">
                        <tr>
                            <th className="px-2 py-2 font-semibold">Label</th>
                            <th className="px-2 py-2 font-semibold">URL</th>
                            <th className="px-2 py-2 font-semibold">Target</th>
                            <th className="px-2 py-2 font-semibold">Active</th>
                            <th className="px-2 py-2 font-semibold">Sort</th>
                            <th className="px-2 py-2 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((it, idx) => (
                            <tr key={idx}>
                                <td className="px-2 py-2">
                                    <input
                                        className="admin-input h-9"
                                        value={it.label ?? ''}
                                        onChange={(e) => updateItem(idx, { label: e.target.value })}
                                    />
                                    <InputError message={errors?.[idx]?.label} />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        className="admin-input h-9"
                                        value={it.url ?? ''}
                                        onChange={(e) => updateItem(idx, { url: e.target.value })}
                                    />
                                    <InputError message={errors?.[idx]?.url} />
                                </td>
                                <td className="px-2 py-2">
                                    <select
                                        className="admin-select h-9"
                                        value={it.target ?? '_self'}
                                        onChange={(e) => updateItem(idx, { target: e.target.value })}
                                    >
                                        <option value="_self">_self</option>
                                        <option value="_blank">_blank</option>
                                    </select>
                                    <InputError message={errors?.[idx]?.target} />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(it.is_active ?? true)}
                                        onChange={(e) => updateItem(idx, { is_active: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="number"
                                        className="admin-input h-9"
                                        value={it.sort ?? 0}
                                        onChange={(e) => updateItem(idx, { sort: Number(e.target.value || 0) })}
                                    />
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button type="button" className="btn-secondary" onClick={() => moveItem(idx, -1)}>
                                            Up
                                        </button>
                                        <button type="button" className="btn-secondary" onClick={() => moveItem(idx, 1)}>
                                            Down
                                        </button>
                                        <button type="button" className="btn-danger" onClick={() => removeItem(idx)}>
                                            Remove
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-3">
                <button type="button" className="btn-primary" onClick={addItem}>
                    Add item
                </button>
            </div>
        </div>
    );
}

export default function Configuration({ config }) {
    const [tab, setTab] = useState('site');

    const initial = useMemo(() => {
        const site = config?.site ?? {};
        const social = config?.social ?? {};
        const menus = config?.menus ?? {};

        return {
            site_title: site.title ?? '',
            site_description: site.description ?? '',

            twitter_site: social.twitter_site ?? '',
            twitter_creator: social.twitter_creator ?? '',

            og_image: null,
            remove_og_image: false,

            menu_header_top: menus.header_top?.items ?? [],
            menu_header_main: menus.header_main?.items ?? [],
            menu_footer: menus.footer?.items ?? [],
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

    const menuErrors = (prefix) => {
        const out = {};
        Object.entries(form.errors || {}).forEach(([k, v]) => {
            if (!k.startsWith(prefix + '.')) return;
            const rest = k.slice(prefix.length + 1);
            const m = rest.match(/^(\d+)\.(.+)$/);
            if (!m) return;
            const idx = Number(m[1]);
            const field = m[2];
            out[idx] = out[idx] || {};
            out[idx][field] = v;
        });
        return out;
    };

    return (
        <DashboardLayout title="Configuration">
            <Head title="Configuration" />

            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-gray-700">Configuration</div>
                <button type="button" className="btn-primary" onClick={submit} disabled={form.processing}>
                    Save
                </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="admin-card">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={(tab === 'site' ? 'btn-primary' : 'btn-secondary')}
                            onClick={() => setTab('site')}
                        >
                            Site
                        </button>
                        <button
                            type="button"
                            className={(tab === 'social' ? 'btn-primary' : 'btn-secondary')}
                            onClick={() => setTab('social')}
                        >
                            Social
                        </button>
                        <button
                            type="button"
                            className={(tab === 'menus' ? 'btn-primary' : 'btn-secondary')}
                            onClick={() => setTab('menus')}
                        >
                            Menus
                        </button>
                    </div>
                </div>

                {tab === 'site' ? (
                    <div className="admin-card space-y-4">
                        <div>
                            <InputLabel value="Site Title" />
                            <input
                                className="admin-input"
                                value={form.data.site_title}
                                onChange={(e) => form.setData('site_title', e.target.value)}
                            />
                            <InputError message={form.errors.site_title} />
                        </div>

                        <div>
                            <InputLabel value="Site Description" />
                            <textarea
                                className="admin-textarea"
                                rows={4}
                                value={form.data.site_description}
                                onChange={(e) => form.setData('site_description', e.target.value)}
                            />
                            <InputError message={form.errors.site_description} />
                        </div>
                    </div>
                ) : null}

                {tab === 'social' ? (
                    <div className="admin-card space-y-4">
                        <div>
                            <InputLabel value="Default OG Image" />
                            {config?.social?.og_image_url ? (
                                <div className="mt-2 flex items-center gap-3">
                                    <img
                                        src={config.social.og_image_url}
                                        alt="OG"
                                        className="h-12 w-20 rounded border object-cover"
                                    />
                                    <button
                                        type="button"
                                        className="btn-danger"
                                        onClick={() => {
                                            form.setData('remove_og_image', true);
                                            form.setData('og_image', null);
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : null}

                            <input
                                type="file"
                                accept="image/*"
                                className="mt-2 block w-full text-xs"
                                onChange={(e) => {
                                    const f = e.target.files?.[0] || null;
                                    form.setData('og_image', f);
                                    if (f) form.setData('remove_og_image', false);
                                }}
                            />

                            <InputError message={form.errors.og_image} />
                            <InputError message={form.errors.remove_og_image} />
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <InputLabel value="Twitter site handle" />
                                <input
                                    className="admin-input"
                                    value={form.data.twitter_site}
                                    onChange={(e) => form.setData('twitter_site', e.target.value)}
                                    placeholder="@brand"
                                />
                                <InputError message={form.errors.twitter_site} />
                            </div>

                            <div>
                                <InputLabel value="Twitter creator handle" />
                                <input
                                    className="admin-input"
                                    value={form.data.twitter_creator}
                                    onChange={(e) => form.setData('twitter_creator', e.target.value)}
                                    placeholder="@founder"
                                />
                                <InputError message={form.errors.twitter_creator} />
                            </div>
                        </div>

                        <div className="text-xs text-gray-500">Twitter card type: summary_large_image</div>
                    </div>
                ) : null}

                {tab === 'menus' ? (
                    <div className="space-y-4">
                        <MenuEditor
                            title="Header Top Navigation"
                            value={form.data.menu_header_top}
                            onChange={(v) => form.setData('menu_header_top', v)}
                            errors={menuErrors('menu_header_top')}
                        />
                        <MenuEditor
                            title="Header Main Navigation"
                            value={form.data.menu_header_main}
                            onChange={(v) => form.setData('menu_header_main', v)}
                            errors={menuErrors('menu_header_main')}
                        />
                        <MenuEditor
                            title="Footer Navigation"
                            value={form.data.menu_footer}
                            onChange={(v) => form.setData('menu_footer', v)}
                            errors={menuErrors('menu_footer')}
                        />
                    </div>
                ) : null}

                <div className="flex items-center justify-end gap-2">
                    <button type="submit" className="btn-primary" disabled={form.processing}>
                        Save
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
