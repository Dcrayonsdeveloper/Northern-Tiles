import { Head, Link, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useD } from '@/Support/dictionary';
import { useState } from 'react';

export default function Preview({ template, renderedHtml, renderedSubject }) {
    const d = useD();
    const [testEmail, setTestEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState(null);

    const sendTestEmail = async () => {
        if (!testEmail) return;

        setSending(true);
        setMessage(null);

        try {
            const response = await fetch(route('admin.email-templates.test', template.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({ email: testEmail }),
            });

            const data = await response.json();
            setMessage({
                type: data.success ? 'success' : 'error',
                text: data.message,
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: d('admin.email_templates.test_failed', 'Failed to send test email'),
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <DashboardLayout>
            <Head title={d('admin.email_templates.preview_title', 'Preview Template')} />

            <div className="mb-6">
                <Link
                    href={route('admin.email-templates.index')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    {d('common.back_to', 'Back to')} {d('admin.email_templates.title', 'Email Templates')}
                </Link>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                    {d('admin.email_templates.preview_title', 'Preview Template')}: {template.name}
                </h1>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Preview */}
                <div className="lg:col-span-2">
                    <div className="rounded-lg bg-white shadow-sm">
                        {/* Email Header */}
                        <div className="border-b border-gray-200 p-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex">
                                    <span className="w-20 font-medium text-gray-500">
                                        {d('admin.email_templates.from', 'From')}:
                                    </span>
                                    <span className="text-gray-900">Your Store &lt;noreply@example.com&gt;</span>
                                </div>
                                <div className="flex">
                                    <span className="w-20 font-medium text-gray-500">
                                        {d('admin.email_templates.to', 'To')}:
                                    </span>
                                    <span className="text-gray-900">customer@example.com</span>
                                </div>
                                <div className="flex">
                                    <span className="w-20 font-medium text-gray-500">
                                        {d('admin.email_templates.subject', 'Subject')}:
                                    </span>
                                    <span className="font-medium text-gray-900">{renderedSubject}</span>
                                </div>
                            </div>
                        </div>

                        {/* Email Body */}
                        <div className="p-4">
                            <iframe
                                srcDoc={renderedHtml}
                                className="h-[600px] w-full rounded border bg-white"
                                title="Email Preview"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Template Info */}
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            {d('admin.email_templates.template_info', 'Template Info')}
                        </h2>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    {d('admin.email_templates.key', 'Key')}
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <code className="rounded bg-gray-100 px-2 py-0.5">{template.key}</code>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    {d('admin.email_templates.type', 'Type')}
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">{template.type}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    {d('admin.email_templates.status', 'Status')}
                                </dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                        template.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {template.is_active
                                            ? d('common.active', 'Active')
                                            : d('common.inactive', 'Inactive')
                                        }
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Send Test */}
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            {d('admin.email_templates.send_test', 'Send Test Email')}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {d('admin.email_templates.test_email', 'Email Address')}
                                </label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="test@example.com"
                                />
                            </div>
                            <button
                                onClick={sendTestEmail}
                                disabled={sending || !testEmail}
                                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {sending
                                    ? d('admin.email_templates.sending', 'Sending...')
                                    : d('admin.email_templates.send_test_btn', 'Send Test')
                                }
                            </button>
                            {message && (
                                <div className={`rounded-md p-3 text-sm ${
                                    message.type === 'success'
                                        ? 'bg-green-50 text-green-800'
                                        : 'bg-red-50 text-red-800'
                                }`}>
                                    {message.text}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <div className="space-y-3">
                            <Link
                                href={route('admin.email-templates.edit', template.id)}
                                className="block w-full rounded-md bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                {d('common.edit', 'Edit Template')}
                            </Link>
                            <Link
                                href={route('admin.email-templates.index')}
                                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                {d('common.back', 'Back to List')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
