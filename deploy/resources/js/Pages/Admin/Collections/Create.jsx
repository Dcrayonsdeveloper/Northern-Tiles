import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

function RuleBuilder({ rules, onChange, fields, operators, presets }) {
    const [matchType, setMatchType] = useState(rules?.match || 'all');
    const [conditions, setConditions] = useState(rules?.conditions || []);

    useEffect(() => {
        onChange({ match: matchType, conditions });
    }, [matchType, conditions]);

    const addCondition = () => {
        setConditions([...conditions, { field: 'name', op: 'contains', value: '' }]);
    };

    const removeCondition = (index) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateCondition = (index, key, value) => {
        const updated = [...conditions];
        updated[index] = { ...updated[index], [key]: value };
        setConditions(updated);
    };

    const applyPreset = (preset) => {
        setMatchType(preset.rules.match);
        setConditions(preset.rules.conditions);
    };

    const getOperatorsForField = (fieldKey) => {
        const field = fields.find(f => f.key === fieldKey);
        if (!field) return operators;
        return operators.filter(op => op.types.includes(field.type));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Products must match</span>
                <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value)}
                    className="admin-select text-xs"
                >
                    <option value="all">all conditions</option>
                    <option value="any">any condition</option>
                </select>
            </div>

            {/* Presets */}
            {presets?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Quick presets:</span>
                    {presets.map((preset) => (
                        <button
                            key={preset.key}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className="text-xs text-brand hover:underline"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Conditions */}
            <div className="space-y-2">
                {conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <select
                            value={condition.field}
                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            className="admin-select text-xs flex-1"
                        >
                            {fields.map((f) => (
                                <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                        </select>
                        <select
                            value={condition.op}
                            onChange={(e) => updateCondition(index, 'op', e.target.value)}
                            className="admin-select text-xs flex-1"
                        >
                            {getOperatorsForField(condition.field).map((op) => (
                                <option key={op.key} value={op.key}>{op.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={condition.value || ''}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            placeholder="Value"
                            className="admin-input text-xs flex-1"
                        />
                        <button
                            type="button"
                            onClick={() => removeCondition(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addCondition}
                className="btn-secondary text-xs"
            >
                + Add Condition
            </button>
        </div>
    );
}

function ProductSelector({ selectedIds, onChange, onSearch }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const search = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(route('admin.collections.search-products') + '?q=' + encodeURIComponent(query));
            const data = await response.json();
            setSearchResults(data.filter(p => !selectedIds.includes(p.id)));
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const addProduct = (product) => {
        onChange([...selectedIds, product.id]);
        setSearchResults(searchResults.filter(p => p.id !== product.id));
    };

    const removeProduct = (id) => {
        onChange(selectedIds.filter(i => i !== id));
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        search(e.target.value);
                    }}
                    placeholder="Search products to add..."
                    className="admin-input w-full"
                />
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                        {searchResults.map((product) => (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => addProduct(product)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                            >
                                <span className="font-medium">{product.name}</span>
                                <span className="text-gray-500">${product.price}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-500">
                {selectedIds.length} products selected
            </div>
        </div>
    );
}

export default function Create({ collection, sortModes, ruleFields, ruleOperators, rulePresets, categories, vendors }) {
    const isEdit = !!collection;

    const { data, setData, post, put, processing, errors } = useForm({
        title: collection?.title || '',
        handle: collection?.handle || '',
        description: collection?.description || '',
        type: collection?.type || 'manual',
        rules_json: collection?.rules_json || { match: 'all', conditions: [] },
        sort_mode: collection?.sort_mode || 'manual',
        is_active: collection?.is_active ?? true,
        is_featured: collection?.is_featured ?? false,
        meta_title: collection?.meta_title || '',
        meta_description: collection?.meta_description || '',
        product_ids: collection?.product_ids || [],
    });

    const [preview, setPreview] = useState({ count: 0, products: [] });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.collections.update', collection.id));
        } else {
            post(route('admin.collections.store'));
        }
    };

    const fetchPreview = async () => {
        if (data.type !== 'automated' || !data.rules_json?.conditions?.length) {
            setPreview({ count: 0, products: [] });
            return;
        }

        try {
            const response = await fetch(route('admin.collections.preview'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({ rules: data.rules_json }),
            });
            const result = await response.json();
            setPreview(result);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (data.type === 'automated') {
            const timeout = setTimeout(fetchPreview, 500);
            return () => clearTimeout(timeout);
        }
    }, [data.rules_json, data.type]);

    return (
        <DashboardLayout title={isEdit ? 'Edit Collection' : 'Create Collection'}>
            <Head title={isEdit ? 'Edit Collection' : 'Create Collection'} />

            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href={route('admin.collections.index')}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        ← Back to Collections
                    </Link>
                    <h1 className="mt-1 text-sm font-semibold text-gray-900">
                        {isEdit ? 'Edit Collection' : 'Create Collection'}
                    </h1>
                </div>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="text-xs font-semibold text-gray-900 mb-4">Basic Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="admin-input w-full"
                                    />
                                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Handle (URL)</label>
                                    <input
                                        type="text"
                                        value={data.handle}
                                        onChange={(e) => setData('handle', e.target.value)}
                                        placeholder="auto-generated-from-title"
                                        className="admin-input w-full"
                                    />
                                    {errors.handle && <p className="mt-1 text-xs text-red-600">{errors.handle}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="admin-input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Collection Type */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="text-xs font-semibold text-gray-900 mb-4">Collection Type</h2>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="manual"
                                        checked={data.type === 'manual'}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="text-brand focus:ring-brand"
                                    />
                                    <span className="text-xs">Manual</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="automated"
                                        checked={data.type === 'automated'}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="text-brand focus:ring-brand"
                                    />
                                    <span className="text-xs">Automated</span>
                                </label>
                            </div>

                            {data.type === 'automated' ? (
                                <div className="mt-4">
                                    <h3 className="text-xs font-medium text-gray-700 mb-2">Conditions</h3>
                                    <RuleBuilder
                                        rules={data.rules_json}
                                        onChange={(rules) => setData('rules_json', rules)}
                                        fields={ruleFields}
                                        operators={ruleOperators}
                                        presets={rulePresets}
                                    />

                                    {/* Preview */}
                                    <div className="mt-4 rounded-lg bg-gray-50 p-3">
                                        <div className="text-xs font-medium text-gray-700">
                                            Preview: {preview.count} products match
                                        </div>
                                        {preview.products?.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {preview.products.map((p) => (
                                                    <span key={p.id} className="rounded bg-white px-2 py-1 text-[11px] border">
                                                        {p.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <h3 className="text-xs font-medium text-gray-700 mb-2">Products</h3>
                                    <ProductSelector
                                        selectedIds={data.product_ids}
                                        onChange={(ids) => setData('product_ids', ids)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* SEO */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="text-xs font-semibold text-gray-900 mb-4">SEO</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
                                    <input
                                        type="text"
                                        value={data.meta_title}
                                        onChange={(e) => setData('meta_title', e.target.value)}
                                        className="admin-input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
                                    <textarea
                                        value={data.meta_description}
                                        onChange={(e) => setData('meta_description', e.target.value)}
                                        rows={2}
                                        className="admin-input w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="text-xs font-semibold text-gray-900 mb-4">Status</h2>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                    />
                                    <span className="text-xs">Active</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_featured}
                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                    />
                                    <span className="text-xs">Featured</span>
                                </label>
                            </div>
                        </div>

                        {/* Sort Mode */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="text-xs font-semibold text-gray-900 mb-4">Sort Order</h2>
                            <select
                                value={data.sort_mode}
                                onChange={(e) => setData('sort_mode', e.target.value)}
                                className="admin-select w-full"
                            >
                                {Object.entries(sortModes).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary w-full"
                            >
                                {processing ? 'Saving...' : (isEdit ? 'Update Collection' : 'Create Collection')}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
