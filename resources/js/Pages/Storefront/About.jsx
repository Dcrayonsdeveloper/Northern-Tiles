import PublicLayout from '@/Layouts/PublicLayout';
import Container from '@/Components/Container';
import { Head, Link } from '@inertiajs/react';

export default function About() {
    return (
        <PublicLayout>
            <Head title="About Us" />

            {/* Breadcrumb */}
            <section className="py-4 border-b border-gray-100">
                <Container>
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href={route('home')} className="hover:text-gray-900">
                            Home
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900">About Us</span>
                    </nav>
                </Container>
            </section>

            {/* Main Content */}
            <section className="py-8">
                <Container>
                    <div className="rounded-xl border bg-white p-8 shadow-sm">
                        <h1 className="text-2xl font-bold text-gray-900">About Us</h1>
                        <p className="mt-3 text-gray-700">
                            Welcome to Jikra - your trusted destination for premium quality products.
                            We are committed to providing exceptional products and outstanding customer service.
                        </p>
                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-lg border p-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    Quality Products
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Premium materials and craftsmanship
                                </div>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    Fast Shipping
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Quick and reliable delivery
                                </div>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    Customer Support
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Dedicated support team
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
