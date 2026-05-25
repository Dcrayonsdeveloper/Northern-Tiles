import DashboardLayout from '@/Layouts/DashboardLayout';
import WidgetRenderer from '@/Components/Dashboard/WidgetRenderer';
import { useD } from '@/Support/dictionary';
import { Head, Link, router } from '@inertiajs/react';

// ── Column width map ──────────────────────────────────────────────────────────

const widthClass = {
    full:  'col-span-12',
    half:  'col-span-12 sm:col-span-6',
    third: 'col-span-12 sm:col-span-6 lg:col-span-4',
};

// ── Range labels ──────────────────────────────────────────────────────────────

const RANGES = [
    { value: 'today', label: 'Today'    },
    { value: '7d',    label: '7 days'   },
    { value: '30d',   label: '30 days'  },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconWidgets(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard({ widgets = [], range = '30d' }) {
    const d = useD();

    const setRange = (r) => {
        if (r === range) return;
        router.get(
            route('admin.dashboard'),
            { range: r },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    return (
        <DashboardLayout title="Admin Dashboard">
            <Head title="Admin Dashboard" />

            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                        Overview
                    </p>
                    <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900">
                        Dashboard
                    </h1>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Segmented range picker */}
                    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                        {RANGES.map((r) => (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => setRange(r.value)}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                                    range === r.value
                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <Link
                        href={route('admin.dashboard.layout.edit')}
                        className="btn-secondary flex items-center gap-1.5 text-xs"
                    >
                        <IconWidgets className="h-3.5 w-3.5 shrink-0" />
                        Widgets
                    </Link>
                </div>
            </div>

            {/* ── Widget grid ───────────────────────────────────────────────── */}
            {widgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
                    <IconWidgets className="mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">No widgets configured</p>
                    <p className="mt-1 text-xs text-gray-400">
                        Add widgets to your dashboard layout to see data here.
                    </p>
                    <Link
                        href={route('admin.dashboard.layout.edit')}
                        className="btn-primary mt-5 text-xs"
                    >
                        Configure Widgets
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-5">
                    {widgets.map((w) => (
                        <div key={w.widget_key} className={widthClass[w.width] ?? widthClass.full}>
                            <WidgetRenderer widget={w} title={d(w.title_key)} />
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
