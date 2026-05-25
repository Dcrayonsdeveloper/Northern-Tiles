import WidgetCard from '@/Components/Dashboard/WidgetCard';

// ── Shared helpers ────────────────────────────────────────────────────────────

function EmptyState({ children }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                >
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                    <line x1="9" y1="16" x2="12" y2="16" />
                </svg>
            </div>
            <p className="text-xs text-gray-400">{children}</p>
        </div>
    );
}

function StatGrid({ items }) {
    return (
        <div className="grid grid-cols-2 divide-x divide-gray-100">
            {items.map((it, i) => (
                <div key={it.label} className={`flex flex-col gap-1 px-4 py-3 ${i >= 2 ? 'border-t border-gray-100' : ''}`}>
                    <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                        {it.label}
                    </span>
                    <span className="text-2xl font-bold tabular-nums text-gray-900">
                        {it.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

function SimpleTable({ columns, rows }) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="min-w-full text-left">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                        {columns.map((c) => (
                            <th
                                key={c.key}
                                className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"
                            >
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                    {rows.map((r, idx) => (
                        <tr
                            key={idx}
                            className="transition-colors duration-100 hover:bg-gray-50/80"
                        >
                            {columns.map((c, ci) => (
                                <td
                                    key={c.key}
                                    className={`px-3 py-2.5 text-xs ${ci === 0 ? 'font-medium text-gray-800' : 'tabular-nums text-gray-500'}`}
                                >
                                    {r[c.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Widget renderer ───────────────────────────────────────────────────────────

export default function WidgetRenderer({ widget, title }) {
    const data = widget?.data ?? null;

    if (!widget) return null;

    const cardTitle = title ?? widget.widget_key;

    if (!data) {
        return (
            <WidgetCard title={cardTitle}>
                <EmptyState>Widget disabled or no data.</EmptyState>
            </WidgetCard>
        );
    }

    switch (widget.component) {

        case 'RevenueOverview':
        case 'SalesKpi': {
            return (
                <WidgetCard title={cardTitle}>
                    <StatGrid
                        items={[
                            { label: 'Orders',  value: data.orders_count  ?? 0 },
                            { label: 'Revenue', value: data.revenue_total ?? 0 },
                        ]}
                    />
                </WidgetCard>
            );
        }

        case 'OrdersByStatus':
        case 'OrdersSummary': {
            const rows = data.rows ?? [];
            return (
                <WidgetCard title={cardTitle}>
                    {rows.length ? (
                        <SimpleTable
                            columns={[
                                { key: 'status', label: 'Status' },
                                { key: 'count',  label: 'Count'  },
                            ]}
                            rows={rows}
                        />
                    ) : (
                        <EmptyState>No orders yet.</EmptyState>
                    )}
                </WidgetCard>
            );
        }

        case 'TopSellers': {
            const rows = data.rows ?? [];
            return (
                <WidgetCard title={cardTitle}>
                    {rows.length ? (
                        <SimpleTable
                            columns={[
                                { key: 'seller_name', label: 'Seller'  },
                                { key: 'revenue',     label: 'Revenue' },
                                { key: 'qty',         label: 'Qty'     },
                            ]}
                            rows={rows}
                        />
                    ) : (
                        <EmptyState>No sellers yet.</EmptyState>
                    )}
                </WidgetCard>
            );
        }

        case 'TopProducts': {
            const rows = data.rows ?? [];
            return (
                <WidgetCard title={cardTitle}>
                    {rows.length ? (
                        <SimpleTable
                            columns={[
                                { key: 'name',    label: 'Product' },
                                { key: 'revenue', label: 'Revenue' },
                                { key: 'qty',     label: 'Qty'     },
                            ]}
                            rows={rows}
                        />
                    ) : (
                        <EmptyState>No sales yet.</EmptyState>
                    )}
                </WidgetCard>
            );
        }

        case 'LowStock': {
            const rows = data.rows ?? [];
            return (
                <WidgetCard title={cardTitle}>
                    {rows.length ? (
                        <SimpleTable
                            columns={[
                                { key: 'name',  label: 'Product' },
                                { key: 'stock', label: 'Stock'   },
                            ]}
                            rows={rows}
                        />
                    ) : (
                        <EmptyState>All good — no low-stock products.</EmptyState>
                    )}
                </WidgetCard>
            );
        }

        case 'SystemHealth': {
            const checks = [
                { label: 'PHP',      value: data.php           },
                { label: 'Laravel',  value: data.laravel       },
                { label: 'Cache',    value: data.cache_driver  },
                { label: 'Database', value: data.db_connection },
            ];
            return (
                <WidgetCard title={cardTitle}>
                    <div className="space-y-1.5">
                        {checks.map(({ label, value }) => (
                            <div
                                key={label}
                                className="flex items-center justify-between rounded-lg px-3 py-2.5 odd:bg-gray-50"
                            >
                                <span className="text-xs font-medium text-gray-500">{label}</span>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </WidgetCard>
            );
        }

        case 'Announcements': {
            const items = data.items ?? [];
            return (
                <WidgetCard title={cardTitle}>
                    {items.length ? (
                        <div className="space-y-2.5">
                            {items.map((a) => (
                                <div
                                    key={a.id}
                                    className="overflow-hidden rounded-lg border border-gray-100"
                                >
                                    <div className="flex">
                                        <div className="w-1 shrink-0 bg-brand/40" />
                                        <div className="flex-1 p-3">
                                            <div className="text-xs font-semibold text-gray-900">
                                                {a.title}
                                            </div>
                                            <div
                                                className="prose prose-sm mt-1.5 max-w-none text-xs leading-relaxed text-gray-500"
                                                dangerouslySetInnerHTML={{ __html: a.body_html }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState>No announcements.</EmptyState>
                    )}
                </WidgetCard>
            );
        }

        default:
            return (
                <WidgetCard title={cardTitle}>
                    <EmptyState>Unknown widget: {widget.component}</EmptyState>
                </WidgetCard>
            );
    }
}
