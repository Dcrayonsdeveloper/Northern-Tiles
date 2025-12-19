import { Head, Link, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useD } from '@/Support/dictionary';
import { useState, useRef } from 'react';

export default function Create({ template = null, types, variables }) {
    const d = useD();
    const isEdit = !!template;
    const editorRef = useRef(null);
    const [activeTab, setActiveTab] = useState('visual');
    const [previewHtml, setPreviewHtml] = useState('');

    const { data, setData, post, put, processing, errors } = useForm({
        key: template?.key || '',
        name: template?.name || '',
        subject: template?.subject || '',
        preview_text: template?.preview_text || '',
        body_html: template?.body_html || getDefaultTemplate(),
        body_json: template?.body_json || [],
        type: template?.type || 'abandoned_cart',
        is_active: template?.is_active ?? true,
    });

    function getDefaultTemplate() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
        <h1 style="color: #111827; margin-bottom: 20px;">Hi {{customer_name}},</h1>

        <p>You left some items in your cart at {{brand_name}}. Don't miss out!</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            {{cart_items}}
        </div>

        <p style="text-align: center; margin: 30px 0;">
            <a href="{{cart_url}}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Complete Your Purchase
            </a>
        </p>

        <p style="font-size: 14px; color: #6b7280;">
            If you have any questions, just reply to this email.
        </p>
    </div>

    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
        <p>
            <a href="{{unsubscribe_url}}" style="color: #9ca3af;">Unsubscribe</a>
        </p>
    </div>
</body>
</html>`;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.email-templates.update', template.id));
        } else {
            post(route('admin.email-templates.store'));
        }
    };

    const insertVariable = (variable) => {
        const textarea = editorRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = data.body_html;
            const newText = text.substring(0, start) + variable + text.substring(end);
            setData('body_html', newText);
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        }
    };

    const generatePreview = () => {
        let html = data.body_html;
        // Replace variables with sample data
        const sampleData = {
            '{{brand_name}}': 'Your Store',
            '{{customer_email}}': 'customer@example.com',
            '{{customer_name}}': 'John Doe',
            '{{cart_url}}': '#',
            '{{cart_items}}': '<p>Sample Product - ₹999</p>',
            '{{cart_items_count}}': '3',
            '{{cart_total}}': '₹2,997',
            '{{unsubscribe_url}}': '#',
            '{{subject}}': data.subject || 'Email Subject',
        };
        Object.entries(sampleData).forEach(([key, value]) => {
            html = html.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        });
        setPreviewHtml(html);
        setActiveTab('preview');
    };

    return (
        <DashboardLayout>
            <Head title={isEdit
                ? d('admin.email_templates.edit_title', 'Edit Template')
                : d('admin.email_templates.create_title', 'Create Template')
            } />

            <div className="mb-6">
                <Link
                    href={route('admin.email-templates.index')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    {d('common.back_to', 'Back to')} {d('admin.email_templates.title', 'Email Templates')}
                </Link>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                    {isEdit
                        ? d('admin.email_templates.edit_title', 'Edit Template')
                        : d('admin.email_templates.create_title', 'Create Template')
                    }
                </h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Basic Info */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                {d('admin.email_templates.basic_info', 'Basic Information')}
                            </h2>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {d('admin.email_templates.key', 'Template Key')}
                                    </label>
                                    <input
                                        type="text"
                                        value={data.key}
                                        onChange={(e) => setData('key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="abandoned_cart_reminder_1"
                                    />
                                    {errors.key && <p className="mt-1 text-sm text-red-600">{errors.key}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {d('admin.email_templates.name', 'Name')}
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="First Reminder Email"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {d('admin.email_templates.type', 'Type')}
                                    </label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {Object.entries(types || {}).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                    {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                                </div>

                                <div className="flex items-center pt-6">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            {d('admin.email_templates.is_active', 'Active')}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Subject & Preview */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                {d('admin.email_templates.subject_section', 'Email Subject')}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {d('admin.email_templates.subject', 'Subject Line')}
                                    </label>
                                    <input
                                        type="text"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="You forgot something at {{brand_name}}!"
                                    />
                                    {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {d('admin.email_templates.preview_text', 'Preview Text')}
                                    </label>
                                    <input
                                        type="text"
                                        value={data.preview_text}
                                        onChange={(e) => setData('preview_text', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Your cart is waiting for you..."
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        {d('admin.email_templates.preview_text_help', 'Shows in inbox after subject line')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Email Body */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {d('admin.email_templates.body', 'Email Body')}
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('visual')}
                                        className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                                            activeTab === 'visual'
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {d('admin.email_templates.tab_html', 'HTML')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={generatePreview}
                                        className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                                            activeTab === 'preview'
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {d('admin.email_templates.tab_preview', 'Preview')}
                                    </button>
                                </div>
                            </div>

                            {activeTab === 'visual' && (
                                <textarea
                                    ref={editorRef}
                                    value={data.body_html}
                                    onChange={(e) => setData('body_html', e.target.value)}
                                    rows={20}
                                    className="block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            )}

                            {activeTab === 'preview' && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <iframe
                                        srcDoc={previewHtml}
                                        className="h-[500px] w-full rounded border bg-white"
                                        title="Email Preview"
                                    />
                                </div>
                            )}

                            {errors.body_html && <p className="mt-2 text-sm text-red-600">{errors.body_html}</p>}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Variables */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                {d('admin.email_templates.available_variables', 'Available Variables')}
                            </h2>
                            <p className="mb-4 text-sm text-gray-500">
                                {d('admin.email_templates.variables_help', 'Click to insert into template')}
                            </p>
                            <div className="space-y-2">
                                {Object.entries(variables || {}).map(([variable, description]) => (
                                    <button
                                        key={variable}
                                        type="button"
                                        onClick={() => insertVariable(variable)}
                                        className="flex w-full items-start rounded-md border border-gray-200 p-2 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50"
                                    >
                                        <code className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-indigo-600">
                                            {variable}
                                        </code>
                                        <span className="text-xs text-gray-500">{description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {processing
                                        ? d('common.saving', 'Saving...')
                                        : isEdit
                                            ? d('common.save_changes', 'Save Changes')
                                            : d('common.create', 'Create Template')
                                    }
                                </button>
                                <Link
                                    href={route('admin.email-templates.index')}
                                    className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {d('common.cancel', 'Cancel')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
