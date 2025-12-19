import DashboardLayout from '@/Layouts/DashboardLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const form = useForm({
        title: '',
        body_html: '',
        audience: ['admin', 'seller'],
        starts_at: '',
        ends_at: '',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('admin.announcements.store'));
    };

    const toggleAudience = (key) => {
        const set = new Set(form.data.audience || []);
        if (set.has(key)) set.delete(key);
        else set.add(key);
        form.setData('audience', Array.from(set));
    };

    return (
        <DashboardLayout title="Create Announcement">
            <Head title="Create Announcement" />

            <div className="mb-3 flex items-center justify-between gap-2">
                <Link href={route('admin.announcements.index')} className="btn-secondary">
                    Back
                </Link>
            </div>

            <form onSubmit={submit} className="admin-card space-y-4">
                <div>
                    <InputLabel value="Title" />
                    <input
                        className="admin-input"
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                    />
                    <InputError message={form.errors.title} />
                </div>

                <div>
                    <InputLabel value="Body (HTML)" />
                    <textarea
                        className="admin-textarea"
                        rows={6}
                        value={form.data.body_html}
                        onChange={(e) => form.setData('body_html', e.target.value)}
                    />
                    <InputError message={form.errors.body_html} />
                </div>

                <div>
                    <InputLabel value="Audience" />
                    <div className="mt-2 flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 text-xs text-gray-700">
                            <input
                                type="checkbox"
                                checked={(form.data.audience || []).includes('admin')}
                                onChange={() => toggleAudience('admin')}
                            />
                            Admin
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-700">
                            <input
                                type="checkbox"
                                checked={(form.data.audience || []).includes('seller')}
                                onChange={() => toggleAudience('seller')}
                            />
                            Seller
                        </label>
                    </div>
                    <InputError message={form.errors.audience} />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                        <InputLabel value="Starts At" />
                        <input
                            type="datetime-local"
                            className="admin-input"
                            value={form.data.starts_at}
                            onChange={(e) => form.setData('starts_at', e.target.value)}
                        />
                        <InputError message={form.errors.starts_at} />
                    </div>
                    <div>
                        <InputLabel value="Ends At" />
                        <input
                            type="datetime-local"
                            className="admin-input"
                            value={form.data.ends_at}
                            onChange={(e) => form.setData('ends_at', e.target.value)}
                        />
                        <InputError message={form.errors.ends_at} />
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                        <input
                            type="checkbox"
                            checked={!!form.data.is_active}
                            onChange={(e) => form.setData('is_active', e.target.checked)}
                        />
                        Active
                    </label>
                    <InputError message={form.errors.is_active} />
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button type="submit" className="btn-primary" disabled={form.processing}>
                        Save
                    </button>
                </div>
            </form>
        </DashboardLayout>
    );
}
