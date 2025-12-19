import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useD } from '@/Support/dictionary';
import { useState } from 'react';

export default function Index({ flows, filters }) {
    const d = useD();
    const [search, setSearch] = useState(filters?.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.abandoned-carts.flows'), { search }, { preserveState: true });
    };

    const handleDelete = (flow) => {
        if (confirm(d('admin.abandoned_carts.flows.delete_confirm', 'Are you sure you want to delete this flow?'))) {
            router.delete(route('admin.abandoned-carts.flows.destroy', flow.id));
        }
    };

    const toggleActive = (flow) => {
        router.put(route('admin.abandoned-carts.flows.update', flow.id), {
            ...flow,
            is_active: !flow.is_active
        }, { preserveScroll: true });
    };

    return (
        <DashboardLayout>
            <Head title={d('admin.abandoned_carts.flows.title', 'Email Flows')} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        href={route('admin.abandoned-carts.index')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        {d('common.back_to', 'Back to')} {d('admin.abandoned_carts.title', 'Abandoned Carts')}
                    </Link>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900">
                        {d('admin.abandoned_carts.flows.title', 'Email Flows')}
                    </h1>
                </div>
                <Link
                    href={route('admin.abandoned-carts.flows.create')}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    {d('admin.abandoned_carts.flows.create', 'Create Flow')}
                </Link>
            </div>

            <div className="rounded-lg bg-white shadow-sm">
                <div className="border-b border-gray-200 p-4">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <input
                            type="text"
                            placeholder={d('admin.abandoned_carts.flows.search_placeholder', 'Search flows...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            {d('common.search', 'Search')}
                        </button>
                    </form>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                {d('admin.abandoned_carts.flows.name', 'Name')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                {d('admin.abandoned_carts.flows.trigger_delay', 'Trigger Delay')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                {d('admin.abandoned_carts.flows.steps', 'Steps')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                {d('admin.abandoned_carts.flows.status', 'Status')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                {d('admin.abandoned_carts.flows.priority', 'Priority')}
                            </th>
                            <th className="relative px-6 py-3">
                                <span className="sr-only">{d('common.actions', 'Actions')}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {flows?.data?.length > 0 ? flows.data.map((flow) => (
                            <tr key={flow.id}>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{flow.name}</div>
                                    {flow.description && (
                                        <div className="text-sm text-gray-500">{flow.description}</div>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {flow.trigger_delay_minutes} {d('common.minutes', 'minutes')}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {flow.steps_json?.length || 0} {d('admin.abandoned_carts.flows.email_steps', 'email(s)')}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <button
                                        onClick={() => toggleActive(flow)}
                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                            flow.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {flow.is_active
                                            ? d('common.active', 'Active')
                                            : d('common.inactive', 'Inactive')}
                                    </button>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {flow.priority}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                    <Link
                                        href={route('admin.abandoned-carts.flows.edit', flow.id)}
                                        className="mr-3 text-indigo-600 hover:text-indigo-900"
                                    >
                                        {d('common.edit', 'Edit')}
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(flow)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        {d('common.delete', 'Delete')}
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                    {d('admin.abandoned_carts.flows.no_flows', 'No email flows found. Create one to start recovering abandoned carts.')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {flows?.links && flows.links.length > 3 && (
                    <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                {d('common.showing', 'Showing')} {flows.from} {d('common.to', 'to')} {flows.to} {d('common.of', 'of')} {flows.total}
                            </div>
                            <div className="flex gap-2">
                                {flows.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`rounded px-3 py-1 text-sm ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : link.url
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'cursor-not-allowed bg-gray-50 text-gray-400'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
