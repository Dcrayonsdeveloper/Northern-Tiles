import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import TagInput from '@/Components/Forms/TagInput';

export default function Create({ authors, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        body_json: '',
        excerpt: '',
        author_id: '',
        reviewed_by: '',
        category_id: '',
        tags: [],
        featured_image: null,
        meta_title: '',
        meta_description: '',
        sources_json: [],
        status: 'draft',
        published_at: '',
    });

    const [autoSlug, setAutoSlug] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [sourceInput, setSourceInput] = useState({ title: '', url: '' });

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setData('title', title);
        if (autoSlug) {
            setData('slug', title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        }
    };

    const handleSlugChange = (e) => {
        setAutoSlug(false);
        setData('slug', e.target.value);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('featured_image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAddSource = () => {
        if (sourceInput.title && sourceInput.url) {
            setData('sources_json', [...data.sources_json, { ...sourceInput }]);
            setSourceInput({ title: '', url: '' });
        }
    };

    const handleRemoveSource = (index) => {
        setData('sources_json', data.sources_json.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.posts.store'), {
            forceFormData: true,
        });
    };

    return (
        <DashboardLayout>
            <Head title="Create Post" />

            <div className="mb-6">
                <Link
                    href={route('admin.posts.index')}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Posts
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Create Post</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={handleTitleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="Post title"
                                        required
                                    />
                                    {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                            /blog/
                                        </span>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={handleSlugChange}
                                            className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-brand focus:ring-brand"
                                            placeholder="post-slug"
                                            required
                                        />
                                    </div>
                                    {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Content</label>
                                    <textarea
                                        value={data.body_json}
                                        onChange={(e) => setData('body_json', e.target.value)}
                                        rows={16}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand font-mono text-sm"
                                        placeholder="Post content (HTML supported)..."
                                    />
                                    {errors.body_json && <p className="mt-1 text-xs text-red-500">{errors.body_json}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                                    <textarea
                                        value={data.excerpt}
                                        onChange={(e) => setData('excerpt', e.target.value)}
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="Brief summary for listings and search results..."
                                    />
                                    {errors.excerpt && <p className="mt-1 text-xs text-red-500">{errors.excerpt}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Sources (E-E-A-T) */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Sources (E-E-A-T)</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Add credible sources to support your content and improve E-E-A-T signals.
                            </p>
                            <div className="mt-4 space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={sourceInput.title}
                                        onChange={(e) => setSourceInput({ ...sourceInput, title: e.target.value })}
                                        placeholder="Source title"
                                        className="flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                                    />
                                    <input
                                        type="url"
                                        value={sourceInput.url}
                                        onChange={(e) => setSourceInput({ ...sourceInput, url: e.target.value })}
                                        placeholder="https://..."
                                        className="flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-brand focus:ring-brand"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSource}
                                        className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                    >
                                        Add
                                    </button>
                                </div>
                                {data.sources_json.length > 0 && (
                                    <ul className="space-y-2">
                                        {data.sources_json.map((source, index) => (
                                            <li key={index} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-900">{source.title}</span>
                                                    <a
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-2 text-xs text-brand hover:underline"
                                                    >
                                                        {source.url}
                                                    </a>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSource(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* SEO Settings */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">SEO Settings</h2>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                                    <input
                                        type="text"
                                        value={data.meta_title}
                                        onChange={(e) => setData('meta_title', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="Leave empty to use post title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                                    <textarea
                                        value={data.meta_description}
                                        onChange={(e) => setData('meta_description', e.target.value)}
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                        placeholder="Leave empty to use excerpt"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publish */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Publish</h2>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        href={route('admin.posts.index')}
                                        className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Category & Tags */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Organization</h2>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    >
                                        <option value="">Select category...</option>
                                        {categories?.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                                    <TagInput
                                        value={data.tags}
                                        onChange={(tags) => setData('tags', tags)}
                                        placeholder="Add tags..."
                                        allowCustom
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Author */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">E-E-A-T</h2>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Author</label>
                                    <select
                                        value={data.author_id}
                                        onChange={(e) => setData('author_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    >
                                        <option value="">Select author...</option>
                                        {authors?.map((author) => (
                                            <option key={author.id} value={author.id}>{author.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Reviewed By</label>
                                    <select
                                        value={data.reviewed_by}
                                        onChange={(e) => setData('reviewed_by', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    >
                                        <option value="">Select reviewer...</option>
                                        {authors?.map((author) => (
                                            <option key={author.id} value={author.id}>{author.name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Optional: for E-E-A-T signals</p>
                                </div>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Featured Image</h2>
                            <div className="mt-4">
                                {imagePreview ? (
                                    <div className="relative mb-4">
                                        <img src={imagePreview} alt="Preview" className="w-full rounded-lg object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setData('featured_image', null); setImagePreview(null); }}
                                            className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-sm hover:bg-gray-100"
                                        >
                                            <svg className="h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6">
                                        <div className="text-center">
                                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="mt-2 text-xs text-gray-500">No image selected</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="mt-4 block w-full text-xs text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-brand/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-brand hover:file:bg-brand/20"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
