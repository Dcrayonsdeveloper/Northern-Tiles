import WidgetCard from '@/Components/Dashboard/WidgetCard';

function EmptyState({ children }) {
    return <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">{children}</div>;
}

function StatGrid({ items }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {items.map((it) => (
                <div key={it.label} className="rounded-md border border-gray-200 bg-white p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{it.label}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">{it.value}</div>
                </div>
            ))}
        </div>
    );
}

function SimpleTable({ columns, rows }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
                <thead className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                        {columns.map((c) => (
                            <th key={c.key} className="px-2 py-2 font-semibold">
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((r, idx) => (
                        <tr key={idx} className="text-gray-800">
                            {columns.map((c) => (
                                <td key={c.key} className="px-2 py-2">
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

export default function WidgetRenderer({ widget, title }) {
    const data = widget?.data ?? null;

    if (!widget) {
        return null;
    }

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
                            { label: 'Orders', value: data.orders_count ?? 0 },
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
                                { key: 'count', label: 'Count' },
                            ]}
                            rows={rows}
                        />
                    ) : (
                        <EmptyState>No rows.</EmptyState>
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
                                { key: 'seller_name', label: 'Seller' },
                                { key: 'revenue', label: 'Revenue' },
                                { key: 'qty', label: 'Qty' },
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
                                { key: 'name', label: 'Product' },
                                { key: 'revenue', label: 'Revenue' },
                                { key: 'qty', label: 'Qty' },
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
                                { key: 'name', label: 'Product' },
                                { key: 'stock', label: 'Stock' },
                            ]}
                            rows={rows}
                        />
                    ) : (
                        <EmptyState>All good. No low-stock products.</EmptyState>
                    )}
                </WidgetCard>
            );
        }

        case 'SystemHealth': {
            return (
                <WidgetCard title={cardTitle}>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2">
                            <div className="text-xs font-semibold text-gray-700">PHP</div>
                            <div className="text-xs text-gray-800">{data.php}</div>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2">
                            <div className="text-xs font-semibold text-gray-700">Laravel</div>
                            <div className="text-xs text-gray-800">{data.laravel}</div>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2">
                            <div className="text-xs font-semibold text-gray-700">Cache</div>
                            <div className="text-xs text-gray-800">{data.cache_driver}</div>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2">
                            <div className="text-xs font-semibold text-gray-700">DB</div>
                            <div className="text-xs text-gray-800">{data.db_connection}</div>
                        </div>
                    </div>
                </WidgetCard>
            );
        }

        case 'Announcements': {
            const items = data.items ?? [];

            return (
                <WidgetCard title={cardTitle}>
                    {items.length ? (
                        <div className="space-y-2">
                            {items.map((a) => (
                                <div key={a.id} className="rounded-md border border-gray-200 bg-white p-3">
                                    <div className="text-xs font-semibold text-gray-900">{a.title}</div>
                                    <div
                                        className="prose prose-sm mt-1 max-w-none text-xs text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: a.body_html }}
                                    />
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
                    <EmptyState>Unknown widget component: {widget.component}</EmptyState>
                </WidgetCard>
            );
    }
}
