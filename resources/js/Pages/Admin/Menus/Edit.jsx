import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

// Badge color options
const BADGE_COLORS = [
    { value: '', label: 'None' },
    { value: 'brand', label: 'Brand (Olive)' },
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'orange', label: 'Orange' },
    { value: 'blue', label: 'Blue' },
    { value: 'gray', label: 'Gray' },
];

// Featured content item component
function FeaturedContentItem({ item, index, onUpdate, onRemove }) {
    return (
        <div className="flex gap-2 rounded-md border border-gray-200 bg-white p-3">
            <div className="flex-1 space-y-2">
                <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => onUpdate(index, { ...item, title: e.target.value })}
                    placeholder="Title"
                    className="block w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                />
                <input
                    type="text"
                    value={item.url || ''}
                    onChange={(e) => onUpdate(index, { ...item, url: e.target.value })}
                    placeholder="URL"
                    className="block w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                />
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        value={item.image_url || ''}
                        onChange={(e) => onUpdate(index, { ...item, image_url: e.target.value })}
                        placeholder="Image URL"
                        className="block w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                    />
                    <input
                        type="text"
                        value={item.type || ''}
                        onChange={(e) => onUpdate(index, { ...item, type: e.target.value })}
                        placeholder="Type (e.g., Blog, Product)"
                        className="block w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                    />
                </div>
            </div>
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="self-start text-red-500 hover:text-red-700"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

function MenuItemForm({ item, onSave, onCancel, isNew = false, level = 0 }) {
    const [formData, setFormData] = useState({
        title: item?.title || '',
        url: item?.url || '',
        target: item?.target || '_self',
        icon: item?.icon || '',
        css_class: item?.css_class || '',
        // Mega menu fields
        is_mega: item?.is_mega || false,
        mega_columns: item?.mega_columns || 4,
        image_url: item?.image_url || '',
        image_alt: item?.image_alt || '',
        video_url: item?.video_url || '',
        badge_text: item?.badge_text || '',
        badge_color: item?.badge_color || '',
        description: item?.description || '',
        featured_content: item?.featured_content || [],
    });

    const [showMegaOptions, setShowMegaOptions] = useState(formData.is_mega);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleMegaToggle = (checked) => {
        setFormData({ ...formData, is_mega: checked });
        setShowMegaOptions(checked);
    };

    const addFeaturedContent = () => {
        setFormData({
            ...formData,
            featured_content: [
                ...formData.featured_content,
                { title: '', url: '', image_url: '', type: '' },
            ],
        });
    };

    const updateFeaturedContent = (index, updatedItem) => {
        const newContent = [...formData.featured_content];
        newContent[index] = updatedItem;
        setFormData({ ...formData, featured_content: newContent });
    };

    const removeFeaturedContent = (index) => {
        setFormData({
            ...formData,
            featured_content: formData.featured_content.filter((_, i) => i !== index),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            {/* Basic Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                        placeholder="Menu item title"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">URL</label>
                    <input
                        type="text"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                        placeholder="/page or https://..."
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Target</label>
                    <select
                        value={formData.target}
                        onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                    >
                        <option value="_self">Same window</option>
                        <option value="_blank">New window</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Icon (optional)</label>
                    <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                        placeholder="Icon class name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">CSS Class (optional)</label>
                    <input
                        type="text"
                        value={formData.css_class}
                        onChange={(e) => setFormData({ ...formData, css_class: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                        placeholder="Custom CSS class"
                    />
                </div>
            </div>

            {/* Badge */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Badge Text (optional)</label>
                    <input
                        type="text"
                        value={formData.badge_text}
                        onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                        placeholder="e.g., New, Sale, Hot"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Badge Color</label>
                    <select
                        value={formData.badge_color}
                        onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                    >
                        {BADGE_COLORS.map((color) => (
                            <option key={color.value} value={color.value}>
                                {color.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                    placeholder="Brief description for mega menu"
                />
            </div>

            {/* Mega Menu Toggle - Only show for top-level items */}
            {level === 0 && (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id={`is_mega_${item?.id || 'new'}`}
                            checked={formData.is_mega}
                            onChange={(e) => handleMegaToggle(e.target.checked)}
                            className="rounded border-gray-300 text-brand focus:ring-brand"
                        />
                        <label htmlFor={`is_mega_${item?.id || 'new'}`} className="text-sm font-medium text-gray-700">
                            Enable Mega Menu
                        </label>
                        <span className="text-xs text-gray-500">(Shows expanded panel with columns)</span>
                    </div>

                    {showMegaOptions && (
                        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                            {/* Columns */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Number of Columns</label>
                                <select
                                    value={formData.mega_columns}
                                    onChange={(e) => setFormData({ ...formData, mega_columns: parseInt(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand sm:w-32"
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n} {n === 1 ? 'Column' : 'Columns'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Featured Image */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Featured Image URL</label>
                                    <input
                                        type="text"
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Image Alt Text</label>
                                    <input
                                        type="text"
                                        value={formData.image_alt}
                                        onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="Image description"
                                    />
                                </div>
                            </div>

                            {/* Video URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Video URL (YouTube)</label>
                                <input
                                    type="text"
                                    value={formData.video_url}
                                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                                    placeholder="https://youtube.com/watch?v=..."
                                />
                                <p className="mt-1 text-xs text-gray-500">Video will show with play button overlay. Supports YouTube URLs.</p>
                            </div>

                            {/* Featured Content */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700">Featured Content</label>
                                    <button
                                        type="button"
                                        onClick={addFeaturedContent}
                                        className="text-xs text-brand hover:text-brand/80"
                                    >
                                        + Add Content
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Add blog posts, products, or promotional content.</p>
                                {formData.featured_content.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {formData.featured_content.map((content, idx) => (
                                            <FeaturedContentItem
                                                key={idx}
                                                item={content}
                                                index={idx}
                                                onUpdate={updateFeaturedContent}
                                                onRemove={removeFeaturedContent}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand/90"
                >
                    {isNew ? 'Add Item' : 'Update Item'}
                </button>
            </div>
        </form>
    );
}

function MenuItem({ item, level = 0, onEdit, onDelete, onAddChild, onMoveUp, onMoveDown, isFirst, isLast }) {
    const [isEditing, setIsEditing] = useState(false);
    const [showAddChild, setShowAddChild] = useState(false);

    const handleSave = (formData) => {
        onEdit(item.id, formData);
        setIsEditing(false);
    };

    const handleAddChild = (formData) => {
        onAddChild(item.id, formData);
        setShowAddChild(false);
    };

    return (
        <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
            {isEditing ? (
                <MenuItemForm
                    item={item}
                    level={level}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                            <button
                                type="button"
                                onClick={() => onMoveUp(item.id)}
                                disabled={isFirst}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => onMoveDown(item.id)}
                                disabled={isLast}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-gray-900">{item.title}</span>
                                {item.url && (
                                    <span className="truncate text-xs text-gray-500">{item.url}</span>
                                )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {item.is_mega && (
                                    <span className="inline-flex items-center rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                                        Mega Menu
                                    </span>
                                )}
                                {item.badge_text && (
                                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                        item.badge_color === 'red' ? 'bg-red-100 text-red-700' :
                                        item.badge_color === 'green' ? 'bg-green-100 text-green-700' :
                                        item.badge_color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                        item.badge_color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                        'bg-brand/10 text-brand'
                                    }`}>
                                        Badge: {item.badge_text}
                                    </span>
                                )}
                                {item.target === '_blank' && (
                                    <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                        ↗ New window
                                    </span>
                                )}
                                {item.image_url && (
                                    <span className="inline-flex items-center rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">
                                        Has Image
                                    </span>
                                )}
                                {item.video_url && (
                                    <span className="inline-flex items-center rounded bg-pink-100 px-1.5 py-0.5 text-[10px] text-pink-700">
                                        Has Video
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {level < 2 && (
                            <button
                                type="button"
                                onClick={() => setShowAddChild(true)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                + Child
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="text-xs text-brand hover:text-brand/80"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {showAddChild && (
                <div className="mt-2 ml-8">
                    <MenuItemForm
                        isNew
                        level={level + 1}
                        onSave={handleAddChild}
                        onCancel={() => setShowAddChild(false)}
                    />
                </div>
            )}

            {item.children && item.children.length > 0 && (
                <div className="mt-2 space-y-2">
                    {item.children.map((child, index) => (
                        <MenuItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            onMoveUp={onMoveUp}
                            onMoveDown={onMoveDown}
                            isFirst={index === 0}
                            isLast={index === item.children.length - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Edit({ menu, menuTree, locations }) {
    const { data, setData, put, processing, errors } = useForm({
        name: menu.name || '',
        slug: menu.slug || '',
        description: menu.description || '',
        location: menu.location || '',
        is_active: menu.is_active ?? true,
    });

    const [items, setItems] = useState(menuTree || []);
    const [showAddItem, setShowAddItem] = useState(false);
    const [isSavingItems, setIsSavingItems] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.menus.update', menu.id));
    };

    const saveItems = useCallback(async (newItems) => {
        setIsSavingItems(true);
        try {
            await router.post(route('admin.menus.items.sync', menu.id), {
                items: newItems,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        } finally {
            setIsSavingItems(false);
        }
    }, [menu.id]);

    const findAndUpdateItem = (items, itemId, updater) => {
        return items.map((item) => {
            if (item.id === itemId) {
                return updater(item);
            }
            if (item.children) {
                return {
                    ...item,
                    children: findAndUpdateItem(item.children, itemId, updater),
                };
            }
            return item;
        });
    };

    const findAndRemoveItem = (items, itemId) => {
        return items.filter((item) => {
            if (item.id === itemId) {
                return false;
            }
            if (item.children) {
                item.children = findAndRemoveItem(item.children, itemId);
            }
            return true;
        });
    };

    const handleAddItem = (formData) => {
        const newItem = {
            id: `new-${Date.now()}`,
            ...formData,
            children: [],
        };
        const newItems = [...items, newItem];
        setItems(newItems);
        setShowAddItem(false);
        saveItems(newItems);
    };

    const handleEditItem = (itemId, formData) => {
        const newItems = findAndUpdateItem(items, itemId, (item) => ({
            ...item,
            ...formData,
        }));
        setItems(newItems);
        saveItems(newItems);
    };

    const handleDeleteItem = (itemId) => {
        if (!confirm('Are you sure you want to delete this menu item?')) return;
        const newItems = findAndRemoveItem([...items], itemId);
        setItems(newItems);
        saveItems(newItems);
    };

    const handleAddChild = (parentId, formData) => {
        const newChild = {
            id: `new-${Date.now()}`,
            ...formData,
            children: [],
        };
        const newItems = findAndUpdateItem(items, parentId, (item) => ({
            ...item,
            children: [...(item.children || []), newChild],
        }));
        setItems(newItems);
        saveItems(newItems);
    };

    const moveItem = (items, itemId, direction) => {
        const result = [...items];
        for (let i = 0; i < result.length; i++) {
            if (result[i].id === itemId) {
                const newIndex = direction === 'up' ? i - 1 : i + 1;
                if (newIndex >= 0 && newIndex < result.length) {
                    [result[i], result[newIndex]] = [result[newIndex], result[i]];
                }
                return result;
            }
            if (result[i].children) {
                result[i] = {
                    ...result[i],
                    children: moveItem(result[i].children, itemId, direction),
                };
            }
        }
        return result;
    };

    const handleMoveUp = (itemId) => {
        const newItems = moveItem(items, itemId, 'up');
        setItems(newItems);
        saveItems(newItems);
    };

    const handleMoveDown = (itemId) => {
        const newItems = moveItem(items, itemId, 'down');
        setItems(newItems);
        saveItems(newItems);
    };

    return (
        <DashboardLayout>
            <Head title={`Edit Menu: ${menu.name}`} />

            <div className="mb-6">
                <Link
                    href={route('admin.menus.index')}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Menus
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Menu: {menu.name}</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Menu Details */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Menu Details</h2>
                        <div className="mt-4 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                                    <input
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        required
                                    />
                                    {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                <select
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    required
                                >
                                    <option value="">Select location...</option>
                                    {Object.entries(locations).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                />
                                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-brand focus:ring-brand"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Details'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Menu Items */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Menu Items</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Drag to reorder, up to 3 levels deep.
                            </p>
                        </div>
                        {isSavingItems && (
                            <span className="text-xs text-gray-500">Saving...</span>
                        )}
                    </div>

                    <div className="mt-6 space-y-2">
                        {items.map((item, index) => (
                            <MenuItem
                                key={item.id}
                                item={item}
                                onEdit={handleEditItem}
                                onDelete={handleDeleteItem}
                                onAddChild={handleAddChild}
                                onMoveUp={handleMoveUp}
                                onMoveDown={handleMoveDown}
                                isFirst={index === 0}
                                isLast={index === items.length - 1}
                            />
                        ))}

                        {items.length === 0 && !showAddItem && (
                            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                                <p className="text-sm text-gray-500">No menu items yet.</p>
                            </div>
                        )}

                        {showAddItem ? (
                            <MenuItemForm
                                isNew
                                level={0}
                                onSave={handleAddItem}
                                onCancel={() => setShowAddItem(false)}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowAddItem(true)}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Menu Item
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
