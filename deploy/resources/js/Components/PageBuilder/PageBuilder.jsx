import { useState, useCallback } from 'react';
import SectionEditor from './SectionEditor';

// Icons
function PlusIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    );
}

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

function TrashIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function EyeIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function EyeOffIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    );
}

function GripIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
    );
}

// Section library modal
function SectionLibrary({ registry, onAdd, onClose }) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Ensure registry is an array
    const registryArray = Array.isArray(registry) ? registry : [];

    const categories = ['all', ...new Set(registryArray.map(s => s.category).filter(Boolean))];

    const filteredSections = registryArray.filter(section => {
        const matchesSearch = search === '' ||
            section.title_key?.toLowerCase().includes(search.toLowerCase()) ||
            section.section_key?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg bg-white shadow-xl">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Add Section</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="mt-4 flex gap-4">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search sections..."
                            className="flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-6">
                    {filteredSections.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-8">No sections found.</p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {filteredSections.map(section => (
                                <button
                                    key={section.section_key}
                                    type="button"
                                    onClick={() => { onAdd(section); onClose(); }}
                                    className="rounded-lg border border-gray-200 p-4 text-left transition hover:border-brand hover:bg-brand/5"
                                >
                                    <div className="font-medium text-gray-900">{section.title_key}</div>
                                    <div className="mt-1 text-xs text-gray-500">{section.section_key}</div>
                                    {section.category && (
                                        <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                            {section.category}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Single section item in the builder
function SectionItem({ section, index, total, registry, onUpdate, onMove, onRemove, onToggle }) {
    const [expanded, setExpanded] = useState(false);
    const registryArray = Array.isArray(registry) ? registry : [];
    const registryItem = registryArray.find(r => r.section_key === section.section_key);

    return (
        <div className={`rounded-lg border ${section.is_active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3">
                <GripIcon className="h-5 w-5 cursor-grab text-gray-400" />
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex flex-1 items-center gap-2 text-left"
                >
                    <span className="font-medium text-gray-900">
                        {registryItem?.title_key || section.section_key}
                    </span>
                    <svg
                        className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onMove(index, -1)}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                        title="Move up"
                    >
                        <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove(index, 1)}
                        disabled={index === total - 1}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                        title="Move down"
                    >
                        <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onToggle(index)}
                        className={`rounded p-1 ${section.is_active ? 'text-gray-400 hover:text-gray-600' : 'text-yellow-500 hover:text-yellow-600'} hover:bg-gray-100`}
                        title={section.is_active ? 'Hide section' : 'Show section'}
                    >
                        {section.is_active ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Remove section"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-gray-200 px-4 py-4">
                    <SectionEditor
                        section={section}
                        schema={registryItem?.schema_json}
                        onChange={(data) => onUpdate(index, data)}
                    />
                </div>
            )}
        </div>
    );
}

// Main PageBuilder component
export default function PageBuilder({ sections = [], onChange, registry = [] }) {
    const [showLibrary, setShowLibrary] = useState(false);

    const handleAddSection = useCallback((registryItem) => {
        const newSection = {
            section_key: registryItem.section_key,
            data_json: registryItem.default_data || {},
            sort: sections.length,
            is_active: true,
        };
        onChange([...sections, newSection]);
    }, [sections, onChange]);

    const handleUpdateSection = useCallback((index, data) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], data_json: data };
        onChange(updated);
    }, [sections, onChange]);

    const handleMoveSection = useCallback((index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= sections.length) return;

        const updated = [...sections];
        const temp = updated[index];
        updated[index] = updated[newIndex];
        updated[newIndex] = temp;

        // Update sort values
        updated.forEach((s, i) => { s.sort = i; });
        onChange(updated);
    }, [sections, onChange]);

    const handleRemoveSection = useCallback((index) => {
        if (!confirm('Remove this section?')) return;
        const updated = sections.filter((_, i) => i !== index);
        updated.forEach((s, i) => { s.sort = i; });
        onChange(updated);
    }, [sections, onChange]);

    const handleToggleSection = useCallback((index) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], is_active: !updated[index].is_active };
        onChange(updated);
    }, [sections, onChange]);

    return (
        <div className="space-y-4">
            {/* Sections list */}
            {sections.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">No sections added yet.</p>
                    <p className="text-xs text-gray-500">Click the button below to add your first section.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sections.map((section, index) => (
                        <SectionItem
                            key={section.id || `new-${index}`}
                            section={section}
                            index={index}
                            total={sections.length}
                            registry={registry}
                            onUpdate={handleUpdateSection}
                            onMove={handleMoveSection}
                            onRemove={handleRemoveSection}
                            onToggle={handleToggleSection}
                        />
                    ))}
                </div>
            )}

            {/* Add section button */}
            <button
                type="button"
                onClick={() => setShowLibrary(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-brand hover:text-brand"
            >
                <PlusIcon className="h-5 w-5" />
                Add Section
            </button>

            {/* Section library modal */}
            {showLibrary && (
                <SectionLibrary
                    registry={registry}
                    onAdd={handleAddSection}
                    onClose={() => setShowLibrary(false)}
                />
            )}
        </div>
    );
}
