import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function Show({ message }) {
    const { data, setData, put, processing } = useForm({
        is_read: Boolean(message?.is_read ?? true),
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.messages.update', message.id));
    };

    const destroy = () => {
        if (!confirm('Delete this message?')) return;
        router.delete(route('admin.messages.destroy', message.id));
    };

    return (
        <DashboardLayout title="Message">
            <Head title="Message" />

            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-gray-900">Message</div>
                    <div className="mt-1 text-xs text-gray-600">
                        {message.name} · {message.email}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('admin.messages.index')}
                        className="btn-secondary"
                    >
                        Back
                    </Link>
                    <button
                        type="button"
                        onClick={destroy}
                        className="btn-secondary text-red-600 hover:bg-red-50"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="admin-card lg:col-span-2">
                    <div className="text-sm font-semibold text-gray-900">Content</div>

                    <div className="mt-3 space-y-2 text-xs">
                        <div>
                            <div className="text-[12px] font-semibold text-gray-500">Subject</div>
                            <div className="mt-1 text-gray-900">{message.subject ?? '-'}</div>
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-gray-500">Message</div>
                            <div className="mt-1 whitespace-pre-wrap text-gray-900">{message.message}</div>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="text-sm font-semibold text-gray-900">Actions</div>

                    <form onSubmit={submit} className="mt-4 space-y-2">
                        <label className="block text-xs font-medium text-gray-700">Read status</label>
                        <select
                            value={data.is_read ? '1' : '0'}
                            onChange={(e) => setData('is_read', e.target.value === '1')}
                            className="admin-select"
                        >
                            <option value="1">Read</option>
                            <option value="0">New</option>
                        </select>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary mt-3 w-full"
                        >
                            Update
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
