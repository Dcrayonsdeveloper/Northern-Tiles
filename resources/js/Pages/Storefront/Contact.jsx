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
                                Business info
                            </div>
                            <div className="mt-3 text-sm text-gray-700">
                                Add your company address, phone, social links, and a map
                                embed here.
                            </div>
                            <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                                Example:
                                <div className="mt-2">Email: support@example.com</div>
                                <div>Phone: +91 99999 99999</div>
                                <div>Hours: Mon–Sat 10:00–18:00</div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
