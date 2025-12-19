import DashboardLayout from '@/Layouts/DashboardLayout';
import { useD } from '@/Support/dictionary';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function normalizeItems(availableWidgets, layout) {
    const layoutMap = new Map((layout ?? []).map((l) => [l.widget_key, l]));

    return (availableWidgets ?? [])
        .map((w) => {
            const o = layoutMap.get(w.widget_key) ?? {};

            return {
                widget_key: w.widget_key,
                title_key: w.title_key,
                supports_date_range: !!w.supports_date_range,
                enabled: o.enabled ?? w.default_enabled ?? true,
                sort: o.sort ?? w.default_sort ?? 100,
                width: o.width ?? 'full',
                range: o.range ?? '30d',
                cache_ttl_seconds: o.cache_ttl_seconds ?? w.cache_ttl_seconds ?? 300,
            };
        })
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

function resequence(items) {
    return items.map((it, idx) => ({ ...it, sort: (idx + 1) * 10 }));
}

export default function DashboardLayoutEditor({ availableWidgets = [], layout = [] }) {
    const d = useD();

    const initialItems = useMemo(
        () => resequence(normalizeItems(availableWidgets, layout)),
        [availableWidgets, layout],
    );

    const [items, setItems] = useState(initialItems);

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const form = useForm({
        layout: items,
    });

    useEffect(() => {
        form.setData('layout', items);
    }, [items]);

    const move = (idx, dir) => {
        const next = [...items];
        const swap = idx + dir;
        if (swap < 0 || swap >= next.length) return;
        const tmp = next[idx];
        next[idx] = next[swap];
        next[swap] = tmp;
        setItems(resequence(next));
    };

    const updateItem = (idx, patch) => {
        const next = [...items];
        next[idx] = { ...next[idx], ...patch };
        setItems(next);
    };

    return (
        <DashboardLayout title="Seller Layout">
            <Head title="Seller Layout" />

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-gray-700">Layout</div>

                <div className="flex items-center gap-2">
                    <Link href={route('seller.dashboard')} className="btn-secondary">
                        View Dashboard
                    </Link>
                    <button
                        type="button"
                        className="btn-primary"
                        disabled={form.processing}
                        onClick={() => {
                            form.put(route('seller.dashboard.layout.update'), {
                                preserveScroll: true,
                            });
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                        <thead className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-2 py-2 font-semibold">#</th>
                                <th className="px-2 py-2 font-semibold">Widget</th>
                                <th className="px-2 py-2 font-semibold">Enabled</th>
                                <th className="px-2 py-2 font-semibold">Width</th>
                                <th className="px-2 py-2 font-semibold">Range</th>
                                <th className="px-2 py-2 font-semibold">TTL</th>
                                <th className="px-2 py-2 font-semibold">Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((it, idx) => (
                                <tr key={it.widget_key}>
                                    <td className="px-2 py-2 text-gray-500">{it.sort}</td>
                                    <td className="px-2 py-2 font-semibold text-gray-900">{d(it.title_key)}</td>
                                    <td className="px-2 py-2">
                                        <input
                                            type="checkbox"
                                            checked={!!it.enabled}
                                            onChange={(e) => updateItem(idx, { enabled: e.target.checked })}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <select
                                            value={it.width}
                                            onChange={(e) => updateItem(idx, { width: e.target.value })}
                                            className="admin-select h-9"
                                        >
                                            <option value="full">Full</option>
                                            <option value="half">Half</option>
                                            <option value="third">Third</option>
                                        </select>
                                    </td>
                                    <td className="px-2 py-2">
                                        {it.supports_date_range ? (
                                            <select
                                                value={it.range}
                                                onChange={(e) => updateItem(idx, { range: e.target.value })}
                                                className="admin-select h-9"
                                            >
                                                <option value="today">Today</option>
                                                <option value="7d">7d</option>
                                                <option value="30d">30d</option>
                                            </select>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            value={it.cache_ttl_seconds}
                                            min={30}
                                            max={86400}
                                            onChange={(e) => updateItem(idx, { cache_ttl_seconds: Number(e.target.value || 0) })}
                                            className="admin-input h-9"
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <div className="flex items-center gap-2">
                                            <button type="button" className="btn-secondary" onClick={() => move(idx, -1)}>
                                                Up
                                            </button>
                                            <button type="button" className="btn-secondary" onClick={() => move(idx, 1)}>
                                                Down
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
