import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';

// Media Upload Component
function MediaUploader({ product, media = [], onUpdate }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleUpload = async (files) => {
        if (!files?.length) return;
        setUploading(true);

        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('files[]', file));

        try {
            const response = await fetch(route('admin.products.media.upload', product.id), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
            });
            const result = await response.json();
            if (result.success) {
                onUpdate?.(result.media);
                router.reload({ only: ['product'] });
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (mediaId) => {
        if (!confirm('Delete this media?')) return;

        try {
            await fetch(route('admin.products.media.delete', [product.id, mediaId]), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Content-Type': 'application/json',
                },
            });
            router.reload({ only: ['product'] });
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleSetPrimary = async (mediaId) => {
        try {
            await fetch(route('admin.products.media.primary', [product.id, mediaId]), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Content-Type': 'application/json',
                },
            });
            router.reload({ only: ['product'] });
        } catch (error) {
            console.error('Set primary failed:', error);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleUpload(e.dataTransfer.files);
    };

    return (
        <div className="admin-card">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Media</h3>

            {/* Uploaded Media Grid */}
            {media?.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {media.map((m) => (
                        <div key={m.id} className="relative group">
                            <img
                                src={m.url}
                                alt={m.filename}
                                className={`w-full h-20 object-cover rounded-md ${m.is_primary ? 'ring-2 ring-brand' : ''}`}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-1">
                                {!m.is_primary && (
                                    <button
                                        type="button"
                                        onClick={() => handleSetPrimary(m.id)}
                                        className="p-1 bg-white rounded text-gray-700 hover:bg-gray-100"
                                        title="Set as primary"
                                    >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleDelete(m.id)}
                                    className="p-1 bg-white rounded text-red-600 hover:bg-red-50"
                                    title="Delete"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                            {m.is_primary && (
                                <span className="absolute top-1 left-1 bg-brand text-white text-[9px] px-1 rounded">Primary</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                />
                {uploading ? (
                    <div className="text-xs text-gray-500">Uploading...</div>
                ) : (
                    <>
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-xs text-gray-500">Drop files or click to upload</p>
                        <p className="text-[10px] text-gray-400">Images & videos up to 100MB</p>
                    </>
                )}
            </div>
        </div>
    );
}

// Collections Display Component
function CollectionsCard({ productCollections = [], allCollections = [], productId, onUpdate }) {
    const [isAdding, setIsAdding] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState('');

    const availableCollections = allCollections.filter(
        c => c.type === 'manual' && !productCollections.some(pc => pc.id === c.id)
    );

    const handleAddToCollection = async () => {
        if (!selectedCollection) return;

        try {
            const response = await fetch(route('admin.collections.add-product', selectedCollection), {
                method: 'POST',
                body: JSON.stringify({ product_id: productId }),
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                onUpdate?.();
            }
        } catch (error) {
            console.error('Failed to add to collection:', error);
        }
        setSelectedCollection('');
        setIsAdding(false);
    };

    const handleRemoveFromCollection = async (collectionId) => {
        if (!confirm('Remove product from this collection?')) return;

        try {
            const response = await fetch(route('admin.collections.remove-product', collectionId), {
                method: 'POST',
                body: JSON.stringify({ product_id: productId }),
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                onUpdate?.();
            }
        } catch (error) {
            console.error('Failed to remove from collection:', error);
        }
    };

    return (
        <div className="admin-card">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-900">Collections</h3>
                {!isAdding && availableCollections.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="text-xs text-brand hover:text-brand/80"
                    >
                        Add to collection
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-3 flex gap-2">
                    <select
                        value={selectedCollection}
                        onChange={(e) => setSelectedCollection(e.target.value)}
                        className="admin-select flex-1 text-xs"
                    >
                        <option value="">Select collection...</option>
                        {availableCollections.map((c) => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleAddToCollection}
                        className="btn-primary text-xs px-2"
                        disabled={!selectedCollection}
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="btn-secondary text-xs px-2"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {productCollections.length > 0 ? (
                <div className="space-y-2">
                    {productCollections.map((collection) => (
                        <div
                            key={collection.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${collection.type === 'automated' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                <span className="font-medium">{collection.title}</span>
                                <span className="text-gray-400 text-[10px]">
                                    ({collection.type})
                                </span>
                            </div>
                            {collection.type === 'manual' && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFromCollection(collection.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-500">Not in any collections</p>
            )}

            {productCollections.some(c => c.type === 'automated') && (
                <p className="mt-2 text-[10px] text-gray-400">
                    Automated collections are managed by rules
                </p>
            )}
        </div>
    );
}

// Tag Input Component
function TagInput({ tags = [], onChange, popularTags = [] }) {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input.trim());
        } else if (e.key === 'Backspace' && !input && tags.length) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = (name) => {
        if (!name || tags.some(t => t.name.toLowerCase() === name.toLowerCase())) return;
        onChange([...tags, { name, source: 'manual' }]);
        setInput('');
        setSuggestions([]);
    };

    const removeTag = (index) => {
        onChange(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="admin-card">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Tags</h3>

            <div className="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-md min-h-[38px] focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                {tags.map((tag, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-full"
                    >
                        {tag.name}
                        <button type="button" onClick={() => removeTag(idx)} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-[100px] text-xs border-0 p-0 focus:ring-0"
                    placeholder={tags.length ? '' : 'Add tags...'}
                />
            </div>

            {popularTags?.length > 0 && (
                <div className="mt-2">
                    <span className="text-[10px] text-gray-500">Popular: </span>
                    {popularTags.slice(0, 8).map((tag) => (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => addTag(tag.name)}
                            className="text-[10px] text-brand hover:underline mr-2"
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Variants Editor Component
function VariantsEditor({ options = [], variants = [], onChange, onGenerateVariants }) {
    const [localOptions, setLocalOptions] = useState(options);

    const addOption = () => {
        setLocalOptions([...localOptions, { name: '', values: [] }]);
    };

    const updateOption = (index, field, value) => {
        const updated = [...localOptions];
        updated[index] = { ...updated[index], [field]: value };
        setLocalOptions(updated);
    };

    const removeOption = (index) => {
        setLocalOptions(localOptions.filter((_, i) => i !== index));
    };

    const addOptionValue = (optionIndex, value) => {
        if (!value.trim()) return;
        const updated = [...localOptions];
        updated[optionIndex].values = [...(updated[optionIndex].values || []), value.trim()];
        setLocalOptions(updated);
    };

    const removeOptionValue = (optionIndex, valueIndex) => {
        const updated = [...localOptions];
        updated[optionIndex].values = updated[optionIndex].values.filter((_, i) => i !== valueIndex);
        setLocalOptions(updated);
    };

    const handleGenerateVariants = () => {
        onGenerateVariants?.(localOptions);
    };

    return (
        <div className="admin-card">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-900">Options & Variants</h3>
                <button type="button" onClick={addOption} className="btn-secondary text-xs">
                    Add Option
                </button>
            </div>

            {/* Options */}
            {localOptions.map((option, optIdx) => (
                <div key={optIdx} className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="text"
                            value={option.name}
                            onChange={(e) => updateOption(optIdx, 'name', e.target.value)}
                            placeholder="Option name (e.g., Size, Color)"
                            className="admin-input flex-1 text-xs"
                        />
                        <button
                            type="button"
                            onClick={() => removeOption(optIdx)}
                            className="text-red-500 hover:text-red-700 p-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {option.values?.map((val, valIdx) => (
                            <span key={valIdx} className="inline-flex items-center gap-1 bg-white border text-gray-700 text-[11px] px-2 py-0.5 rounded">
                                {typeof val === 'string' ? val : val.value}
                                <button type="button" onClick={() => removeOptionValue(optIdx, valIdx)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            placeholder="Add value"
                            className="admin-input text-xs w-24"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addOptionValue(optIdx, e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            ))}

            {localOptions.length > 0 && (
                <button type="button" onClick={handleGenerateVariants} className="btn-primary text-xs w-full">
                    Generate Variants
                </button>
            )}

            {/* Variants Table */}
            {variants?.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-2 py-1 text-[10px] font-semibold text-gray-600">Variant</th>
                                <th className="px-2 py-1 text-[10px] font-semibold text-gray-600">SKU</th>
                                <th className="px-2 py-1 text-[10px] font-semibold text-gray-600">Price</th>
                                <th className="px-2 py-1 text-[10px] font-semibold text-gray-600">Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {variants.map((variant, idx) => (
                                <tr key={variant.id || idx}>
                                    <td className="px-2 py-1 text-xs">{variant.name}</td>
                                    <td className="px-2 py-1">
                                        <input
                                            type="text"
                                            value={variant.sku || ''}
                                            className="admin-input text-xs w-24"
                                            readOnly
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <input
                                            type="number"
                                            value={variant.price || ''}
                                            className="admin-input text-xs w-20"
                                            step="0.01"
                                            readOnly
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <input
                                            type="number"
                                            value={variant.inventory_quantity || 0}
                                            className="admin-input text-xs w-16"
                                            readOnly
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Main Edit Component
export default function Edit({ product, categories, vendors, popularTags, statuses, collections = [], productCollections = [] }) {
    const { data, setData, put, processing, errors, isDirty } = useForm({
        name: product?.name ?? '',
        slug: product?.slug ?? '',
        sku: product?.sku ?? '',
        short_description: product?.short_description ?? '',
        description: product?.description ?? '',
        brand: product?.brand ?? '',
        product_type: product?.product_type ?? '',
        category_ids: product?.category_ids ?? [],
        seller_id: product?.seller_id ?? '',
        price: product?.price ?? '',
        compare_at_price: product?.compare_at_price ?? '',
        cost: product?.cost ?? '',
        inventory_quantity: product?.inventory_quantity ?? 0,
        inventory_policy: product?.inventory_policy ?? 'deny',
        weight: product?.weight ?? '',
        length_mm: product?.length_mm ?? '',
        width_mm: product?.width_mm ?? '',
        height_mm: product?.height_mm ?? '',
        is_digital: Boolean(product?.is_digital),
        requires_shipping: product?.requires_shipping ?? true,
        status: product?.status ?? 'draft',
        published_at: product?.published_at ?? '',
        meta_title: product?.meta_title ?? '',
        meta_description: product?.meta_description ?? '',
        noindex: Boolean(product?.noindex),
        tags: product?.tags ?? [],
    });

    const [lastSaved, setLastSaved] = useState(null);

    // Autosave
    const autosave = useCallback(
        debounce(async (productId, saveData) => {
            try {
                const response = await fetch(route('admin.products.autosave', productId), {
                    method: 'POST',
                    body: JSON.stringify(saveData),
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                        'Content-Type': 'application/json',
                    },
                });
                const result = await response.json();
                if (result.success) {
                    setLastSaved(new Date(result.saved_at));
                }
            } catch (error) {
                console.error('Autosave failed:', error);
            }
        }, 3000),
        []
    );

    useEffect(() => {
        if (isDirty && product?.id && data.status === 'draft') {
            autosave(product.id, { name: data.name, description: data.description, price: data.price });
        }
    }, [data.name, data.description, data.price, isDirty]);

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.products.update', product.id));
    };

    const destroy = () => {
        if (!confirm(`Delete product "${product.name}"?`)) return;
        router.delete(route('admin.products.destroy', product.id));
    };

    const duplicate = () => {
        if (!confirm(`Duplicate product "${product.name}"?`)) return;
        router.post(route('admin.products.duplicate', product.id));
    };

    const updateStatus = (status, publishAt = null) => {
        router.post(route('admin.products.status', product.id), { status, published_at: publishAt });
    };

    const handleGenerateVariants = async (options) => {
        try {
            await fetch(route('admin.products.variants.generate', product.id), {
                method: 'POST',
                body: JSON.stringify({ options }),
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Content-Type': 'application/json',
                },
            });
            router.reload({ only: ['product'] });
        } catch (error) {
            console.error('Generate variants failed:', error);
        }
    };

    return (
        <DashboardLayout title="Edit Product">
            <Head title={`Edit: ${product?.name || 'Product'}`} />

            <form onSubmit={submit}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.products.index')} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">{product?.name || 'New Product'}</div>
                            {lastSaved && (
                                <div className="text-[10px] text-gray-500">
                                    Last saved: {lastSaved.toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={duplicate} className="btn-secondary text-xs">
                            Duplicate
                        </button>
                        <button type="button" onClick={destroy} className="btn-secondary text-red-600 hover:bg-red-50 text-xs">
                            Delete
                        </button>
                        <button type="submit" disabled={processing} className="btn-primary text-xs">
                            {processing ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Basic Info */}
                        <div className="admin-card">
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Title</label>
                                    <input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="Product title"
                                    />
                                    {errors.name && <div className="mt-1 text-[11px] text-red-600">{errors.name}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={6}
                                        className="mt-1 admin-textarea w-full"
                                        placeholder="Product description..."
                                    />
                                    {errors.description && <div className="mt-1 text-[11px] text-red-600">{errors.description}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Media */}
                        <MediaUploader product={product} media={product?.media} />

                        {/* Pricing */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Pricing</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="0.00"
                                    />
                                    {errors.price && <div className="mt-1 text-[11px] text-red-600">{errors.price}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Compare at price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.compare_at_price}
                                        onChange={(e) => setData('compare_at_price', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Cost per item</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.cost}
                                        onChange={(e) => setData('cost', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Inventory</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">SKU</label>
                                    <input
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="SKU-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Quantity</label>
                                    <input
                                        type="number"
                                        value={data.inventory_quantity}
                                        onChange={(e) => setData('inventory_quantity', parseInt(e.target.value) || 0)}
                                        className="mt-1 admin-input w-full"
                                    />
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700">When sold out</label>
                                <select
                                    value={data.inventory_policy}
                                    onChange={(e) => setData('inventory_policy', e.target.value)}
                                    className="mt-1 admin-select w-full"
                                >
                                    <option value="deny">Stop selling</option>
                                    <option value="continue">Continue selling</option>
                                </select>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Shipping</h3>
                            <div className="flex items-center gap-4 mb-3">
                                <label className="flex items-center gap-2 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={!data.is_digital}
                                        onChange={(e) => setData('is_digital', !e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand"
                                    />
                                    This is a physical product
                                </label>
                            </div>
                            {!data.is_digital && (
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.weight}
                                            onChange={(e) => setData('weight', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Length (mm)</label>
                                        <input
                                            type="number"
                                            value={data.length_mm}
                                            onChange={(e) => setData('length_mm', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Width (mm)</label>
                                        <input
                                            type="number"
                                            value={data.width_mm}
                                            onChange={(e) => setData('width_mm', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Height (mm)</label>
                                        <input
                                            type="number"
                                            value={data.height_mm}
                                            onChange={(e) => setData('height_mm', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Variants */}
                        <VariantsEditor
                            options={product?.options}
                            variants={product?.variants}
                            onGenerateVariants={handleGenerateVariants}
                        />

                        {/* SEO */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Search engine listing</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Page title</label>
                                    <input
                                        value={data.meta_title}
                                        onChange={(e) => setData('meta_title', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder={data.name}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Meta description</label>
                                    <textarea
                                        value={data.meta_description}
                                        onChange={(e) => setData('meta_description', e.target.value)}
                                        rows={2}
                                        className="mt-1 admin-textarea w-full"
                                        maxLength={160}
                                    />
                                    <div className="mt-1 text-[10px] text-gray-500">{data.meta_description?.length || 0}/160</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">URL handle</label>
                                    <input
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Status */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Status</h3>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="admin-select w-full"
                            >
                                {statuses?.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            {data.status === 'scheduled' && (
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-700">Publish date</label>
                                    <input
                                        type="datetime-local"
                                        value={data.published_at ? data.published_at.slice(0, 16) : ''}
                                        onChange={(e) => setData('published_at', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Organization */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Organization</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Product type</label>
                                    <input
                                        value={data.product_type}
                                        onChange={(e) => setData('product_type', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="e.g., Shoes, Electronics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Vendor</label>
                                    <select
                                        value={data.seller_id ?? ''}
                                        onChange={(e) => setData('seller_id', e.target.value || null)}
                                        className="mt-1 admin-select w-full"
                                    >
                                        <option value="">Select vendor</option>
                                        {vendors?.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Categories</label>
                                    <select
                                        multiple
                                        value={data.category_ids?.map(String) || []}
                                        onChange={(e) => setData('category_ids', Array.from(e.target.selectedOptions, o => parseInt(o.value)))}
                                        className="mt-1 admin-select w-full h-32"
                                    >
                                        {categories?.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="mt-1 text-[10px] text-gray-500">Hold Ctrl/Cmd to select multiple</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Brand</label>
                                    <input
                                        value={data.brand}
                                        onChange={(e) => setData('brand', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <TagInput
                            tags={data.tags}
                            onChange={(tags) => setData('tags', tags)}
                            popularTags={popularTags}
                        />

                        {/* Collections */}
                        <CollectionsCard
                            productCollections={productCollections}
                            allCollections={collections}
                            productId={product?.id}
                            onUpdate={() => router.reload({ only: ['productCollections'] })}
                        />
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
