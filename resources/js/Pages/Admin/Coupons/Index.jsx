import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

function PlusIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

function SearchIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function TagIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    );
}

function CouponStatusBadge({ coupon }) {
    if (!coupon.is_active) {
        return (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                Inactive
            </span>
        );
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Expired
            </span>
        );
    }

    if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
        return (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                Scheduled
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Active
        </span>
    );
}

function CouponTypeBadge({ type, types }) {
    const colors = {
        percentage: 'bg-blue-100 text-blue-800',
        fixed_amount: 'bg-purple-100 text-purple-800',
        free_shipping: 'bg-cyan-100 text-cyan-800',
        buy_x_get_y: 'bg-orange-100 text-orange-800',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
            {types[type] || type}
        </span>
    );
}

function formatValue(coupon) {
    switch (coupon.type) {
        case 'percentage':
            return `${coupon.value}%`;
        case 'fixed_amount':
            return `$${parseFloat(coupon.value).toLocaleString()}`;
        case 'free_shipping':
            return 'Free Shipping';
        case 'buy_x_get_y':
            return `Buy ${coupon.buy_quantity || 'X'} Get ${coupon.get_quantity || 'Y'}`;
        default:
            return coupon.value;
    }
}

// ─── Autocomplete Search Input ────────────────────────────────────────────────

function CouponSearchInput({ value, onChange, onCommit }) {
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const debounceTimer = useRef(null);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch suggestions with 200 ms debounce
    useEffect(() => {
        clearTimeout(debounceTimer.current);
        if (!value.trim()) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        debounceTimer.current = setTimeout(async () => {
            try {
                const url = route('admin.coupons.suggestions') + '?q=' + encodeURIComponent(value.trim());
                const res = await fetch(url, {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                if (!res.ok) return;
                const data = await res.json();
                setSuggestions(data.suggestions ?? []);
                setOpen((data.suggestions ?? []).length > 0);
                setActiveIdx(-1);
            } catch {}
        }, 200);
        return () => clearTimeout(debounceTimer.current);
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectSuggestion = useCallback((suggestion) => {
        onChange(suggestion.code);
        setOpen(false);
        setSuggestions([]);
        setActiveIdx(-1);
        onCommit(suggestion.code);
    }, [onChange, onCommit]);

    const handleKeyDown = useCallback((e) => {
        if (!open || suggestions.length === 0) {
            if (e.key === 'Enter') onCommit(value);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIdx >= 0) {
                selectSuggestion(suggestions[activeIdx]);
            } else {
                setOpen(false);
                onCommit(value);
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
            setActiveIdx(-1);
            inputRef.current?.blur();
        }
    }, [open, suggestions, activeIdx, value, onCommit, selectSuggestion]);

    const typeColors = {
        percentage: 'bg-blue-100 text-blue-700',
        fixed_amount: 'bg-purple-100 text-purple-700',
        free_shipping: 'bg-cyan-100 text-cyan-700',
        buy_x_get_y: 'bg-orange-100 text-orange-700',
    };

    return (
        <div ref={containerRef} className="relative flex-1 min-w-[200px]">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                placeholder="Search coupons..."
                autoComplete="off"
                className="w-full rounded-lg border-gray-300 pl-10 pr-8 text-sm focus:border-gray-500 focus:ring-gray-500"
            />
            {/* Clear button */}
            {value && (
                <button
                    type="button"
                    onClick={() => { onChange(''); setSuggestions([]); setOpen(false); inputRef.current?.focus(); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label="Clear search"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            {/* Dropdown */}
            {open && suggestions.length > 0 && (
                <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                >
                    {suggestions.map((s, idx) => (
                        <li
                            key={s.code}
                            role="option"
                            aria-selected={idx === activeIdx}
                            onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                            onMouseEnter={() => setActiveIdx(idx)}
                            className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors ${
                                idx === activeIdx ? 'bg-gray-100' : 'hover:bg-gray-50'
                            }`}
                        >
                            {/* Code + type badge */}
                            <span className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-mono font-semibold text-gray-900 shrink-0">{s.code}</span>
                                {s.title && (
                                    <span className="truncate text-gray-500">{s.title}</span>
                                )}
                            </span>
                            <span className="flex items-center gap-1.5 shrink-0">
                                {s.type && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[s.type] || 'bg-gray-100 text-gray-600'}`}>
                                        {s.type.replace('_', ' ')}
                                    </span>
                                )}
                                {!s.is_active && (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                                        inactive
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function Index({ coupons, stats, filters, types }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');

    const commitSearch = useCallback((q) => {
        router.get(route('admin.coupons.index'), {
            search: q ?? search,
            status: selectedStatus,
            type: selectedType,
        }, { preserveState: true });
    }, [search, selectedStatus, selectedType]);

    const handleFilter = (key, value) => {
        router.get(route('admin.coupons.index'), {
            search,
            status: key === 'status' ? value : selectedStatus,
            type: key === 'type' ? value : selectedType,
        }, { preserveState: true });
    };

    const handleDelete = (coupon) => {
        if (confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
            router.delete(route('admin.coupons.destroy', coupon.id));
        }
    };

    const handleToggleStatus = (coupon) => {
        router.post(route('admin.coupons.toggle-status', coupon.id));
    };

    return (
        <DashboardLayout>
            <Head title="Coupons" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage discount codes and promotions
                        </p>
                    </div>
                    <Link
                        href={route('admin.coupons.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Create Coupon
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Total Coupons</div>
                        <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Active</div>
                        <div className="mt-1 text-2xl font-semibold text-green-600">{stats.active}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Expired</div>
                        <div className="mt-1 text-2xl font-semibold text-red-600">{stats.expired}</div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Total Usage</div>
                        <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total_usage}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <CouponSearchInput
                            value={search}
                            onChange={setSearch}
                            onCommit={commitSearch}
                        />
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                handleFilter('status', e.target.value);
                            }}
                            className="rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="expired">Expired</option>
                            <option value="scheduled">Scheduled</option>
                        </select>
                        <select
                            value={selectedType}
                            onChange={(e) => {
                                setSelectedType(e.target.value);
                                handleFilter('type', e.target.value);
                            }}
                            className="rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                        >
                            <option value="">All Types</option>
                            {Object.entries(types).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Coupon
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Value
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Usage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Expires
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {coupons.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <TagIcon className="mx-auto h-12 w-12 text-gray-300" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No coupons found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Get started by creating a new coupon.
                                            </p>
                                            <Link
                                                href={route('admin.coupons.create')}
                                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                            >
                                                <PlusIcon className="h-4 w-4" />
                                                Create Coupon
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    coupons.data.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                                                        <TagIcon className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-mono text-sm font-semibold text-gray-900">
                                                            {coupon.code}
                                                        </div>
                                                        {coupon.title && (
                                                            <div className="text-sm text-gray-500">
                                                                {coupon.title}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <CouponTypeBadge type={coupon.type} types={types} />
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatValue(coupon)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {coupon.usages_count || 0}
                                                {coupon.usage_limit && (
                                                    <span className="text-gray-400"> / {coupon.usage_limit}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <CouponStatusBadge coupon={coupon} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {coupon.expires_at
                                                    ? new Date(coupon.expires_at).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(coupon)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                                                    >
                                                        {coupon.is_active ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <Link
                                                        href={route('admin.coupons.edit', coupon.id)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(coupon)}
                                                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {coupons.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-6 py-3">
                            <div className="text-sm text-gray-500">
                                Showing {coupons.from} to {coupons.to} of {coupons.total} results
                            </div>
                            <div className="flex gap-2">
                                {coupons.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`rounded px-3 py-1 text-sm ${
                                            link.active
                                                ? 'bg-gray-900 text-white'
                                                : link.url
                                                ? 'text-gray-600 hover:bg-gray-100'
                                                : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
