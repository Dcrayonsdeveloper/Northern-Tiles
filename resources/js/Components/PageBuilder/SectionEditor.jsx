import { useState, useCallback } from 'react';

// A generic section editor that renders form fields based on schema
// The schema defines fields with types: text, textarea, number, boolean, select, image, richtext, json

function FieldRenderer({ field, value, onChange }) {
    const { key, type, label, placeholder, options, min, max, required } = field;

    switch (type) {
        case 'text':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label || key}</label>
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(key, e.target.value)}
                        placeholder={placeholder}
                        required={required}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                    />
                </div>
            );

        case 'textarea':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label || key}</label>
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(key, e.target.value)}
                        placeholder={placeholder}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                    />
                </div>
            );

        case 'richtext':
            // For now, a simple textarea. Could be replaced with a WYSIWYG editor
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label || key}</label>
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(key, e.target.value)}
                        placeholder={placeholder}
                        rows={6}
                        className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-brand focus:ring-brand"
                    />
                    <p className="mt-1 text-xs text-gray-500">HTML supported</p>
                </div>
            );

        case 'number':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label || key}</label>
                    <input
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => onChange(key, e.target.value === '' ? null : Number(e.target.value))}
                        min={min}
                        max={max}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                    />
                </div>
            );

        case 'boolean':
            return (
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => onChange(key, e.target.checked)}
                        className="rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span className="text-sm text-gray-700">{label || key}</span>
                </label>
            );

        case 'select':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label || key}</label>
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(key, e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                    >
                        <option value="">Select...</option>
                        {options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            );

        case 'image':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label || key}</label>
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(key, e.target.value)}
                        placeholder="Image URL or path"
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                    />
                    {value && (
                        <img
                            src={value}
                            alt="Preview"
                            className="mt-2 h-20 w-32 rounded border border-gray-200 object-cover"
                        />
                    )}
                </div>
            );

        case 'color':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label || key}</label>
                    <div className="mt-1 flex items-center gap-2">
                        <input
                            type="color"
                            value={value || '#000000'}
                            onChange={(e) => onChange(key, e.target.value)}
                            className="h-9 w-14 cursor-pointer rounded border border-gray-300"
                        />
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => onChange(key, e.target.value)}
                            placeholder="#000000"
                            className="block flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                        />
                    </div>
                </div>
            );

        case 'json':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label || key}</label>
                    <textarea
                        value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
                        onChange={(e) => {
                            try {
                                onChange(key, JSON.parse(e.target.value));
                            } catch {
                                // Keep as string if invalid JSON
                                onChange(key, e.target.value);
                            }
                        }}
                        rows={6}
                        className="mt-1 block w-full rounded-md border-gray-300 font-mono text-xs shadow-sm focus:border-brand focus:ring-brand"
                    />
                    <p className="mt-1 text-xs text-gray-500">JSON format</p>
                </div>
            );

        case 'array':
            return <ArrayFieldEditor field={field} value={value || []} onChange={onChange} />;

        default:
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">{label || key}</label>
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(key, e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                    />
                </div>
            );
    }
}

// Array field editor for repeated items
function ArrayFieldEditor({ field, value, onChange }) {
    const { key, label, itemSchema } = field;
    const items = Array.isArray(value) ? value : [];

    const handleAddItem = () => {
        const newItem = {};
        if (itemSchema?.fields) {
            itemSchema.fields.forEach(f => {
                newItem[f.key] = f.default ?? '';
            });
        }
        onChange(key, [...items, newItem]);
    };

    const handleUpdateItem = (index, itemKey, itemValue) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [itemKey]: itemValue };
        onChange(key, updated);
    };

    const handleRemoveItem = (index) => {
        onChange(key, items.filter((_, i) => i !== index));
    };

    const handleMoveItem = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= items.length) return;
        const updated = [...items];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        onChange(key, updated);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label || key}</label>
            <div className="mt-2 space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleMoveItem(index, -1)}
                                    disabled={index === 0}
                                    className="rounded p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMoveItem(index, 1)}
                                    disabled={index === items.length - 1}
                                    className="rounded p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {itemSchema?.fields?.map(subField => (
                                <FieldRenderer
                                    key={subField.key}
                                    field={subField}
                                    value={item[subField.key]}
                                    onChange={(k, v) => handleUpdateItem(index, k, v)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-brand hover:text-brand"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                </button>
            </div>
        </div>
    );
}

// Main section editor
export default function SectionEditor({ section, schema, onChange }) {
    const data = section.data_json || {};

    const handleFieldChange = useCallback((key, value) => {
        onChange({ ...data, [key]: value });
    }, [data, onChange]);

    // If no schema, show raw JSON editor
    if (!schema || !schema.fields || schema.fields.length === 0) {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700">Section Data (JSON)</label>
                <textarea
                    value={JSON.stringify(data, null, 2)}
                    onChange={(e) => {
                        try {
                            onChange(JSON.parse(e.target.value));
                        } catch {
                            // Invalid JSON, ignore
                        }
                    }}
                    rows={8}
                    className="mt-1 block w-full rounded-md border-gray-300 font-mono text-xs shadow-sm focus:border-brand focus:ring-brand"
                />
                <p className="mt-1 text-xs text-gray-500">
                    No schema defined for this section. Edit the raw JSON data.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {schema.fields.map(field => (
                <FieldRenderer
                    key={field.key}
                    field={field}
                    value={data[field.key]}
                    onChange={handleFieldChange}
                />
            ))}
        </div>
    );
}
