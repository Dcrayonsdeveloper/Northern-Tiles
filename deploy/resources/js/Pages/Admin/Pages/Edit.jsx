import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PageBuilder from '@/Components/PageBuilder/PageBuilder';

// Icons
function ChevronLeftIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function ExternalLinkIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
    );
}

function ImageIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    );
}

// Image upload component
function ImageUpload({ label, currentUrl, preview, onChange, onClear, error, hint }) {
    const displayUrl = preview || currentUrl;

    return (
        <div>
            {label && <label className="block text-xs font-medium text-gray-700">{label}</label>}
            <div className={label ? 'mt-2' : ''}>
                {displayUrl ? (
                    <div className="relative">
                        <img src={displayUrl} alt="Preview" className="w-full rounded-lg object-cover" />
                        <button
                            type="button"
                            onClick={onClear}
                            className="absolute right-1.5 top-1.5 rounded-full bg-white p-0.5 shadow-sm hover:bg-gray-100"
                        >
                            <XIcon className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4">
                        <div className="text-center">
                            <ImageIcon className="mx-auto h-6 w-6 text-gray-400" />
                            <p className="mt-1 text-[10px] text-gray-500">No image selected</p>
                        </div>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={onChange}
                    className="mt-2 block w-full text-[10px] text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-brand/10 file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-brand hover:file:bg-brand/20"
                />
                {hint && <p className="mt-1 text-[10px] text-gray-500">{hint}</p>}
                {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
            </div>
        </div>
    );
}

// Build parent options with hierarchy (excluding self and descendants)
function buildParentOptions(pages, excludeId = null, depth = 0) {
    const options = [];
    for (const page of pages) {
        if (page.id !== excludeId) {
            options.push({
                id: page.id,
                title: '—'.repeat(depth) + ' ' + page.title,
                full_slug: page.full_slug || page.slug,
            });
            if (page.children?.length) {
                options.push(...buildParentOptions(page.children, excludeId, depth + 1));
            }
        }
    }
    return options;
}

// Format date for datetime-local input
function formatDateTimeLocal(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}

export default function Edit({ page, authors, templates, parentPages, sectionRegistry }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title: page.title || '',
        slug: page.slug || '',
        parent_id: page.parent_id || '',
        body_json: page.body_json || {},
        author_id: page.author_id || '',
        template: page.template || 'default',
        featured_image_file: null,
        og_image_file: null,
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        canonical_url: page.canonical_url || '',
        noindex: page.noindex || false,
        robots_follow: page.robots_follow !== false,
        status: page.status || 'draft',
        published_at: formatDateTimeLocal(page.published_at),
        sort: page.sort || 0,
        sections: page.sections?.map(s => ({
            id: s.id,
            section_key: s.section_key,
            data_json: s.data_json || {},
            sort: s.sort || 0,
            is_active: s.is_active !== false,
        })) || [],
    });

    const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
    const [ogImagePreview, setOgImagePreview] = useState(null);

    // Find parent page for slug prefix display
    const flatParents = buildParentOptions(parentPages || [], page.id);
    const parentPage = flatParents.find(p => p.id == data.parent_id);
    const parentPrefix = parentPage ? `/${parentPage.full_slug}/` : '/';

    const handleFeaturedImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('featured_image_file', file);
            setFeaturedImagePreview(URL.createObjectURL(file));
        }
    };

    const handleOgImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('og_image_file', file);
            setOgImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSectionsChange = useCallback((sections) => {
        setData('sections', sections);
    }, [setData]);

    const handleTemplateChange = useCallback((templateKey) => {
        setData('template', templateKey);

        // Find the selected template
        const selectedTemplate = templates?.find(t => (t.key || t.value) === templateKey);

        // If template has predefined sections, offer to auto-populate
        if (selectedTemplate?.sections && selectedTemplate.sections.length > 0) {
            const shouldPopulate = data.sections.length === 0 ||
                confirm('This template has predefined sections. Do you want to add them to your page? (Existing sections will be kept)');

            if (shouldPopulate) {
                const newSections = selectedTemplate.sections.map((sectionKey, index) => {
                    const registryItem = sectionRegistry?.find(r => r.section_key === sectionKey);
                    return {
                        section_key: sectionKey,
                        data_json: registryItem?.default_data || {},
                        sort: data.sections.length + index,
                        is_active: true,
                    };
                });

                // Add sections without duplicating existing ones
                const existingKeys = new Set(data.sections.map(s => s.section_key));
                const sectionsToAdd = newSections.filter(s => !existingKeys.has(s.section_key));

                if (sectionsToAdd.length > 0) {
                    setData('sections', [...data.sections, ...sectionsToAdd]);
                }
            }
        }
    }, [setData, data.sections, templates, sectionRegistry]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.pages.update', page.id), {
            forceFormData: true,
        });
    };

    const getPageUrl = () => {
        return `/${page.full_slug || page.slug}`;
    };

    const getPreviewUrl = () => {
        return page.preview_url || `${getPageUrl()}?preview=true`;
    };

    return (
        <DashboardLayout title={`Edit: ${page.title}`}>
            <Head title={`Edit Page: ${page.title}`} />

            <div className="mb-4">
                <Link
                    href={route('admin.pages.index')}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                    <ChevronLeftIcon className="h-3 w-3" />
                    Back to Pages
                </Link>
                <div className="mt-2 flex items-center gap-3">
                    <div className="text-sm font-semibold text-gray-900">Edit: {page.title}</div>
                    {page.status === 'published' && (
                        <a
                            href={getPageUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                            <ExternalLinkIcon className="h-3 w-3" />
                            View
                        </a>
                    )}
                    {page.status === 'draft' && (
                        <a
                            href={getPreviewUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                        >
                            <ExternalLinkIcon className="h-3 w-3" />
                            Preview
                        </a>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* Basic Info */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Title</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="Page title"
                                        required
                                    />
                                    {errors.title && <p className="mt-1 text-[10px] text-red-500">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Slug</label>
                                    <div className="mt-1 flex rounded-lg shadow-sm">
                                        <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-2 text-gray-500 text-xs">
                                            {parentPrefix}
                                        </span>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            className="block w-full rounded-none rounded-r-lg border-gray-300 text-xs focus:border-brand focus:ring-brand"
                                            placeholder="page-slug"
                                            required
                                        />
                                    </div>
                                    {errors.slug && <p className="mt-1 text-[10px] text-red-500">{errors.slug}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Parent Page</label>
                                    <select
                                        value={data.parent_id}
                                        onChange={(e) => setData('parent_id', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                    >
                                        <option value="">No Parent (Top Level)</option>
                                        {flatParents.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.title}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.parent_id && <p className="mt-1 text-[10px] text-red-500">{errors.parent_id}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Page Builder */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-semibold text-gray-900">Page Content</div>
                            <p className="mt-0.5 text-[10px] text-gray-500">Build your page using sections from the library.</p>
                            <div className="mt-3">
                                <PageBuilder
                                    sections={data.sections}
                                    onChange={handleSectionsChange}
                                    registry={sectionRegistry || []}
                                />
                            </div>
                            {errors.sections && <p className="mt-2 text-[10px] text-red-500">{errors.sections}</p>}
                        </div>

                        {/* SEO Settings */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-semibold text-gray-900">SEO Settings</div>
                            <div className="mt-3 space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">
                                        Meta Title
                                        <span className="ml-1 text-[10px] font-normal text-gray-400">
                                            ({data.meta_title.length}/70)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.meta_title}
                                        onChange={(e) => setData('meta_title', e.target.value)}
                                        maxLength={70}
                                        className="mt-1 block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="Leave empty to use page title"
                                    />
                                    {errors.meta_title && <p className="mt-1 text-[10px] text-red-500">{errors.meta_title}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700">
                                        Meta Description
                                        <span className="ml-1 text-[10px] font-normal text-gray-400">
                                            ({data.meta_description.length}/170)
                                        </span>
                                    </label>
                                    <textarea
                                        value={data.meta_description}
                                        onChange={(e) => setData('meta_description', e.target.value)}
                                        maxLength={170}
                                        rows={2}
                                        className="mt-1 block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="Brief description for search results"
                                    />
                                    {errors.meta_description && <p className="mt-1 text-[10px] text-red-500">{errors.meta_description}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Canonical URL</label>
                                    <input
                                        type="url"
                                        value={data.canonical_url}
                                        onChange={(e) => setData('canonical_url', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="https://example.com/page (leave empty for default)"
                                    />
                                    {errors.canonical_url && <p className="mt-1 text-[10px] text-red-500">{errors.canonical_url}</p>}
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-1.5">
                                        <input
                                            type="checkbox"
                                            checked={data.noindex}
                                            onChange={(e) => setData('noindex', e.target.checked)}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-brand focus:ring-brand"
                                        />
                                        <span className="text-xs text-gray-700">No Index</span>
                                    </label>
                                    <label className="flex items-center gap-1.5">
                                        <input
                                            type="checkbox"
                                            checked={data.robots_follow}
                                            onChange={(e) => setData('robots_follow', e.target.checked)}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-brand focus:ring-brand"
                                        />
                                        <span className="text-xs text-gray-700">Follow Links</span>
                                    </label>
                                </div>

                                <ImageUpload
                                    label="OG Image"
                                    currentUrl={page.og_image_url}
                                    preview={ogImagePreview}
                                    onChange={handleOgImageChange}
                                    onClear={() => { setData('og_image_file', null); setOgImagePreview(null); }}
                                    error={errors.og_image_file}
                                    hint="Recommended: 1200x630px for optimal sharing"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Publish */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-semibold text-gray-900">Publish</div>
                            <div className="mt-3 space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Status</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                {data.status === 'scheduled' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Publish Date</label>
                                        <input
                                            type="datetime-local"
                                            value={data.published_at}
                                            onChange={(e) => setData('published_at', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                            required={data.status === 'scheduled'}
                                        />
                                        {errors.published_at && <p className="mt-1 text-[10px] text-red-500">{errors.published_at}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Sort Order</label>
                                    <input
                                        type="number"
                                        value={data.sort}
                                        onChange={(e) => setData('sort', parseInt(e.target.value) || 0)}
                                        min={0}
                                        max={10000}
                                        className="mt-1 block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                    />
                                    <p className="mt-1 text-[10px] text-gray-500">Lower values appear first</p>
                                </div>

                                <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                                    <p>Created: {new Date(page.created_at).toLocaleString()}</p>
                                    <p>Updated: {new Date(page.updated_at).toLocaleString()}</p>
                                    {page.created_by_user && <p>By: {page.created_by_user.name}</p>}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Link
                                        href={route('admin.pages.index')}
                                        className="btn-secondary flex-1 text-center"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Update'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Template */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-semibold text-gray-900">Template</div>
                            <div className="mt-3">
                                <select
                                    value={data.template}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                >
                                    {templates?.map((template) => (
                                        <option key={template.key || template.value} value={template.key || template.value}>
                                            {template.label}
                                        </option>
                                    )) || (
                                        <>
                                            <option value="default">Default</option>
                                            <option value="full-width">Full Width</option>
                                            <option value="sidebar">With Sidebar</option>
                                            <option value="landing">Landing Page</option>
                                        </>
                                    )}
                                </select>
                                {data.template === 'home' && (
                                    <p className="mt-2 text-[10px] text-blue-600">
                                        Home template includes: Hero Slider, Categories, New Arrivals, Video, Discounts, and Gallery sections.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Author */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-semibold text-gray-900">Author</div>
                            <div className="mt-3">
                                <select
                                    value={data.author_id}
                                    onChange={(e) => setData('author_id', e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 text-xs shadow-sm focus:border-brand focus:ring-brand"
                                >
                                    <option value="">Select author...</option>
                                    {authors?.map((author) => (
                                        <option key={author.id} value={author.id}>
                                            {author.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.author_id && <p className="mt-1 text-[10px] text-red-500">{errors.author_id}</p>}
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-semibold text-gray-900">Featured Image</div>
                            <div className="mt-3">
                                <ImageUpload
                                    currentUrl={page.featured_image_url}
                                    preview={featuredImagePreview}
                                    onChange={handleFeaturedImageChange}
                                    onClear={() => { setData('featured_image_file', null); setFeaturedImagePreview(null); }}
                                    error={errors.featured_image_file}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
