import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function Edit({ author, users }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: author.name || '',
        slug: author.slug || '',
        user_id: author.user_id || '',
        bio: author.bio || '',
        credentials: author.credentials || '',
        expertise_areas: author.expertise_areas || [],
        avatar: null,
        social_links: author.social_links || {
            twitter: '',
            linkedin: '',
            website: '',
        },
        is_verified: author.is_verified ?? false,
        is_active: author.is_active ?? true,
    });

    const [expertiseInput, setExpertiseInput] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(author.avatar_url || null);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAddExpertise = (e) => {
        e.preventDefault();
        if (expertiseInput.trim() && !data.expertise_areas.includes(expertiseInput.trim())) {
            setData('expertise_areas', [...data.expertise_areas, expertiseInput.trim()]);
            setExpertiseInput('');
        }
    };

    const handleRemoveExpertise = (area) => {
        setData('expertise_areas', data.expertise_areas.filter((a) => a !== area));
    };

    const handleSocialLinkChange = (platform, value) => {
        setData('social_links', { ...data.social_links, [platform]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.authors.update', author.id), {
            forceFormData: true,
        });
    };

    return (
        <DashboardLayout>
            <Head title={`Edit Author: ${author.name}`} />

            <div className="mb-6">
                <Link
                    href={route('admin.authors.index')}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Authors
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Author: {author.name}</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
                {/* Basic Info */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                    <div className="mt-4 space-y-4">
                        <div className="flex gap-6">
                            {/* Avatar */}
                            <div className="shrink-0">
                                <label className="block text-sm font-medium text-gray-700">Avatar</label>
                                <div className="mt-1">
                                    <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt="Avatar preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="mt-2 block w-full text-xs text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-brand/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-brand hover:file:bg-brand/20"
                                    />
                                </div>
                                {errors.avatar && <p className="mt-1 text-xs text-red-500">{errors.avatar}</p>}
                            </div>

                            {/* Name & Slug */}
                            <div className="flex-1 space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                            placeholder="Full name"
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
                                            placeholder="url-friendly-slug"
                                            required
                                        />
                                        {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Link to User (optional)</label>
                                    <select
                                        value={data.user_id}
                                        onChange={(e) => setData('user_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    >
                                        <option value="">No user linked</option>
                                        {users?.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.user_id && <p className="mt-1 text-xs text-red-500">{errors.user_id}</p>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bio</label>
                            <textarea
                                value={data.bio}
                                onChange={(e) => setData('bio', e.target.value)}
                                rows={4}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="Author biography..."
                            />
                            {errors.bio && <p className="mt-1 text-xs text-red-500">{errors.bio}</p>}
                        </div>
                    </div>
                </div>

                {/* E-E-A-T Credentials */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">E-E-A-T Credentials</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Experience, Expertise, Authoritativeness, and Trustworthiness signals for SEO.
                    </p>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Credentials / Qualifications</label>
                            <input
                                type="text"
                                value={data.credentials}
                                onChange={(e) => setData('credentials', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="e.g., Ph.D. in Computer Science, 15+ years industry experience"
                            />
                            {errors.credentials && <p className="mt-1 text-xs text-red-500">{errors.credentials}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Expertise Areas</label>
                            <div className="mt-1 flex gap-2">
                                <input
                                    type="text"
                                    value={expertiseInput}
                                    onChange={(e) => setExpertiseInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddExpertise(e)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                    placeholder="Add expertise area..."
                                />
                                <button
                                    type="button"
                                    onClick={handleAddExpertise}
                                    className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                >
                                    Add
                                </button>
                            </div>
                            {data.expertise_areas.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {data.expertise_areas.map((area) => (
                                        <span
                                            key={area}
                                            className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-sm text-brand"
                                        >
                                            {area}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExpertise(area)}
                                                className="ml-1 hover:text-brand/70"
                                            >
                                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {errors.expertise_areas && <p className="mt-1 text-xs text-red-500">{errors.expertise_areas}</p>}
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_verified"
                                checked={data.is_verified}
                                onChange={(e) => setData('is_verified', e.target.checked)}
                                className="rounded border-gray-300 text-brand focus:ring-brand"
                            />
                            <label htmlFor="is_verified" className="text-sm text-gray-700">
                                <span className="font-medium">Verified Author</span>
                                <span className="ml-1 text-gray-500">- Display verification badge</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Social Links</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Twitter / X</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                    @
                                </span>
                                <input
                                    type="text"
                                    value={data.social_links?.twitter || ''}
                                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                    className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-brand focus:ring-brand"
                                    placeholder="username"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                            <input
                                type="url"
                                value={data.social_links?.linkedin || ''}
                                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Website</label>
                            <input
                                type="url"
                                value={data.social_links?.website || ''}
                                onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {(author.posts_count > 0 || author.pages_count > 0) && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Content Statistics</h2>
                        <div className="mt-4 flex gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{author.posts_count || 0}</div>
                                <div className="text-sm text-gray-500">Blog Posts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{author.pages_count || 0}</div>
                                <div className="text-sm text-gray-500">Pages</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded border-gray-300 text-brand focus:ring-brand"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700">
                            Active (author profile will be visible on the site)
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={route('admin.authors.index')}
                        className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
