import DashboardLayout from '@/Layouts/DashboardLayout';
import { groupCollections } from '@/Utils/collectionGroups';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';
import RichTextEditor from '@/Components/Admin/RichTextEditor';
import SpecListInput from '@/Components/Admin/SpecListInput';
import { COLOUR_NAMES, SPEC_LIST_FORMATS } from '@/Support/colours';

// Media Upload Component
/* ── Lifestyle image: upload or paste a URL ──────────────────────────
   Deliberately not part of the Media gallery above. That gallery is the
   tile close-ups; a room-set shot dropped in among them reads as a
   mistake, and the storefront reads this one from its own column. */
function LifestyleImageUploader({ product, value, onChange }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const upload = async (file) => {
        if (!file) return;
        setUploading(true);
        setError(null);

        const body = new FormData();
        body.append('file', file);

        try {
            const res = await fetch(route('admin.products.lifestyle.upload', product.id), {
                method: 'POST',
                body,
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
            });

            const result = await res.json().catch(() => ({}));

            // The old uploader assumed success and showed nothing when the
            // request failed. Surface the reason instead.
            if (!res.ok || !result.success) {
                setError(result.message || `Upload failed (${res.status})`);
                return;
            }

            onChange(result.url);
        } catch (e) {
            setError('Upload failed — check the connection and try again.');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div>
            <div className="flex items-start gap-3">
                {value ? (
                    <img
                        src={value}
                        alt="Lifestyle"
                        className="h-24 w-32 rounded border border-gray-200 object-cover"
                    />
                ) : (
                    <div className="flex h-24 w-32 items-center justify-center rounded border border-dashed border-gray-300 text-[11px] text-gray-400">
                        No image
                    </div>
                )}

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {uploading ? 'Uploading…' : (value ? 'Replace image' : 'Upload image')}
                        </button>

                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => upload(e.target.files?.[0])}
                    />

                    <input
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="admin-input mt-2 w-full"
                        placeholder="https://example.com/lifestyle.jpg"
                    />

                    {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
                    <p className="mt-1 text-[11px] text-gray-400">
                        An upload saves immediately. A pasted URL saves with the product.
                    </p>
                </div>
            </div>
        </div>
    );
}

function MediaUploader({ product, media = [], onUpdate }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState(null);

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
            const result = await response.json().catch(() => ({}));

            // A failed upload used to leave the panel looking untouched: the
            // response was assumed to be JSON and assumed to have succeeded,
            // so a 500 or a validation error showed nothing at all.
            if (!response.ok || !result.success) {
                setError(
                    result.message
                    || (result.errors ? Object.values(result.errors).flat().join(' ') : null)
                    || `Upload failed (${response.status})`
                );
                return;
            }

            setError(null);
            onUpdate?.(result.media);
            router.reload({ only: ['product'] });
        } catch (error) {
            setError('Upload failed — check the connection and try again.');
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

            {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
        </div>
    );
}

// Collections Display Component
function CollectionsCard({ value = [], allCollections = [], onChange }) {
    // One dropdown per storefront filter dimension, because that is what these
    // collections are: colour-white, space-bathroom, finish-matt. A single flat
    // "Select collection…" list of 36 gave no clue which dimension you were
    // setting, and the storefront reads them per dimension.
    const groups = groupCollections(allCollections.filter((c) => c.type === 'manual'));
    const selected = new Set((value ?? []).map(Number));

    const add = (id) => {
        if (!id) return;
        onChange?.([...selected, Number(id)]);
    };

    const remove = (id) => {
        const next = new Set(selected);
        next.delete(Number(id));
        onChange?.([...next]);
    };

    const byId = new Map(allCollections.map((c) => [Number(c.id), c]));

    return (
        <div className="admin-card">
            <h3 className="mb-1 text-xs font-semibold text-gray-900">Collections</h3>
            <p className="mb-3 text-[10px] text-gray-400">
                Where this product appears under “Find your perfect tile”
            </p>

            <div className="space-y-3">
                {groups.map((group) => {
                    const chosen = group.items.filter((c) => selected.has(Number(c.id)));
                    const available = group.items.filter((c) => !selected.has(Number(c.id)));

                    return (
                        <div key={group.key}>
                            <label className="block text-xs font-medium text-gray-700">{group.label}</label>

                            {/* Already chosen, each removable. A tile can be two
                                colours, so this is not a single-value picker. */}
                            {chosen.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {chosen.map((c) => (
                                        <span key={c.id} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                                            {c.title}
                                            <button
                                                type="button"
                                                onClick={() => remove(c.id)}
                                                className="text-blue-400 transition hover:text-red-600"
                                                aria-label={`Remove ${c.title}`}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <select
                                value=""
                                onChange={(e) => add(e.target.value)}
                                disabled={available.length === 0}
                                className="mt-1 admin-select w-full text-xs disabled:opacity-50"
                            >
                                <option value="">
                                    {group.items.length === 0
                                        ? 'None set up yet'
                                        : available.length === 0
                                            ? 'All selected'
                                            : `Add ${group.label.replace('By ', '').toLowerCase()}…`}
                                </option>
                                {available.map((c) => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>

            {/* Anything selected that is no longer in an active collection —
                shown so it can be cleared rather than silently persisting. */}
            {[...selected].filter((id) => !byId.has(id)).length > 0 && (
                <p className="mt-3 text-[10px] text-amber-700">
                    {[...selected].filter((id) => !byId.has(id)).length} selected collection(s) are inactive or deleted.
                </p>
            )}
        </div>
    );
}
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
//
// "Add Option" used to open a Shopify-style option builder — name a Size or
// Colour, add its values, press Generate Variants. This product range is not
// sold that way: a colour is its own product with its own SKU, and the ranges
// are modelled as variant families instead. So the button now opens one field:
// which family this product belongs to.
function VariantsEditor({ variants = [], variantFamilies = [], variantFamilyId = '', onVariantFamilyChange, onVariantUpdate }) {
    const [picking, setPicking] = useState(false);
    const [draft, setDraft] = useState(variantFamilyId ?? '');

    const selected = variantFamilies.find((f) => String(f.id) === String(variantFamilyId));

    const open = () => {
        setDraft(variantFamilyId ?? '');
        setPicking(true);
    };

    const confirm = () => {
        onVariantFamilyChange?.(draft === '' ? '' : parseInt(draft, 10));
        setPicking(false);
    };

    return (
        <div className="admin-card">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-900">Options & Variants</h3>
                <button type="button" onClick={open} className="btn-secondary text-xs">
                    Add Option
                </button>
            </div>

            {picking && (
                <div className="mb-4 rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="variant-family" className="whitespace-nowrap text-xs font-medium text-gray-700">
                            Variant :
                        </label>
                        <select
                            id="variant-family"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            className="admin-input flex-1 text-xs"
                        >
                            <option value="">— None —</option>
                            {variantFamilies.map((family) => (
                                <option key={family.id} value={family.id}>
                                    {family.name}{family.is_active ? '' : ' (inactive)'}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={confirm}
                            title="Apply"
                            aria-label="Apply variant"
                            className="rounded-md bg-brand p-1.5 text-white transition hover:bg-brand-dark"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPicking(false)}
                            title="Cancel"
                            aria-label="Cancel"
                            className="p-1.5 text-gray-400 transition hover:text-gray-600"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* The list is empty until families are created, and an
                        empty dropdown with no explanation reads as a bug. */}
                    {variantFamilies.length === 0 && (
                        <p className="mt-2 text-[11px] text-gray-500">
                            No variant families yet —{' '}
                            <a href="/admin/variant-families" className="font-medium text-brand hover:underline">
                                create one first
                            </a>
                            .
                        </p>
                    )}
                </div>
            )}

            {/* Current assignment, so the answer is visible without opening the picker. */}
            {!picking && (
                <div className="mb-3 flex items-center gap-2 text-xs">
                    <span className="font-medium text-gray-700">Variant :</span>
                    {selected ? (
                        <>
                            <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-800">{selected.name}</span>
                            <button
                                type="button"
                                onClick={() => onVariantFamilyChange?.('')}
                                className="text-gray-400 transition hover:text-red-600"
                                title="Remove from this variant"
                                aria-label="Remove variant"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <span className="text-gray-400">None</span>
                    )}
                </div>
            )}

            {/* Variants Table — Editable */}
            {variants?.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-2 py-1 text-[10px] font-semibold text-gray-600">Variant</th>
                                <th className="px-2 py-1 text-[10px] font-semibold text-gray-600">SKU</th>
                                <th className="px-2 py-1 text-[10px] font-semibold text-gray-600">Price</th>
                                <th className="px-2 py-1 text-[10px] font-semibold text-gray-600">Stock</th>
                                <th className="px-2 py-1 text-[10px] font-semibold text-gray-600">Barcode</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {variants.map((variant, idx) => (
                                <tr key={variant.id || idx}>
                                    <td className="px-2 py-1 text-xs font-medium">{variant.name}</td>
                                    <td className="px-2 py-1">
                                        <input
                                            type="text"
                                            defaultValue={variant.sku || ''}
                                            className="admin-input text-xs w-24"
                                            onBlur={(e) => onVariantUpdate?.(variant.id, 'sku', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <input
                                            type="number"
                                            defaultValue={variant.price || ''}
                                            className="admin-input text-xs w-20"
                                            step="0.01"
                                            onBlur={(e) => onVariantUpdate?.(variant.id, 'price', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <input
                                            type="number"
                                            defaultValue={variant.inventory_quantity || 0}
                                            className="admin-input text-xs w-16"
                                            onBlur={(e) => onVariantUpdate?.(variant.id, 'inventory_quantity', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <input
                                            type="text"
                                            defaultValue={variant.barcode || ''}
                                            className="admin-input text-xs w-28"
                                            placeholder="Barcode"
                                            onBlur={(e) => onVariantUpdate?.(variant.id, 'barcode', e.target.value)}
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

// Helper: slugify
function slugify(text) {
    return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// SEO Preview Component
function SeoPreview({ title, description, slug }) {
    const displayTitle = title || 'Product Title';
    const displayUrl = `ntiled.com.au/products/${slug || 'product-url'}`;
    const displayDesc = description || 'Add a meta description to see how this product will appear in search engine results.';

    return (
        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
            <p className="text-[10px] text-gray-400 mb-1">Search engine listing preview</p>
            <p className="text-[14px] text-[#1a0dab] font-medium leading-tight truncate">{displayTitle}</p>
            <p className="text-[12px] text-green-700 truncate">{displayUrl}</p>
            <p className="text-[12px] text-gray-600 line-clamp-2 leading-relaxed">{displayDesc}</p>
        </div>
    );
}

// Main Edit Component
export default function Edit({ product, categories, vendors, popularTags, statuses, collections = [], productCollections = [], variantFamilies = [] }) {
    const { data, setData, put, processing, errors, isDirty } = useForm({
        name: product?.name ?? '',
        slug: product?.slug ?? '',
        sku: product?.sku ?? '',
        short_description: product?.short_description ?? '',
        description: product?.description ?? '',
        brand: product?.brand ?? '',
        product_type: product?.product_type ?? '',
        category_ids: product?.category_ids ?? [],
        variant_family_id: product?.variant_family_id ?? '',
        collection_ids: (productCollections ?? []).map((c) => Number(c.id)),
        unit_label: product?.unit_label ?? '',
        quantity_label: product?.quantity_label ?? '',
        show_wastage: product?.show_wastage ?? true,
        show_sample: product?.show_sample ?? true,
        show_big_sample: product?.show_big_sample ?? true,
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
        sqm_per_box: product?.sqm_per_box ?? '',
        is_digital: Boolean(product?.is_digital),
        requires_shipping: product?.requires_shipping ?? true,
        status: product?.status ?? 'draft',
        published_at: product?.published_at ?? '',
        lifestyle_image_url: product?.lifestyle_image_url ?? '',
        specifications: product?.specifications ?? {},
        meta_title: product?.meta_title ?? '',
        meta_description: product?.meta_description ?? '',
        noindex: Boolean(product?.noindex),
        is_active: product?.is_active !== false,
        is_featured: Boolean(product?.is_featured),
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
            autosave(product.id, data);
        }
    }, [data, isDirty]);

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

    const handleVariantUpdate = async (variantId, field, value) => {
        if (!variantId) return;
        try {
            await fetch(route('admin.products.variants.update', [product.id, variantId]), {
                method: 'PUT',
                body: JSON.stringify({ [field]: value }),
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Variant update failed:', error);
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
                                        onChange={(e) => {
                                            const newName = e.target.value;
                                            const shouldAutoSlug = !data.slug || data.slug === slugify(data.name);
                                            setData(d => ({
                                                ...d,
                                                name: newName,
                                                ...(shouldAutoSlug ? { slug: slugify(newName) } : {}),
                                            }));
                                        }}
                                        className="mt-1 admin-input w-full"
                                        placeholder="Product title"
                                    />
                                    {errors.name && <div className="mt-1 text-[11px] text-red-600">{errors.name}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Short description</label>
                                    <textarea
                                        value={data.short_description}
                                        onChange={(e) => setData('short_description', e.target.value)}
                                        rows={2}
                                        className="mt-1 admin-textarea w-full"
                                        placeholder="Brief summary for search results and product cards..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                    <RichTextEditor
                                        content={data.description}
                                        onChange={(html) => setData('description', html)}
                                        placeholder="Write your product description..."
                                    />
                                    {errors.description && <div className="mt-1 text-[11px] text-red-600">{errors.description}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Media */}
                        <MediaUploader product={product} media={product?.media} />

                        {/* Lifestyle Image */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-1">Lifestyle Image</h3>
                            <p className="text-[10px] text-gray-400 mb-2">
                                The styled room-set shot. Upload a file, or paste a URL if it is hosted elsewhere.
                            </p>

                            <LifestyleImageUploader
                                product={product}
                                value={data.lifestyle_image_url}
                                onChange={(url) => setData('lifestyle_image_url', url)}
                            />
                        </div>

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
                            <div className="flex items-center gap-6 mb-3">
                                <label className="flex items-center gap-2 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={!data.is_digital}
                                        onChange={(e) => setData('is_digital', !e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand"
                                    />
                                    This is a physical product
                                </label>
                                {!data.is_digital && (
                                    <label className="flex items-center gap-2 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={data.requires_shipping}
                                            onChange={(e) => setData('requires_shipping', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-brand"
                                        />
                                        Requires shipping
                                    </label>
                                )}
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
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">m² per box</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={data.sqm_per_box}
                                            onChange={(e) => setData('sqm_per_box', e.target.value)}
                                            className="mt-1 admin-input w-full"
                                            placeholder="e.g. 1.44"
                                        />
                                        <p className="mt-1 text-[10px] text-gray-400">Coverage per box (used for cart box count)</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product Specifications */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-1">Product Specifications</h3>
                            <p className="text-[10px] text-gray-400 mb-3">These values appear in the specifications panel on the product page. Filling these in overrides spec text embedded in the description.</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'name',               label: 'Name' },
                                    { key: 'style',              label: 'Style' },
                                    { key: 'colour',             label: 'Colours' },
                                    { key: 'finish',             label: 'Finish' },
                                    { key: 'material',           label: 'Material' },
                                    { key: 'size_nominal',       label: 'Size (Nominal)' },
                                    { key: 'thickness',          label: 'Thickness' },
                                    { key: 'core',               label: 'Core' },
                                    { key: 'underlay',           label: 'Underlay' },
                                    { key: 'variation',          label: 'Variation' },
                                    { key: 'application_space',  label: 'Application Space' },
                                    { key: 'pricing',            label: 'Pricing' },
                                    { key: 'country_of_origin',  label: 'Country of Origin' },
                                    { key: 'quantity_per_box',   label: 'Quantity Per Box' },
                                    { key: 'slip_rating',        label: 'Slip Rating' },
                                    { key: 'number_of_faces',    label: 'Number of Faces' },
                                ].map(({ key, label }) => (
                                    <div key={key} className={key === 'variation' || key === 'application_space' ? 'col-span-2' : ''}>
                                        {SPEC_LIST_FORMATS[key] ? (
                                            /* Colour and Finish drive the pickers on the product page,
                                               so they are edited as add/remove chips rather than raw
                                               delimited text. Still stored as the same string. */
                                            <SpecListInput
                                                label={label}
                                                value={data.specifications?.[key] ?? ''}
                                                onChange={(v) => setData('specifications', { ...data.specifications, [key]: v })}
                                                format={SPEC_LIST_FORMATS[key]}
                                                withSwatches={key === 'colour'}
                                                suggestions={key === 'colour' ? COLOUR_NAMES : []}
                                                placeholder={key === 'colour' ? 'e.g. Charcoal' : 'e.g. Matt'}
                                                hint={key === 'colour'
                                                    ? 'Shown as swatches on the product page, in this order.'
                                                    : 'Shown as buttons on the product page, in this order.'}
                                            />
                                        ) : (
                                            <>
                                                <label className="block text-xs font-medium text-gray-700">{label}</label>
                                                <input
                                                    value={data.specifications?.[key] ?? ''}
                                                    onChange={(e) => setData('specifications', { ...data.specifications, [key]: e.target.value })}
                                                    className="mt-1 admin-input w-full"
                                                    placeholder={label}
                                                />
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Variants */}
                        <VariantsEditor
                            variants={product?.variants}
                            variantFamilies={variantFamilies}
                            variantFamilyId={data.variant_family_id}
                            onVariantFamilyChange={(id) => setData('variant_family_id', id)}
                            onVariantUpdate={handleVariantUpdate}
                        />

                        {/* SEO */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Search engine listing</h3>

                            <SeoPreview
                                title={data.meta_title || data.name}
                                description={data.meta_description}
                                slug={data.slug}
                            />

                            <div className="grid grid-cols-1 gap-3 mt-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Page title</label>
                                    <input
                                        value={data.meta_title}
                                        onChange={(e) => setData('meta_title', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder={data.name}
                                    />
                                    <div className="mt-1 text-[10px] text-gray-500">{(data.meta_title || data.name || '').length}/70</div>
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
                                    <div className="mt-1 flex items-center">
                                        <span className="text-xs text-gray-400 mr-1">ntiled.com.au/products/</span>
                                        <input
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            className="admin-input flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700">Hide from search engines</label>
                                        <p className="text-[10px] text-gray-500">Adds noindex tag to prevent indexing</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('noindex', !data.noindex)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${data.noindex ? 'bg-brand' : 'bg-gray-300'}`}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${data.noindex ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                                    </button>
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
                                onChange={(e) => setData((d) => ({
                                    ...d,
                                    status: e.target.value,
                                    // is_active is what nearly every storefront
                                    // query gates on; the server keeps the two in
                                    // step as well, this just keeps the form honest.
                                    is_active: e.target.value === 'published',
                                }))}
                                className="admin-select w-full"
                            >
                                {statuses?.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            {/* One control, two states. The Active toggle and this
                                dropdown used to be separate, which allowed a draft
                                that was still active — and that product stayed
                                listed and sellable. Setting the status now sets
                                both, so Draft means hidden everywhere. */}
                            <p className="mt-2 text-[11px] text-gray-500">
                                {data.status === 'published'
                                    ? 'Live on the website and available to buy.'
                                    : 'Hidden everywhere — shop, search, categories and its own page.'}
                            </p>

                            {/* Hand-picks the home page strip. Only meaningful
                                while the product is Active — a draft is hidden
                                everywhere, this section included — so the box is
                                disabled rather than silently ignored. */}
                            <label className="mt-4 flex cursor-pointer items-start gap-2 border-t border-gray-100 pt-3">
                                <input
                                    type="checkbox"
                                    checked={Boolean(data.is_featured)}
                                    disabled={data.status !== 'published'}
                                    onChange={(e) => setData('is_featured', e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand disabled:opacity-40"
                                />
                                <span>
                                    <span className="block text-xs font-medium text-gray-700">Trending product</span>
                                    <span className="block text-[10px] text-gray-400">
                                        {data.status === 'published'
                                            ? 'Shows in Trending Products on the home page'
                                            : 'Set the product to Active to use this'}
                                    </span>
                                </span>
                            </label>
                        </div>


                        {/* Samples. Sits under Status because it is the same
                            kind of decision: what this product offers on its
                            page. Both default on; Trade lines and Quads/Scotia
                            ship with the free sample off, since neither is
                            something a customer takes a sample of. */}
                        <div className="admin-card">
                            <h3 className="mb-1 text-xs font-semibold text-gray-900">Samples</h3>
                            <p className="mb-3 text-[10px] text-gray-400">
                                Which sample buttons appear on the product page
                            </p>

                            <div className="space-y-3">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(data.show_sample)}
                                        onChange={(e) => setData('show_sample', e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                    />
                                    <span>
                                        <span className="block text-xs font-medium text-gray-700">Get a Sample</span>
                                        <span className="block text-[10px] text-gray-400">
                                            Free sample · max 5 per order · flat $9.99 shipping
                                        </span>
                                    </span>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer border-t border-gray-100 pt-3">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(data.show_big_sample)}
                                        onChange={(e) => setData('show_big_sample', e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                    />
                                    <span>
                                        <span className="block text-xs font-medium text-gray-700">Get a Big Sample</span>
                                        <span className="block text-[10px] text-gray-400">
                                            Full-size tile · sends the customer to the contact page
                                        </span>
                                    </span>
                                </label>
                            </div>

                            {!data.show_sample && !data.show_big_sample && (
                                <p className="mt-3 text-[10px] text-amber-700">
                                    No sample buttons will show on this product.
                                </p>
                            )}
                        </div>

                        {/* Buy box */}
                        <div className="admin-card">
                            <h3 className="mb-1 text-xs font-semibold text-gray-900">Buy box</h3>
                            <p className="mb-3 text-[10px] text-gray-400">
                                How this product is bought on its page
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Unit</label>
                                    <input
                                        value={data.unit_label}
                                        onChange={(e) => setData('unit_label', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="e.g. sqm, pcs, box"
                                        maxLength={30}
                                    />
                                    <p className="mt-1 text-[10px] text-gray-400">
                                        Shown after the price and in the quantity box. Leave empty to show no unit.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Quantity label</label>
                                    <input
                                        value={data.quantity_label}
                                        onChange={(e) => setData('quantity_label', e.target.value)}
                                        className="mt-1 admin-input w-full"
                                        placeholder="e.g. Area, Qty"
                                        maxLength={30}
                                    />
                                    <p className="mt-1 text-[10px] text-gray-400">
                                        The word before the − 1 + box. Leave empty for just the stepper.
                                    </p>
                                </div>

                                {/* Live preview — the two fields are easier to
                                    judge against the real thing than a label. */}
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Preview</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        ${parseFloat(data.price || 0).toFixed(2)}
                                        {data.unit_label ? <span className="ml-1 text-[11px] font-normal text-gray-500">/ {data.unit_label}</span> : null}
                                    </p>
                                    <div className="mt-2 inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs">
                                        {data.quantity_label ? <span className="font-semibold text-gray-700">{data.quantity_label}</span> : null}
                                        <span className="text-gray-400">−</span>
                                        <span className="font-bold text-gray-900">1</span>
                                        {data.unit_label ? <span className="text-gray-500">{data.unit_label}</span> : null}
                                        <span className="text-gray-400">+</span>
                                    </div>
                                </div>

                                <label className="flex cursor-pointer items-start gap-2 border-t border-gray-100 pt-3">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(data.show_wastage)}
                                        onChange={(e) => setData('show_wastage', e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                    />
                                    <span>
                                        <span className="block text-xs font-medium text-gray-700">Show wastage &amp; box calculator</span>
                                        <span className="block text-[10px] text-gray-400">
                                            The “add 10% wastage” toggle, “we round up to the full box”, and the box subtotal line
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Organization */}
                        <div className="admin-card">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Organization</h3>
                            <div className="space-y-3">
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
                            </div>
                        </div>

                        {/* Collections */}
                        <CollectionsCard
                            value={data.collection_ids}
                            allCollections={collections}
                            onChange={(ids) => setData('collection_ids', ids)}
                        />
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
