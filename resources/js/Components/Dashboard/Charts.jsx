import { useMemo, useState, useId } from 'react';

/**
 * Chart primitives for the admin dashboard.
 *
 * Hand-rolled SVG rather than a charting library: these are four simple forms,
 * and the production box runs on under 2 GB with a Vite build that already
 * needs swap to finish. A charting dependency would cost more than it saves.
 *
 * Colours come from the validated data-viz palette. The admin is light-only —
 * there is no theme toggle anywhere in it — so this commits to the light
 * surface rather than shipping half a dark mode that nothing can select.
 */
export const VIZ = {
    series: '#2a78d6',      // categorical slot 1 / sequential blue 450
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
 * Single-series line with an area wash, a hover crosshair and a tooltip.
 *
 * One series, one axis. Revenue and order counts are charted as separate
 * frames rather than two lines on two scales: a dual axis lets any two series
 * cross wherever the scales happen to put them, which is the fastest way to
 * invent a correlation that is not in the data.
 */
export function LineChart({ points, valueKey, labelKey = 'label', format, currency, height = 170 }) {
    // React's useId returns ids shaped like ":r0:", and a colon is not valid
    // inside a url(#...) reference — the gradient silently fails to resolve and
    // the area fill renders as nothing.
    const gradientId = `grad${useId().replace(/:/g, '')}`;
    const [hover, setHover] = useState(null);

    const geom = useMemo(() => {
        const pad = { top: 12, right: 10, bottom: 22, left: 46 };
        const width = 560;
        const inner = { w: width - pad.left - pad.right, h: height - pad.top - pad.bottom };

        const values = points.map(p => Number(p[valueKey]) || 0);
        const rawMax = Math.max(...values, 0);
        // A flat-zero series still needs a scale, or every point lands on the
        // baseline and the axis reads 0, 0, 0.
        const max = rawMax > 0 ? rawMax : 1;

        const x = (i) => points.length === 1
            ? pad.left + inner.w / 2
            : pad.left + (i / (points.length - 1)) * inner.w;
        const y = (v) => pad.top + inner.h - (v / max) * inner.h;

        const coords = points.map((p, i) => ({ x: x(i), y: y(Number(p[valueKey]) || 0), p, i }));
        const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
        const area = coords.length
            ? `${line} L${coords[coords.length - 1].x.toFixed(1)},${(pad.top + inner.h).toFixed(1)} L${coords[0].x.toFixed(1)},${(pad.top + inner.h).toFixed(1)} Z`
            : '';

        return { pad, width, inner, max, coords, line, area };
    }, [points, valueKey, height]);

    if (!points.length) return null;

    const fmt = (v) => (format === 'currency' ? formatMoney(v, currency) : formatNumber(v));
    const ticks = [0, 0.5, 1].map(t => geom.max * t);

    // Only a few x labels: one per day over 30 days collides into a smear.
    const labelEvery = Math.max(1, Math.ceil(points.length / 6));

    const onMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * geom.width;
        let best = geom.coords[0];
        for (const c of geom.coords) {
            if (Math.abs(c.x - svgX) < Math.abs(best.x - svgX)) best = c;
        }
        setHover(best);
    };

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${geom.width} ${height}`}
                className="w-full"
                style={{ height }}
                onMouseMove={onMove}
                onMouseLeave={() => setHover(null)}
                role="img"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={VIZ.series} stopOpacity="0.18" />
                        <stop offset="100%" stopColor={VIZ.series} stopOpacity="0.01" />
                    </linearGradient>
                </defs>

                {/* Hairline grid — solid, never dashed: dashing reads as noise */}
                {ticks.map((t, i) => {
                    const yy = geom.pad.top + geom.inner.h - (t / geom.max) * geom.inner.h;
                    return (
                        <g key={i}>
                            <line
                                x1={geom.pad.left} y1={yy} x2={geom.width - geom.pad.right} y2={yy}
                                stroke={i === 0 ? VIZ.axis : VIZ.grid} strokeWidth="1"
                            />
                            <text
                                x={geom.pad.left - 8} y={yy + 3} textAnchor="end"
                                className="tabular-nums" fontSize="9" fill={VIZ.muted}
                            >
                                {format === 'currency' && t >= 1000
                                    ? `${Math.round(t / 1000)}k`
                                    : Math.round(t)}
                            </text>
                        </g>
                    );
                })}

                <path d={geom.area} fill={`url(#${gradientId})`} />
                <path d={geom.line} fill="none" stroke={VIZ.series} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                {/* A one-day range is a single point, and a path with one
                    moveto and no lineto draws nothing at all. */}
                {geom.coords.length === 1 && (
                    <circle cx={geom.coords[0].x} cy={geom.coords[0].y} r="4" fill={VIZ.series} />
                )}

                {points.map((p, i) => i % labelEvery === 0 && (
                    <text
                        key={p[labelKey] + i}
                        x={geom.coords[i].x} y={height - 6} textAnchor="middle"
                        fontSize="9" fill={VIZ.muted}
                    >
                        {p[labelKey]}
                    </text>
                ))}

                {hover && (
                    <g>
                        <line
                            x1={hover.x} y1={geom.pad.top} x2={hover.x} y2={geom.pad.top + geom.inner.h}
                            stroke={VIZ.axis} strokeWidth="1"
                        />
                        {/* 2px surface ring so the marker reads over the area fill */}
                        <circle cx={hover.x} cy={hover.y} r="5" fill={VIZ.series} stroke="#ffffff" strokeWidth="2" />
                    </g>
                )}
            </svg>

            {hover && (
                <div
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm"
                    style={{ left: `${(hover.x / geom.width) * 100}%`, top: `${(hover.y / height) * 100 - 4}%` }}
                >
                    <div className="text-[10px] text-gray-400">{hover.p[labelKey]}</div>
                    <div className="text-xs font-semibold tabular-nums text-gray-900">
                        {fmt(hover.p[valueKey])}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Horizontal bars for a count by category.
 *
 * One hue, sorted by magnitude — this is a size comparison, not an identity
 * one. Colouring each status its own hue would put cancelled-red beside
 * delivered-green, a pair 4.1 ΔE apart under deuteranopia and so effectively
 * the same bar to the readers most likely scanning for cancellations. Every
 * bar carries its name and count, so nothing rests on the fill.
 */
export function StatusBars({ rows, total }) {
    const max = Math.max(...rows.map(r => r.count), 1);

    return (
        <div className="space-y-2.5">
            {rows.map((r) => (
                <div key={r.status} className="group">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium capitalize text-gray-700">{r.status}</span>
                        <span className="text-xs tabular-nums text-gray-500">
                            {formatNumber(r.count)}
                            <span className="ml-1.5 text-[11px] text-gray-400">{r.percent}%</span>
                        </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-full rounded-full transition-[width] duration-300"
                            style={{
                                width: `${Math.max((r.count / max) * 100, 2)}%`,
                                backgroundColor: VIZ.series,
                            }}
                        />
                    </div>
                </div>
            ))}
            {total > 0 && (
                <p className="pt-1 text-[11px] text-gray-400">
                    {formatNumber(total)} orders in this period
                </p>
            )}
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
