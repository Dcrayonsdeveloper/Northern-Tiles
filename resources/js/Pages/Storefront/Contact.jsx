import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Contact() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('contact.store'), {
            onSuccess: () => reset('subject', 'message'),
        });
    };

    return (
        <PublicLayout>
            <Head title="Contact" />

            {/* Breadcrumb */}
            <section className="py-4 border-b border-gray-100">
                <Container>
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href={route('home')} className="hover:text-gray-900">
                            Home
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900">Contact</span>
                    </nav>
                </Container>
            </section>

            {/* Main Content */}
            <section className="py-8">
                <Container>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="rounded-xl border bg-white p-8 shadow-sm">
                            <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
                            <p className="mt-3 text-gray-700">
                                Send us a message and we'll get back to you as soon as possible.
                            </p>

                            <form onSubmit={submit} className="mt-6 space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Name
                                    </label>
                                    <input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                    />
                                    {errors.name && (
                                        <div className="mt-1 text-xs text-red-600">
                                            {errors.name}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                    />
                                    {errors.email && (
                                        <div className="mt-1 text-xs text-red-600">
                                            {errors.email}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Subject (optional)
                                    </label>
                                    <input
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Message
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        className="mt-1 w-full rounded-md border-gray-200 text-sm shadow-sm focus:border-gray-900 focus:ring-gray-900"
                                    />
                                    {errors.message && (
                                        <div className="mt-1 text-xs text-red-600">
                                            {errors.message}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Send Message
                                </button>
                            </form>
                        </div>

                        <div className="rounded-xl border bg-white p-8 shadow-sm">
                            <div className="text-sm font-semibold text-gray-900">
                                Contact Details
                            </div>
                            <div className="mt-6 space-y-4 text-sm text-gray-700">
                                <div className="flex items-start gap-3">
                                    <svg className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <div>19/324 Settlement Road, Thomastown VIC 3074</div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <div>
                                        <a href="tel:0394646623" className="hover:text-brand transition-colors">03 9464 6623</a>
                                        <span className="mx-2 text-gray-300">|</span>
                                        <a href="tel:0416924324" className="hover:text-brand transition-colors">0416 924 324</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <a href="mailto:info@ntiled.com.au" className="hover:text-brand transition-colors">info@ntiled.com.au</a>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <div>
                                        <div>Mon–Fri 9:00 AM – 5:00 PM</div>
                                        <div>Sat 9:00 AM – 1:00 PM</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
                                <iframe
                                    title="Northern Tile Distributors location"
                                    src="https://maps.google.com/maps?q=19%2F324%20Settlement%20Road%2C%20Thomastown%20VIC%203074&output=embed"
                                    width="100%"
                                    height="320"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    allowFullScreen
                                />
                                <a
                                    href="https://www.google.com/maps/dir/?api=1&destination=19%2F324%20Settlement%20Road%2C%20Thomastown%20VIC%203074"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="block bg-gray-50 px-4 py-2 text-center text-sm font-medium text-brand hover:bg-gray-100 transition-colors"
                                >
                                    Get Directions →
                                </a>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
