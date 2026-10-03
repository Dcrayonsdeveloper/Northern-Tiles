import { useMemo, useState, useId } from 'react';

/**
 * Chart primitives for the admin dashboard.
 *
 * Hand-rolled SVG rather than a charting library: these are four simple forms,
 * and the production box runs on under 2 GB with a Vite build that already
 * needs swap to finish. A charting dependency would cost more than it saves.
 *
 * The trend chart puts revenue and orders on two y-scales in one frame, which
 * is a form to use knowingly — where the lines cross is an artefact of the
 * scales, not a fact about the data. Each axis is tinted to its series, both
 * are named in the legend, and the tooltip gives real values for both at the
 * hovered day, so nothing has to be inferred from the crossing point.
 *
 * Colours come from the validated data-viz palette. The admin is light-only —
 * there is no theme toggle anywhere in it — so this commits to the light
 * surface rather than shipping half a dark mode that nothing can select.
 */
export const VIZ = {
    series: '#2a78d6',      // categorical slot 1 / sequential blue 450
    seriesAlt: '#1baf7a',   // categorical slot 3 — 9.2 ΔE from slot 1 under CVD
    seriesSoft: '#cde2fb',  // blue 100, for area fills
    good: '#0ca30c',
    critical: '#d03b3b',
    grid: '#e1e0d9',
    axis: '#c3c2b7',
    muted: '#898781',
    ink: '#0b0b0b',
    inkSoft: '#52514e',
    upGood: '#006300',
};

export function formatMoney(value, currency = 'AUD') {
    const n = Number(value) || 0;

    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            maximumFractionDigits: n >= 1000 ? 0 : 2,
        }).format(n);
    } catch {
        // An unknown currency code should not take the dashboard down.
        return `${currency} ${n.toFixed(2)}`;
    }
}

export function formatNumber(value) {
    return new Intl.NumberFormat().format(Number(value) || 0);
}

/**
 * A headline number with its change against the previous period.
 *
 * The delta is null when the previous period was empty — going from nothing to
 * something is not a hundred per cent rise, and showing one makes a first sale
 * look like a trend. The arrow is paired with a sign and a worded period, so
 * direction never rests on colour alone.
 */
export function StatTile({ label, value, format, delta, hint, currency }) {
    const display = format === 'currency' ? formatMoney(value, currency) : formatNumber(value);
    const up = delta != null && delta > 0;
    const flat = delta != null && delta === 0;

    return (
        <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                {label}
            </span>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
                {display}
            </span>
            {delta != null ? (
                <span
                    className="text-[11px] font-medium"
                    style={{ color: flat ? VIZ.muted : up ? VIZ.upGood : VIZ.critical }}
                >
                    {up ? '▲' : flat ? '—' : '▼'} {Math.abs(delta)}%
                    <span className="ml-1 text-gray-400">vs previous period</span>
                </span>
            ) : (
                <span className="text-[11px] text-gray-400">{hint ?? 'No prior period to compare'}</span>
            )}
        </div>
    );
}

/**
 * Revenue and orders in one frame, each on its own axis.
 *
 * Two y-scales in one plot is a chart form to use knowingly: where the two
 * lines cross is an artefact of the scales, not a fact about the data. The
 * mitigations are that each axis is labelled with the series it belongs to and
 * tinted to match it, both lines are named in the legend, and the tooltip
 * reports real values for both at the hovered day — so the numbers are always
 * readable without inferring anything from the crossing point.
 */
export function DualLineChart({ points, currency, height = 230 }) {
    const gradientId = `dual${useId().replace(/:/g, '')}`;
    const [hover, setHover] = useState(null);

    const geom = useMemo(() => {
        const pad = { top: 16, right: 46, bottom: 24, left: 52 };
        const width = 720;
        const inner = { w: width - pad.left - pad.right, h: height - pad.top - pad.bottom };

        const maxRevenue = Math.max(...points.map(p => Number(p.revenue) || 0), 0) || 1;
        const maxOrders = Math.max(...points.map(p => Number(p.orders) || 0), 0) || 1;

        const x = (i) => points.length === 1
            ? pad.left + inner.w / 2
            : pad.left + (i / (points.length - 1)) * inner.w;
        const y = (v, max) => pad.top + inner.h - (v / max) * inner.h;

        const build = (key, max) => points.map((p, i) => ({
            x: x(i), y: y(Number(p[key]) || 0, max), p, i,
        }));

        const revenue = build('revenue', maxRevenue);
        const orders = build('orders', maxOrders);
        const path = (cs) => cs.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

        return {
            pad, width, inner, maxRevenue, maxOrders, revenue, orders,
            revenuePath: path(revenue),
            ordersPath: path(orders),
            revenueArea: revenue.length
                ? `${path(revenue)} L${revenue[revenue.length - 1].x.toFixed(1)},${(pad.top + inner.h).toFixed(1)} L${revenue[0].x.toFixed(1)},${(pad.top + inner.h).toFixed(1)} Z`
                : '',
        };
    }, [points, height]);

    if (!points.length) return null;

    const labelEvery = Math.max(1, Math.ceil(points.length / 7));
    const ticks = [0, 0.5, 1];

    const onMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * geom.width;
        let best = 0;
        geom.revenue.forEach((c, i) => {
            if (Math.abs(c.x - svgX) < Math.abs(geom.revenue[best].x - svgX)) best = i;
        });
        setHover(best);
    };

    const h = hover != null ? points[hover] : null;

    return (
        <div className="relative">
            <div className="mb-1 flex items-center justify-end gap-4">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: VIZ.series }} />
                    Revenue
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: VIZ.seriesAlt }} />
                    Orders
                </span>
            </div>

            <svg
                viewBox={`0 0 ${geom.width} ${height}`} className="w-full" style={{ height }}
                onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={VIZ.series} stopOpacity="0.16" />
                        <stop offset="100%" stopColor={VIZ.series} stopOpacity="0.01" />
                    </linearGradient>
                </defs>

                {ticks.map((t, i) => {
                    const yy = geom.pad.top + geom.inner.h - t * geom.inner.h;
                    return (
                        <g key={i}>
                            <line
                                x1={geom.pad.left} y1={yy} x2={geom.width - geom.pad.right} y2={yy}
                                stroke={t === 0 ? VIZ.axis : VIZ.grid} strokeWidth="1"
                            />
                            {/* Each axis is tinted to its series, so there is no
                                guessing which scale a line is drawn against. */}
                            <text x={geom.pad.left - 8} y={yy + 3} textAnchor="end" className="tabular-nums" fontSize="9" fill={VIZ.series}>
                                {formatAxisMoney(geom.maxRevenue * t, currency)}
                            </text>
                            <text x={geom.width - geom.pad.right + 8} y={yy + 3} textAnchor="start" className="tabular-nums" fontSize="9" fill={VIZ.seriesAlt}>
                                {Math.round(geom.maxOrders * t)}
                            </text>
                        </g>
                    );
                })}

                <path d={geom.revenueArea} fill={`url(#${gradientId})`} />
                <path d={geom.revenuePath} fill="none" stroke={VIZ.series} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <path d={geom.ordersPath} fill="none" stroke={VIZ.seriesAlt} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                {points.length === 1 && (
                    <>
                        <circle cx={geom.revenue[0].x} cy={geom.revenue[0].y} r="4" fill={VIZ.series} />
                        <circle cx={geom.orders[0].x} cy={geom.orders[0].y} r="4" fill={VIZ.seriesAlt} />
                    </>
                )}

                {points.map((p, i) => i % labelEvery === 0 && (
                    <text key={p.date} x={geom.revenue[i].x} y={height - 6} textAnchor="middle" fontSize="9" fill={VIZ.muted}>
                        {p.label}
                    </text>
                ))}

                {hover != null && (
                    <g>
                        <line
                            x1={geom.revenue[hover].x} y1={geom.pad.top}
                            x2={geom.revenue[hover].x} y2={geom.pad.top + geom.inner.h}
                            stroke={VIZ.axis} strokeWidth="1"
                        />
                        <circle cx={geom.revenue[hover].x} cy={geom.revenue[hover].y} r="5" fill={VIZ.series} stroke="#fff" strokeWidth="2" />
                        <circle cx={geom.orders[hover].x} cy={geom.orders[hover].y} r="5" fill={VIZ.seriesAlt} stroke="#fff" strokeWidth="2" />
                    </g>
                )}
            </svg>

            {h && (
                <div
                    className="pointer-events-none absolute top-6 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm"
                    style={{ left: `${Math.min(Math.max((geom.revenue[hover].x / geom.width) * 100, 12), 88)}%` }}
                >
                    <div className="mb-1 text-[10px] text-gray-400">{h.label}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: VIZ.series }} />
                        Revenue
                        <span className="ml-auto pl-3 font-semibold tabular-nums">{formatMoney(h.revenue, currency)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: VIZ.seriesAlt }} />
                        Orders
                        <span className="ml-auto pl-3 font-semibold tabular-nums">{formatNumber(h.orders)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatAxisMoney(value, currency) {
    const n = Number(value) || 0;
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return formatMoney(n, currency).replace(/\.00$/, '');
}

/**
 * Part-to-whole ring for order status.
 *
 * The colours are the validated categorical order, assigned to statuses in a
 * fixed pipeline sequence — not chosen for what each status "should" look like.
 * Every semantically obvious mapping was tested and failed: cancelled-red
 * against delivered-green measures 3.2 ΔE under protanopia, and red against
 * refunded-orange 7.1 even in full colour. Identity comes from the legend,
 * which names each status with its count and share, so the ring is the shape
 * of the split and never the only way to read it.
 */
const STATUS_RING_ORDER = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const STATUS_RING_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'];

export function StatusDonut({ rows, total }) {
    const [hover, setHover] = useState(null);

    const segments = useMemo(() => {
        const ordered = [...rows].sort(
            (a, b) => STATUS_RING_ORDER.indexOf(a.status) - STATUS_RING_ORDER.indexOf(b.status),
        );

        const sum = ordered.reduce((acc, r) => acc + r.count, 0) || 1;
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        let offset = 0;

        return ordered.map((r) => {
            // Colour follows the status, never its rank — a filter that drops
            // one status must not repaint the others.
            const idx = STATUS_RING_ORDER.indexOf(r.status);
            const share = r.count / sum;
            // A 2px gap between segments, so neighbouring arcs stay separate
            // marks rather than fusing into one band.
            const length = Math.max(share * circumference - 2, 0.5);
            const seg = {
                ...r,
                color: STATUS_RING_COLORS[idx >= 0 ? idx : 0],
                dash: `${length.toFixed(2)} ${(circumference - length).toFixed(2)}`,
                offset: -offset,
                radius,
            };
            offset += share * circumference;
            return seg;
        });
    }, [rows]);

    if (!segments.length) return null;

    const active = hover != null ? segments[hover] : null;

    return (
        <div className="flex flex-col items-center gap-4">
            <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label="Orders by status">
                <g transform="rotate(-90 70 70)">
                    {segments.map((s, i) => (
                        <circle
                            key={s.status}
                            cx="70" cy="70" r={s.radius}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={hover === i ? 20 : 16}
                            strokeDasharray={s.dash}
                            strokeDashoffset={s.offset}
                            className="cursor-pointer transition-[stroke-width] duration-150"
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(null)}
                        />
                    ))}
                </g>
                <text x="70" y="66" textAnchor="middle" fontSize="20" fontWeight="700" fill={VIZ.ink}>
                    {formatNumber(active ? active.count : total)}
                </text>
                <text x="70" y="82" textAnchor="middle" fontSize="9" fill={VIZ.muted}>
                    {active ? active.status : 'orders'}
                </text>
            </svg>

            <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-1.5">
                {segments.map((s, i) => (
                    <li
                        key={s.status}
                        className="flex items-center gap-1.5 text-[11px]"
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                    >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="truncate capitalize text-gray-600">{s.status}</span>
                        <span className="ml-auto shrink-0 font-semibold tabular-nums text-gray-900">{s.count}</span>
                        <span className="w-9 shrink-0 text-right tabular-nums text-gray-400">{s.percent}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * A ratio against its whole, on a single-hue track.
 *
 * Tone is meaning, not decoration: only the cancellation meter is painted
 * critical, because it is the only one where a bigger number is worse. The
 * figure and its wording carry the value regardless.
 */
export function Meter({ label, percent, detail, tone }) {
    const color = tone === 'good' ? VIZ.good : tone === 'critical' ? VIZ.critical : VIZ.series;
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const filled = Math.min(Math.max(percent, 0), 100) / 100;

    return (
        <div className="flex items-center gap-3">
            <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" role="img" aria-label={`${label}: ${percent}%`}>
                <circle cx="24" cy="24" r={radius} fill="none" stroke={VIZ.grid} strokeWidth="4" />
                <circle
                    cx="24" cy="24" r={radius} fill="none"
                    stroke={color} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(filled * circumference).toFixed(2)} ${circumference.toFixed(2)}`}
                    transform="rotate(-90 24 24)"
                />
                <text
                    x="24" y="27" textAnchor="middle"
                    fontSize="11" fontWeight="700" fill={VIZ.ink}
                >
                    {Math.round(percent)}%
                </text>
            </svg>
            <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-800">{label}</div>
                <div className="text-[11px] text-gray-500">{detail}</div>
            </div>
        </div>
    );
}
