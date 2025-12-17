import PublicLayout from '@/Layouts/PublicLayout';
import { Head } from '@inertiajs/react';

export default function About() {
    return (
        <PublicLayout>
            <Head title="About" />

            <div className="rounded-xl border bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">About</h1>
                <p className="mt-3 text-gray-700">
                    This project is a complete Laravel + React (Inertia) setup
                    designed to serve both an ecommerce storefront and an
                    informational website.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-semibold text-gray-900">
                            Laravel 12
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                            Backend + routing + database
                        </div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-semibold text-gray-900">
                            React (Inertia)
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                            SPA-like UI without an API
                        </div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-semibold text-gray-900">
                            Tailwind + SCSS
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                            Modern styling pipeline
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
