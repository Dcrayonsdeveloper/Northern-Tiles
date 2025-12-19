import DashboardLayout from '@/Layouts/DashboardLayout';
import WidgetRenderer from '@/Components/Dashboard/WidgetRenderer';
import { useD } from '@/Support/dictionary';
import { Head, Link, router } from '@inertiajs/react';

const widthClass = {
    full: 'col-span-12',
    half: 'col-span-12 lg:col-span-6',
    third: 'col-span-12 md:col-span-6 lg:col-span-4',
};

export default function Dashboard({ widgets = [], range = '30d' }) {
    const d = useD();

    return (
        <DashboardLayout title="Admin Dashboard">
            <Head title="Admin Dashboard" />

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-gray-700">Dashboard</div>

                <div className="flex items-center gap-2">
                    <Link href={route('admin.dashboard.layout.edit')} className="btn-secondary">
                        Configure Widgets
                    </Link>

                    <select
                        value={range}
                        onChange={(e) =>
                            router.get(
                                route('admin.dashboard'),
                                { range: e.target.value },
                                { preserveScroll: true, preserveState: true, replace: true },
                            )
                        }
                        className="admin-select h-9"
                    >
                        <option value="today">Today</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
                {widgets.map((w) => (
                    <div key={w.widget_key} className={widthClass[w.width] ?? widthClass.full}>
                        <WidgetRenderer widget={w} title={d(w.title_key)} />
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}
