import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';

function ArrowLeftIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
    );
}

export default function Create({ types }) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        title: '',
        description: '',
        type: 'percentage',
        value: '',
        minimum_purchase: '',
        maximum_discount: '',
        usage_limit: '',
        usage_limit_per_customer: '',
        starts_at: '',
        expires_at: '',
        is_active: true,
        first_order_only: false,
        buy_quantity: '',
        get_quantity: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.coupons.store'));
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setData('code', code);
    };

    return (
        <DashboardLayout>
            <Head title="Create Coupon" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('admin.coupons.index')}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Create Coupon</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Create a new discount code for your customers
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Coupon Code *
                                </label>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        placeholder="e.g., SAVE20"
                                        className="flex-1 rounded-lg border-gray-300 text-sm uppercase focus:border-gray-500 focus:ring-gray-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Generate
                                    </button>
                                </div>
                                {errors.code && (
                                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Title (optional)
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g., Summer Sale 20% Off"
                                    className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    placeholder="Internal notes about this coupon"
                                    className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Discount Type */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-gray-900">Discount Type</h2>
                        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Type *
                                </label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                >
                                    {Object.entries(types).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {data.type !== 'free_shipping' && data.type !== 'buy_x_get_y' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Value *
                                    </label>
                                    <div className="relative mt-1">
                                        {data.type === 'fixed_amount' && (
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        )}
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.value}
                                            onChange={(e) => setData('value', e.target.value)}
                                            placeholder={data.type === 'percentage' ? 'e.g., 20' : 'e.g., 100'}
                                            className={`w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500 ${
                                                data.type === 'fixed_amount' ? 'pl-7' : ''
                                            }`}
                                        />
                                        {data.type === 'percentage' && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                        )}
                                    </div>
                                    {errors.value && (
                                        <p className="mt-1 text-sm text-red-600">{errors.value}</p>
                                    )}
                                </div>
                            )}

                            {data.type === 'buy_x_get_y' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Buy Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.buy_quantity}
                                            onChange={(e) => setData('buy_quantity', e.target.value)}
                                            placeholder="e.g., 2"
                                            className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Get Quantity Free *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.get_quantity}
                                            onChange={(e) => setData('get_quantity', e.target.value)}
                                            placeholder="e.g., 1"
                                            className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Restrictions */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-gray-900">Restrictions</h2>
                        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Minimum Purchase
                                </label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.minimum_purchase}
                                        onChange={(e) => setData('minimum_purchase', e.target.value)}
                                        placeholder="No minimum"
                                        className="w-full rounded-lg border-gray-300 pl-7 text-sm focus:border-gray-500 focus:ring-gray-500"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Minimum cart value required to use this coupon
                                </p>
                            </div>

                            {data.type === 'percentage' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Maximum Discount
                                    </label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.maximum_discount}
                                            onChange={(e) => setData('maximum_discount', e.target.value)}
                                            placeholder="No maximum"
                                            className="w-full rounded-lg border-gray-300 pl-7 text-sm focus:border-gray-500 focus:ring-gray-500"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Cap the maximum discount amount
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Usage Limits */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-gray-900">Usage Limits</h2>
                        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Total Usage Limit
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.usage_limit}
                                    onChange={(e) => setData('usage_limit', e.target.value)}
                                    placeholder="Unlimited"
                                    className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Maximum times this coupon can be used in total
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Per Customer Limit
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.usage_limit_per_customer}
                                    onChange={(e) => setData('usage_limit_per_customer', e.target.value)}
                                    placeholder="Unlimited"
                                    className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Maximum times one customer can use this coupon
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={data.first_order_only}
                                        onChange={(e) => setData('first_order_only', e.target.checked)}
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        First order only
                                    </span>
                                </label>
                                <p className="mt-1 ml-7 text-xs text-gray-500">
                                    Only allow customers who haven't placed an order before
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-gray-900">Schedule</h2>
                        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Start Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.starts_at}
                                    onChange={(e) => setData('starts_at', e.target.value)}
                                    className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Leave empty to start immediately
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    End Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.expires_at}
                                    onChange={(e) => setData('expires_at', e.target.value)}
                                    className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-gray-500 focus:ring-gray-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Leave empty for no expiration
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Active
                                    </span>
                                </label>
                                <p className="mt-1 ml-7 text-xs text-gray-500">
                                    Enable this coupon for use
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={route('admin.coupons.index')}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
