import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { useState, useRef } from 'react';

// Trash icon
function TrashIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

// Upload icon
function UploadIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

// Chevron icons for reordering
function ChevronUpIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
    );
}

function ChevronDownIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}

// Single slide editor card
function SlideCard({ slide, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, errors = {} }) {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(slide.image_url || null);

    const updateField = (field, value) => {
        onChange({ ...slide, [field]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            // Store the file object for upload
            updateField('image_file', file);
            updateField('image_path', null); // Clear existing path when new file selected
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl(null);
        updateField('image_file', null);
        updateField('image_path', null);
        updateField('image_url', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="admin-card border-l-4 border-l-brand">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                        Slide {index + 1}
                    </span>
                    {!slide.is_active && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                            Inactive
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="btn-ghost p-1.5 disabled:opacity-30"
                        title="Move up"
                    >
                        <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="btn-ghost p-1.5 disabled:opacity-30"
                        title="Move down"
                    >
                        <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="btn-ghost p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                        title="Remove slide"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Left column - Image upload */}
                <div>
                    <InputLabel value="Image" required />
                    <div className="mt-1">
                        {previewUrl ? (
                            <div className="relative">
                                <img
                                    src={previewUrl}
                                    alt="Slide preview"
                                    className="h-40 w-full rounded-lg border border-gray-200 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow hover:bg-red-600"
                                    title="Remove image"
                                >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-brand hover:bg-brand/5"
                            >
                                <UploadIcon className="h-8 w-8 text-gray-400" />
                                <span className="mt-2 text-xs font-medium text-gray-600">Click to upload</span>
                                <span className="mt-1 text-[10px] text-gray-400">Min 1600x800, Recommended 1920x960</span>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                    <InputError message={errors?.image_file} />

                    <div className="mt-3">
                        <InputLabel value="Image Alt Text (Dictionary Key)" />
                        <input
                            className="admin-input"
                            value={slide.image_alt_key || ''}
                            onChange={(e) => updateField('image_alt_key', e.target.value)}
                            placeholder="hero.slide1.image_alt"
                        />
                    </div>
                </div>

                {/* Right column - Content fields */}
                <div className="space-y-3">
                    <div>
                        <InputLabel value="H1 Title (Dictionary Key)" required />
                        <input
                            className="admin-input"
                            value={slide.h1_key || ''}
                            onChange={(e) => updateField('h1_key', e.target.value)}
                            placeholder="hero.slide1.title"
                        />
                        <InputError message={errors?.h1_key} />
                    </div>

                    <div>
                        <InputLabel value="Paragraph (Dictionary Key)" required />
                        <input
                            className="admin-input"
                            value={slide.p_key || ''}
                            onChange={(e) => updateField('p_key', e.target.value)}
                            placeholder="hero.slide1.description"
                        />
                        <InputError message={errors?.p_key} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel value="Overlay Style" />
                            <select
                                className="admin-select"
                                value={slide.overlay_style || 'dark'}
                                onChange={(e) => updateField('overlay_style', e.target.value)}
                            >
                                <option value="dark">Dark (white text)</option>
                                <option value="light">Light (dark text)</option>
                            </select>
                        </div>

                        <div>
                            <InputLabel value="Alignment" />
                            <select
                                className="admin-select"
                                value={slide.align || 'left'}
                                onChange={(e) => updateField('align', e.target.value)}
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Buttons Section */}
            <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="text-xs font-semibold text-gray-700 mb-3">Call to Action Buttons</div>
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Primary CTA */}
                    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Primary Button</div>
                        <div>
                            <InputLabel value="Label (Dictionary Key)" className="text-xs" />
                            <input
                                className="admin-input h-8 text-xs"
                                value={slide.cta_primary_label_key || ''}
                                onChange={(e) => updateField('cta_primary_label_key', e.target.value)}
                                placeholder="hero.cta.shop_now"
                            />
                        </div>
                        <div>
                            <InputLabel value="URL" className="text-xs" />
                            <input
                                className="admin-input h-8 text-xs"
                                value={slide.cta_primary_href || ''}
                                onChange={(e) => updateField('cta_primary_href', e.target.value)}
                                placeholder="/shop"
                            />
                            <InputError message={errors?.cta_primary_href} />
                        </div>
                    </div>

                    {/* Secondary CTA */}
                    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Secondary Button</div>
                        <div>
                            <InputLabel value="Label (Dictionary Key)" className="text-xs" />
                            <input
                                className="admin-input h-8 text-xs"
                                value={slide.cta_secondary_label_key || ''}
                                onChange={(e) => updateField('cta_secondary_label_key', e.target.value)}
                                placeholder="hero.cta.learn_more"
                            />
                        </div>
                        <div>
                            <InputLabel value="URL" className="text-xs" />
                            <input
                                className="admin-input h-8 text-xs"
                                value={slide.cta_secondary_href || ''}
                                onChange={(e) => updateField('cta_secondary_href', e.target.value)}
                                placeholder="/about"
                            />
                            <InputError message={errors?.cta_secondary_href} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Active toggle and sort */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={slide.is_active !== false}
                        onChange={(e) => updateField('is_active', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700">Active</span>
                </label>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Sort Order:</span>
                    <input
                        type="number"
                        className="admin-input h-8 w-20 text-xs"
                        value={slide.sort ?? (index + 1) * 10}
                        onChange={(e) => updateField('sort', parseInt(e.target.value) || 0)}
                        min="0"
                        max="10000"
                    />
                </div>
            </div>
        </div>
    );
}

// Main HeroSlidesEditor component
export default function HeroSlidesEditor({ value = [], onChange, errors = {} }) {
    const slides = value ?? [];
    const maxSlides = 6;

    const updateSlide = (index, updatedSlide) => {
        const next = slides.map((s, i) => (i === index ? updatedSlide : s));
        onChange(next);
    };

    const addSlide = () => {
        if (slides.length >= maxSlides) return;

        onChange([
            ...slides,
            {
                is_active: true,
                sort: (slides.length + 1) * 10,
                image_path: null,
                image_alt_key: '',
                h1_key: '',
                p_key: '',
                cta_primary_label_key: '',
                cta_primary_href: '',
                cta_secondary_label_key: '',
                cta_secondary_href: '',
                overlay_style: 'dark',
                align: 'left',
            },
        ]);
    };

    const removeSlide = (index) => {
        onChange(slides.filter((_, i) => i !== index));
    };

    const moveSlide = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= slides.length) return;

        const next = [...slides];
        const temp = next[index];
        next[index] = next[newIndex];
        next[newIndex] = temp;

        // Update sort values
        next.forEach((slide, i) => {
            slide.sort = (i + 1) * 10;
        });

        onChange(next);
    };

    // Parse nested errors
    const getSlideErrors = (index) => {
        const slideErrors = {};
        Object.entries(errors).forEach(([key, message]) => {
            const match = key.match(new RegExp(`^hero_slides\\.${index}\\.(.+)$`));
            if (match) {
                slideErrors[match[1]] = message;
            }
        });
        return slideErrors;
    };

    return (
        <div className="space-y-4">
            <div className="admin-card">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Hero Banner Slides</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Configure up to {maxSlides} slides for the home page carousel. Images should be at least 1600x800px (recommended 1920x960px).
                        </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {slides.length} / {maxSlides} slides
                    </span>
                </div>
            </div>

            {/* Slides list */}
            {slides.map((slide, index) => (
                <SlideCard
                    key={index}
                    slide={slide}
                    index={index}
                    onChange={(updated) => updateSlide(index, updated)}
                    onRemove={() => removeSlide(index)}
                    onMoveUp={() => moveSlide(index, -1)}
                    onMoveDown={() => moveSlide(index, 1)}
                    isFirst={index === 0}
                    isLast={index === slides.length - 1}
                    errors={getSlideErrors(index)}
                />
            ))}

            {/* Add slide button */}
            {slides.length < maxSlides && (
                <button
                    type="button"
                    onClick={addSlide}
                    className="btn-primary w-full"
                >
                    + Add Slide
                </button>
            )}

            {slides.length === 0 && (
                <div className="admin-card text-center py-8">
                    <UploadIcon className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">No slides configured</p>
                    <p className="text-xs text-gray-400">Click "Add Slide" to create your first hero banner</p>
                </div>
            )}
        </div>
    );
}
