import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useD } from '@/Support/dictionary';

export default function Show({ cart, messages }) {
    const d = useD();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: cart.currency || 'USD'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString();
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            pending: 'bg-yellow-100 text-yellow-800',
            sent: 'bg-blue-100 text-blue-800',
            clicked: 'bg-green-100 text-green-800',
            converted: 'bg-purple-100 text-purple-800',
            cancelled: 'bg-gray-100 text-gray-800',
            failed: 'bg-red-100 text-red-800',
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <DashboardLayout>
            <Head title={d('admin.abandoned_carts.show.title', 'Abandoned Cart Details')} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        href={route('admin.abandoned-carts.index')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        {d('common.back', 'Back')}
                    </Link>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900">
                        {d('admin.abandoned_carts.show.title', 'Abandoned Cart Details')}
                    </h1>
                </div>
                {cart.recovered_order_id && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                        {d('admin.abandoned_carts.status.recovered', 'Recovered')}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Customer Info */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        {d('admin.abandoned_carts.customer_info', 'Customer Information')}
                    </h2>
                    <dl className="space-y-3">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                {d('admin.abandoned_carts.email', 'Email')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{cart.email || '-'}</dd>
                        </div>
                        {cart.customer && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    {d('admin.abandoned_carts.customer_name', 'Customer Name')}
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">{cart.customer.name}</dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                {d('admin.abandoned_carts.marketing_opt_in', 'Marketing Opt-in')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {cart.marketing_opt_in ? (
                                    <span className="text-green-600">{d('common.yes', 'Yes')}</span>
                                ) : (
                                    <span className="text-red-600">{d('common.no', 'No')}</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Cart Timeline */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        {d('admin.abandoned_carts.timeline', 'Timeline')}
                    </h2>
                    <dl className="space-y-3">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                {d('admin.abandoned_carts.created_at', 'Created')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(cart.created_at)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                {d('admin.abandoned_carts.last_activity', 'Last Activity')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(cart.last_activity_at)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                {d('admin.abandoned_carts.abandoned_at', 'Abandoned')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(cart.abandoned_at)}</dd>
                        </div>
                    </dl>
                </div>

                {/* Cart Value */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        {d('admin.abandoned_carts.cart_value', 'Cart Value')}
                    </h2>
                    <dl className="space-y-3">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                {d('admin.abandoned_carts.items_count', 'Items')}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-gray-900">
                                {cart.items?.length || 0}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                {d('admin.abandoned_carts.total_value', 'Total Value')}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-gray-900">
                                {formatCurrency(cart.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Cart Items */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    {d('admin.abandoned_carts.cart_items', 'Cart Items')}
                </h2>
                {cart.items?.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.item.product', 'Product')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.item.variant', 'Variant')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.item.price', 'Price')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.item.quantity', 'Quantity')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.item.total', 'Total')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {cart.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="whitespace-nowrap px-4 py-4">
                                        <div className="flex items-center">
                                            {item.product?.image_url && (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product?.name}
                                                    className="mr-3 h-10 w-10 rounded object-cover"
                                                />
                                            )}
                                            <span className="text-sm font-medium text-gray-900">
                                                {item.product?.name || item.product_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                        {item.variant?.title || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-900">
                                        {formatCurrency(item.price)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-900">
                                        {item.quantity}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-gray-900">
                                        {formatCurrency(item.price * item.quantity)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-gray-500">
                        {d('admin.abandoned_carts.no_items', 'No items in cart')}
                    </p>
                )}
            </div>

            {/* Email Messages */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    {d('admin.abandoned_carts.email_messages', 'Email Messages')}
                </h2>
                {messages?.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.message.flow', 'Flow')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.message.step', 'Step')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.message.status', 'Status')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.message.scheduled', 'Scheduled')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    {d('admin.abandoned_carts.message.sent', 'Sent')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {messages.map((message) => (
                                <tr key={message.id}>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                                        {message.flow?.name || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                        {message.step_number}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(message.status)}`}>
                                            {message.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                        {formatDate(message.scheduled_at)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                        {formatDate(message.sent_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-gray-500">
                        {d('admin.abandoned_carts.no_messages', 'No email messages yet')}
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
}
