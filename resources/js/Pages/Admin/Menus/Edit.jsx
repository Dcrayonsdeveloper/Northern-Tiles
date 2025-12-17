import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

function MenuItemForm({ item, onSave, onCancel, isNew = false }) {
    const [formData, setFormData] = useState({
        title: item?.title || '',
        url: item?.url || '',
        target: item?.target || '_self',
        icon: item?.icon || '',
        css_class: item?.css_class || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
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
                        required
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
                        <div>
                            <span className="font-medium text-gray-900">{item.title}</span>
                            <span className="ml-2 text-xs text-gray-500">{item.url}</span>
                            {item.target === '_blank' && (
                                <span className="ml-2 inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                                    ↗ New window
                                </span>
                            )}
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
