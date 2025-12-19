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

// Chevron icons
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

// Toggle Switch component
function Toggle({ checked, onChange, label }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`${
                    checked ? 'bg-brand' : 'bg-gray-200'
                } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2`}
            >
                <span
                    className={`${
                        checked ? 'translate-x-4' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
            <span className="text-xs font-medium text-gray-700">{label}</span>
        </label>
    );
}

// Section Card wrapper
function SectionCard({ title, description, enabled, onToggle, children }) {
    return (
        <div className={`admin-card ${!enabled ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    {description && (
                        <p className="mt-1 text-xs text-gray-500">{description}</p>
                    )}
                </div>
                <Toggle checked={enabled} onChange={onToggle} label="Enabled" />
            </div>
            {enabled && children}
        </div>
    );
}

// Category Carousel Section Editor
function CategoryCarouselEditor({ value, onChange, categories = [] }) {
    return (
        <SectionCard
            title="Category Carousel"
            description="Display featured categories in a scrollable carousel"
            enabled={value?.enabled !== false}
            onToggle={(enabled) => onChange({ ...value, enabled })}
        >
            <div className="space-y-4">
                <div>
                    <InputLabel value="Section Title (Dictionary Key)" />
                    <input
                        className="admin-input"
                        value={value?.title_key || ''}
                        onChange={(e) => onChange({ ...value, title_key: e.target.value })}
                        placeholder="home.categories.title"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel value="Display Limit" />
                        <input
                            type="number"
                            className="admin-input"
                            value={value?.limit || 12}
                            onChange={(e) => onChange({ ...value, limit: parseInt(e.target.value) || 12 })}
                            min="1"
                            max="24"
                        />
                    </div>
                    <div>
                        <InputLabel value="Sort Order" />
                        <input
                            type="number"
                            className="admin-input"
                            value={value?.sort || 1}
                            onChange={(e) => onChange({ ...value, sort: parseInt(e.target.value) || 1 })}
                            min="1"
                            max="100"
                        />
                    </div>
                </div>

                <div>
                    <InputLabel value="Featured Categories (leave empty for all)" />
                    <select
                        multiple
                        className="admin-select h-32"
                        value={value?.category_ids || []}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                            onChange({ ...value, category_ids: selected });
                        }}
                    >
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
                </div>
            </div>
        </SectionCard>
    );
}

// New Arrivals Section Editor
function NewArrivalsEditor({ value, onChange, categories = [] }) {
    return (
        <SectionCard
            title="New Arrivals"
            description="Display recently added products"
            enabled={value?.enabled !== false}
            onToggle={(enabled) => onChange({ ...value, enabled })}
        >
            <div className="space-y-4">
                <div>
                    <InputLabel value="Section Title (Dictionary Key)" />
                    <input
                        className="admin-input"
                        value={value?.title_key || ''}
                        onChange={(e) => onChange({ ...value, title_key: e.target.value })}
                        placeholder="home.new_arrivals.title"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel value="Display Limit" />
                        <input
                            type="number"
                            className="admin-input"
                            value={value?.limit || 8}
                            onChange={(e) => onChange({ ...value, limit: parseInt(e.target.value) || 8 })}
                            min="1"
                            max="24"
                        />
                    </div>
                    <div>
                        <InputLabel value="Sort Order" />
                        <input
                            type="number"
                            className="admin-input"
                            value={value?.sort || 2}
                            onChange={(e) => onChange({ ...value, sort: parseInt(e.target.value) || 2 })}
                            min="1"
                            max="100"
                        />
                    </div>
                </div>

                <div>
                    <InputLabel value="Filter by Category (optional)" />
                    <select
                        className="admin-select"
                        value={value?.category_id || ''}
                        onChange={(e) => onChange({ ...value, category_id: e.target.value ? parseInt(e.target.value) : null })}
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </SectionCard>
    );
}

// Video Section Editor
function VideoSectionEditor({ value, onChange }) {
    const fileInputRef = useRef(null);
    const posterInputRef = useRef(null);

    return (
        <SectionCard
            title="Video Section"
            description="Display a promotional video with overlay text"
            enabled={value?.enabled === true}
            onToggle={(enabled) => onChange({ ...value, enabled })}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel value="Heading (Dictionary Key)" />
                        <input
                            className="admin-input"
                            value={value?.heading_key || ''}
                            onChange={(e) => onChange({ ...value, heading_key: e.target.value })}
                            placeholder="home.video.heading"
                        />
                    </div>
                    <div>
                        <InputLabel value="Subheading (Dictionary Key)" />
                        <input
                            className="admin-input"
                            value={value?.subheading_key || ''}
                            onChange={(e) => onChange({ ...value, subheading_key: e.target.value })}
                            placeholder="home.video.subheading"
                        />
                    </div>
                </div>

                <div>
                    <InputLabel value="Video Type" />
                    <select
                        className="admin-select"
                        value={value?.video_type || 'embed'}
                        onChange={(e) => onChange({ ...value, video_type: e.target.value })}
                    >
                        <option value="embed">YouTube/Vimeo Embed</option>
                        <option value="upload">Uploaded Video</option>
                    </select>
                </div>

                {value?.video_type === 'embed' ? (
                    <div>
                        <InputLabel value="Embed URL" />
                        <input
                            className="admin-input"
                            value={value?.embed_url || ''}
                            onChange={(e) => onChange({ ...value, embed_url: e.target.value })}
                            placeholder="https://www.youtube.com/embed/..."
                        />
                        <p className="mt-1 text-xs text-gray-500">Use the embed URL from YouTube or Vimeo</p>
                    </div>
                ) : (
                    <div>
                        <InputLabel value="Video File" />
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn-secondary"
                            >
                                {value?.video_file_path ? 'Change Video' : 'Upload Video'}
                            </button>
                            {value?.video_file_path && (
                                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {value.video_file_path}
                                </span>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    onChange({ ...value, video_file: file });
                                }
                            }}
                            className="hidden"
                        />
                    </div>
                )}

                <div>
                    <InputLabel value="Poster Image (Video Thumbnail)" />
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => posterInputRef.current?.click()}
                            className="btn-secondary"
                        >
                            {value?.poster_path ? 'Change Poster' : 'Upload Poster'}
                        </button>
                        {value?.poster_path && (
                            <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                {value.poster_path}
                            </span>
                        )}
                    </div>
                    <input
                        ref={posterInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                onChange({ ...value, poster_file: file });
                            }
                        }}
                        className="hidden"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel value="CTA Label (Dictionary Key)" />
                        <input
                            className="admin-input"
                            value={value?.cta_label_key || ''}
                            onChange={(e) => onChange({ ...value, cta_label_key: e.target.value })}
                            placeholder="home.video.cta"
                        />
                    </div>
                    <div>
                        <InputLabel value="CTA URL" />
                        <input
                            className="admin-input"
                            value={value?.cta_href || ''}
                            onChange={(e) => onChange({ ...value, cta_href: e.target.value })}
                            placeholder="/shop"
                        />
                    </div>
                </div>

                <div>
                    <InputLabel value="Sort Order" />
                    <input
                        type="number"
                        className="admin-input w-32"
                        value={value?.sort || 3}
                        onChange={(e) => onChange({ ...value, sort: parseInt(e.target.value) || 3 })}
                        min="1"
                        max="100"
                    />
                </div>
            </div>
        </SectionCard>
    );
}

// Discount Tile Carousel Editor
function DiscountTileEditor({ value, onChange }) {
    return (
        <SectionCard
            title="Discount Tile Carousel"
            description="Display products with active discounts"
            enabled={value?.enabled !== false}
            onToggle={(enabled) => onChange({ ...value, enabled })}
        >
            <div className="space-y-4">
                <div>
                    <InputLabel value="Section Title (Dictionary Key)" />
                    <input
                        className="admin-input"
                        value={value?.title_key || ''}
                        onChange={(e) => onChange({ ...value, title_key: e.target.value })}
                        placeholder="home.discounts.title"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <InputLabel value="Display Limit" />
                        <input
                            type="number"
                            className="admin-input"
                            value={value?.limit || 10}
                            onChange={(e) => onChange({ ...value, limit: parseInt(e.target.value) || 10 })}
                            min="1"
                            max="24"
                        />
                    </div>
                    <div>
                        <InputLabel value="Min Discount %" />
                        <input
                            type="number"
                            className="admin-input"
                            value={value?.min_discount_percent || 10}
                            onChange={(e) => onChange({ ...value, min_discount_percent: parseInt(e.target.value) || 10 })}
                            min="1"
                            max="99"
                        />
                    </div>
                    <div>
                        <InputLabel value="Sort Order" />
                        <input
                            type="number"
                            className="admin-input"
                            value={value?.sort || 4}
                            onChange={(e) => onChange({ ...value, sort: parseInt(e.target.value) || 4 })}
                            min="1"
                            max="100"
                        />
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}

// Gallery Item Card
function GalleryItemCard({ item, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(item.image_url || null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            onChange({ ...item, image_file: file, image_path: null });
        }
    };

    return (
        <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-start gap-3">
                <div className="w-24 flex-shrink-0">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Gallery preview"
                            className="h-16 w-full rounded object-cover"
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-16 w-full items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 hover:border-brand"
                        >
                            <UploadIcon className="h-5 w-5 text-gray-400" />
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                <div className="flex-1 space-y-2">
                    <input
                        className="admin-input h-8 text-xs"
                        value={item.alt_key || ''}
                        onChange={(e) => onChange({ ...item, alt_key: e.target.value })}
                        placeholder="Alt text key (e.g., home.gallery.item1)"
                    />
                    <input
                        className="admin-input h-8 text-xs"
                        value={item.href || ''}
                        onChange={(e) => onChange({ ...item, href: e.target.value })}
                        placeholder="Link URL (optional)"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <button type="button" onClick={onMoveUp} disabled={isFirst} className="btn-ghost p-1 disabled:opacity-30">
                        <ChevronUpIcon className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={onMoveDown} disabled={isLast} className="btn-ghost p-1 disabled:opacity-30">
                        <ChevronDownIcon className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={onRemove} className="btn-ghost p-1 text-red-500 hover:bg-red-50">
                        <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Gallery Section Editor
function GalleryEditor({ value, onChange }) {
    const items = value?.items || [];
    const maxItems = 12;

    const updateItem = (index, updatedItem) => {
        const next = items.map((item, i) => (i === index ? updatedItem : item));
        onChange({ ...value, items: next });
    };

    const addItem = () => {
        if (items.length >= maxItems) return;
        onChange({
            ...value,
            items: [...items, { image_path: null, alt_key: '', href: '', sort: items.length + 1 }],
        });
    };

    const removeItem = (index) => {
        onChange({ ...value, items: items.filter((_, i) => i !== index) });
    };

    const moveItem = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= items.length) return;

        const next = [...items];
        const temp = next[index];
        next[index] = next[newIndex];
        next[newIndex] = temp;
        onChange({ ...value, items: next });
    };

    return (
        <SectionCard
            title="Image Gallery"
            description="Display a grid of promotional images"
            enabled={value?.enabled === true}
            onToggle={(enabled) => onChange({ ...value, enabled })}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel value="Section Title (Dictionary Key)" />
                        <input
                            className="admin-input"
                            value={value?.title_key || ''}
                            onChange={(e) => onChange({ ...value, title_key: e.target.value })}
                            placeholder="home.gallery.title"
                        />
                    </div>
                    <div>
                        <InputLabel value="Sort Order" />
                        <input
                            type="number"
                            className="admin-input"
                            value={value?.sort || 5}
                            onChange={(e) => onChange({ ...value, sort: parseInt(e.target.value) || 5 })}
                            min="1"
                            max="100"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Gallery Items</span>
                        <span className="text-xs text-gray-500">{items.length} / {maxItems}</span>
                    </div>

                    {items.map((item, index) => (
                        <GalleryItemCard
                            key={index}
                            item={item}
                            index={index}
                            onChange={(updated) => updateItem(index, updated)}
                            onRemove={() => removeItem(index)}
                            onMoveUp={() => moveItem(index, -1)}
                            onMoveDown={() => moveItem(index, 1)}
                            isFirst={index === 0}
                            isLast={index === items.length - 1}
                        />
                    ))}

                    {items.length < maxItems && (
                        <button type="button" onClick={addItem} className="btn-secondary w-full">
                            + Add Gallery Item
                        </button>
                    )}
                </div>
            </div>
        </SectionCard>
    );
}

// Main HomeSectionsEditor component
export default function HomeSectionsEditor({ value = {}, onChange, categories = [], errors = {} }) {
    return (
        <div className="space-y-4">
            <div className="admin-card">
                <h2 className="text-sm font-semibold text-gray-900">Home Page Sections</h2>
                <p className="mt-1 text-xs text-gray-500">
                    Configure the sections displayed on the home page. Enable/disable and customize each section below.
                    The sort order determines the display sequence (lower numbers appear first).
                </p>
            </div>

            <CategoryCarouselEditor
                value={value?.category_carousel}
                onChange={(v) => onChange({ ...value, category_carousel: v })}
                categories={categories}
            />

            <NewArrivalsEditor
                value={value?.new_arrivals}
                onChange={(v) => onChange({ ...value, new_arrivals: v })}
                categories={categories}
            />

            <VideoSectionEditor
                value={value?.video_section}
                onChange={(v) => onChange({ ...value, video_section: v })}
            />

            <DiscountTileEditor
                value={value?.discount_tiles}
                onChange={(v) => onChange({ ...value, discount_tiles: v })}
            />

            <GalleryEditor
                value={value?.gallery}
                onChange={(v) => onChange({ ...value, gallery: v })}
            />
        </div>
    );
}
