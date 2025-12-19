import { Head, Link, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useD } from '@/Support/dictionary';
import { useState } from 'react';

export default function Create({ flow = null, templates }) {
    const d = useD();
    const isEdit = !!flow;

    const { data, setData, post, put, processing, errors } = useForm({
        name: flow?.name || '',
        description: flow?.description || '',
        trigger_delay_minutes: flow?.trigger_delay_minutes || 60,
        is_active: flow?.is_active ?? true,
        priority: flow?.priority || 0,
        conditions_json: flow?.conditions_json || {},
        steps_json: flow?.steps_json || [
            { delay_minutes: 0, template_key: '', subject_override: '' }
        ],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.abandoned-carts.flows.update', flow.id));
        } else {
            post(route('admin.abandoned-carts.flows.store'));
        }
    };

    const addStep = () => {
        setData('steps_json', [
            ...data.steps_json,
            { delay_minutes: 24 * 60, template_key: '', subject_override: '' }
        ]);
    };

    const removeStep = (index) => {
        if (data.steps_json.length > 1) {
            setData('steps_json', data.steps_json.filter((_, i) => i !== index));
        }
    };

    const updateStep = (index, field, value) => {
        const updated = [...data.steps_json];
        updated[index] = { ...updated[index], [field]: value };
        setData('steps_json', updated);
    };

    const formatDelay = (minutes) => {
        if (minutes < 60) return `${minutes} ${d('common.minutes', 'minutes')}`;
        if (minutes < 1440) return `${Math.round(minutes / 60)} ${d('common.hours', 'hours')}`;
        return `${Math.round(minutes / 1440)} ${d('common.days', 'days')}`;
    };

    return (
        <DashboardLayout>
            <Head title={isEdit
                ? d('admin.abandoned_carts.flows.edit_title', 'Edit Flow')
                : d('admin.abandoned_carts.flows.create_title', 'Create Flow')
            } />

            <div className="mb-6">
                <Link
                    href={route('admin.abandoned-carts.flows')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    {d('common.back_to', 'Back to')} {d('admin.abandoned_carts.flows.title', 'Email Flows')}
                </Link>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">
                    {isEdit
                        ? d('admin.abandoned_carts.flows.edit_title', 'Edit Flow')
                        : d('admin.abandoned_carts.flows.create_title', 'Create Flow')
                    }
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        {d('admin.abandoned_carts.flows.basic_info', 'Basic Information')}
                    </h2>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {d('admin.abandoned_carts.flows.name', 'Name')}
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder={d('admin.abandoned_carts.flows.name_placeholder', 'e.g., Default Recovery Flow')}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {d('admin.abandoned_carts.flows.trigger_delay', 'Trigger Delay')}
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={data.trigger_delay_minutes}
                                    onChange={(e) => setData('trigger_delay_minutes', parseInt(e.target.value))}
                                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-500">{d('common.minutes', 'minutes')}</span>
                                <span className="text-sm text-gray-400">
                                    ({formatDelay(data.trigger_delay_minutes)})
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                {d('admin.abandoned_carts.flows.trigger_delay_help', 'Time after cart abandonment before first email')}
                            </p>
                            {errors.trigger_delay_minutes && <p className="mt-1 text-sm text-red-600">{errors.trigger_delay_minutes}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {d('admin.abandoned_carts.flows.description', 'Description')}
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder={d('admin.abandoned_carts.flows.description_placeholder', 'Optional description for this flow...')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {d('admin.abandoned_carts.flows.priority', 'Priority')}
                            </label>
                            <input
                                type="number"
                                value={data.priority}
                                onChange={(e) => setData('priority', parseInt(e.target.value))}
                                className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {d('admin.abandoned_carts.flows.priority_help', 'Higher priority flows are checked first')}
                            </p>
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    {d('admin.abandoned_carts.flows.is_active', 'Active')}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Email Steps */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {d('admin.abandoned_carts.flows.email_steps', 'Email Steps')}
                        </h2>
                        <button
                            type="button"
                            onClick={addStep}
                            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            {d('admin.abandoned_carts.flows.add_step', 'Add Step')}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {data.steps_json.map((step, index) => (
                            <div key={index} className="rounded-lg border border-gray-200 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">
                                        {d('admin.abandoned_carts.flows.step', 'Step')} {index + 1}
                                    </span>
                                    {data.steps_json.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeStep(index)}
                                            className="text-sm text-red-600 hover:text-red-800"
                                        >
                                            {d('common.remove', 'Remove')}
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">
                                            {d('admin.abandoned_carts.flows.step_delay', 'Delay from previous')}
                                        </label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={step.delay_minutes}
                                                onChange={(e) => updateStep(index, 'delay_minutes', parseInt(e.target.value))}
                                                className="block w-20 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-500">{d('common.minutes', 'min')}</span>
                                        </div>
                                        {index === 0 && (
                                            <p className="mt-1 text-xs text-gray-400">
                                                {d('admin.abandoned_carts.flows.first_step_note', 'First email: after trigger delay')}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">
                                            {d('admin.abandoned_carts.flows.template', 'Email Template')}
                                        </label>
                                        <select
                                            value={step.template_key}
                                            onChange={(e) => updateStep(index, 'template_key', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">{d('admin.abandoned_carts.flows.select_template', 'Select template...')}</option>
                                            {templates?.map((template) => (
                                                <option key={template.key} value={template.key}>
                                                    {template.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">
                                            {d('admin.abandoned_carts.flows.subject_override', 'Subject Override')}
                                        </label>
                                        <input
                                            type="text"
                                            value={step.subject_override || ''}
                                            onChange={(e) => updateStep(index, 'subject_override', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder={d('admin.abandoned_carts.flows.subject_placeholder', 'Optional')}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {errors.steps_json && <p className="mt-2 text-sm text-red-600">{errors.steps_json}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={route('admin.abandoned-carts.flows')}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {d('common.cancel', 'Cancel')}
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing
                            ? d('common.saving', 'Saving...')
                            : isEdit
                                ? d('common.save_changes', 'Save Changes')
                                : d('common.create', 'Create')
                        }
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
