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
                        <h1 className="text-2xl font-bold text-gray-900">About Northern TILE Distributors</h1>
                        <p className="mt-3 text-gray-700">
                            Northern TILE Distributors is a Melbourne-based wholesale supplier of premium tiles,
                            timber flooring, hybrid flooring, and stone products. Serving builders and contractors
                            across Victoria with trade pricing and expert advice from our Thomastown warehouse.
                        </p>
                        <div className="mt-4 text-gray-700">
                            <p>
                                Located at 19/324 Settlement Road, Thomastown VIC 3074, we stock an extensive range
                                including porcelain tiles, engineered and solid oak timber flooring, hybrid flooring,
                                natural stone, and professional trade supplies from brands like Mapei, ARDEX, and Soudal.
                            </p>
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-lg border p-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    Wholesale Pricing
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Trade prices for builders and contractors
                                </div>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    Expert Advice
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Professional guidance from our experienced team
                                </div>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    Melbourne Based
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    Visit our Thomastown warehouse Mon–Fri 9–5, Sat 9–1
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
