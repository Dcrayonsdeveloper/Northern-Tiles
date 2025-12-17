import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Admin Dashboard
                </h2>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="space-y-4 p-6 text-gray-900">
                            <div className="text-sm text-gray-700">
                                Manage store settings and content.
                            </div>

                            <div>
                                <Link
                                    href={route('admin.settings.ui.edit')}
                                    className="text-sm font-medium text-gray-700 underline hover:text-gray-900"
                                >
                                    UI Settings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
