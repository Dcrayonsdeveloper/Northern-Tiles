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

function ProductSelector({ selectedIds = [], known = [], onChange }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    // Details for everything on the list: what the page was given, plus
    // anything added during this edit. Without it the picker knew the ids but
    // not the names, so it could only report a count.
    const [details, setDetails] = useState(() => new Map(known.map((p) => [Number(p.id), p])));

    const search = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(route('admin.collections.search-products') + '?q=' + encodeURIComponent(query));
            const data = await response.json();
            setSearchResults(data.filter((p) => !selectedIds.includes(p.id)));
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const addProduct = (product) => {
        setDetails((m) => new Map(m).set(Number(product.id), product));
        onChange([...selectedIds, product.id]);
        setSearchResults(searchResults.filter((p) => p.id !== product.id));
    };

    const removeProduct = (id) => onChange(selectedIds.filter((i) => Number(i) !== Number(id)));

    const rows = selectedIds.map((id) => details.get(Number(id)) ?? { id, name: `Product #${id}` });

    return (
        <div className="space-y-3">
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); search(e.target.value); }}
                    placeholder="Search products to add…"
                    className="admin-input w-full"
                />
                {loading && <p className="mt-1 text-[11px] text-gray-400">Searching…</p>}
                {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                        {searchResults.map((product) => (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => addProduct(product)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                            >
                                <span className="h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                                    {product.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-cover" /> : null}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-medium">{product.name}</span>
                                <span className="text-gray-500">${product.price}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                    {rows.length} product{rows.length === 1 ? '' : 's'} in this collection
                </span>
                {rows.length > 0 && (
                    <button
                        type="button"
                        onClick={() => { if (confirm(`Remove all ${rows.length} products from this collection?`)) onChange([]); }}
                        className="text-[11px] text-gray-400 hover:text-red-600"
                    >
                        Remove all
                    </button>
                )}
            </div>

            {rows.length > 0 ? (
                <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
                    {rows.map((p) => (
                        <li key={p.id} className="flex items-center gap-2 px-2 py-1.5">
                            <span className="h-9 w-9 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                                {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs text-gray-900">{p.name}</span>
                                {p.sku ? <span className="block text-[11px] text-gray-400">{p.sku}</span> : null}
                            </span>
                            {p.price ? <span className="text-[11px] text-gray-500">${p.price}</span> : null}
                            <button
                                type="button"
                                onClick={() => removeProduct(p.id)}
                                className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={`Remove ${p.name}`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-xs text-gray-500">
                    No products yet — search above to add some.
                </p>
            )}
        </div>
    );
}

export default function Create({ collection, sortModes, ruleFields, ruleOperators, rulePresets, categories, vendors }) {
    const isEdit = !!collection;

    const { data, setData, post, processing, errors } = useForm({
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
        image: null,
        remove_image: false,
        brochure: null,
        remove_brochure: false,
        ...(isEdit ? { _method: 'put' } : {}),
    });

    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0] || null;
        setData('image', file);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const [preview, setPreview] = useState({ count: 0, products: [] });

    const submit = (e) => {
        e.preventDefault();
        const url = isEdit
            ? route('admin.collections.update', collection.id)
            : route('admin.collections.store');
        post(url, { forceFormData: true });
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

                                {/* Banner Image */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Banner Image
                                    </label>
                                    <p className="mb-2 text-[11px] text-gray-500">
                                        Used as the background of the collection page banner. Recommended 1600×600px. Max 2 MB.
                                    </p>

                                    {(imagePreview || (collection?.image_url && !data.remove_image)) && (
                                        <div className="mb-2 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
                                            <img
                                                src={imagePreview || collection.image_url}
                                                alt=""
                                                className="h-16 w-24 rounded object-cover"
                                            />
                                            <div className="flex-1 text-[11px] text-gray-600">
                                                {imagePreview ? 'New image selected' : 'Current image'}
                                            </div>
                                            {collection?.image_url && !imagePreview && (
                                                <label className="flex items-center gap-1 text-[11px] text-red-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.remove_image}
                                                        onChange={(e) => setData('remove_image', e.target.checked)}
                                                        className="h-3 w-3"
                                                    />
                                                    Remove
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="block w-full text-xs text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                    />
                                    {errors.image && <p className="mt-1 text-xs text-red-600">{errors.image}</p>}
                                </div>

                                {/* Brochure (PDF) */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Brochure (PDF)
                                    </label>
                                    <p className="mb-2 text-[11px] text-gray-500">
                                        Uploaded PDF will be linked from the "Download Brochure" button on the collection page. Max 10 MB.
                                    </p>

                                    {collection?.brochure_url && !data.remove_brochure && (
                                        <div className="mb-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                            <a
                                                href={collection.brochure_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-brand hover:underline"
                                            >
                                                Current brochure (open in new tab)
                                            </a>
                                            <label className="flex items-center gap-1 text-[11px] text-red-600">
                                                <input
                                                    type="checkbox"
                                                    checked={data.remove_brochure}
                                                    onChange={(e) => setData('remove_brochure', e.target.checked)}
                                                    className="h-3 w-3"
                                                />
                                                Remove
                                            </label>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => setData('brochure', e.target.files[0] || null)}
                                        className="block w-full text-xs text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                    />
                                    {data.brochure && (
                                        <p className="mt-1 text-[11px] text-gray-600">
                                            Selected: {data.brochure.name}
                                        </p>
                                    )}
                                    {errors.brochure && <p className="mt-1 text-xs text-red-600">{errors.brochure}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Products. The Manual/Automated switch is gone: these
                            collections are the storefront's filter dimensions and
                            are curated by hand, and the automated branch hid the
                            product list behind a rule builder nobody used. */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h2 className="mb-1 text-xs font-semibold text-gray-900">Products</h2>
                            <p className="mb-3 text-[11px] text-gray-500">
                                What appears under this filter on the storefront.
                            </p>
                            <ProductSelector
                                selectedIds={data.product_ids}
                                known={collection?.products ?? []}
                                onChange={(ids) => setData('product_ids', ids)}
                            />
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
