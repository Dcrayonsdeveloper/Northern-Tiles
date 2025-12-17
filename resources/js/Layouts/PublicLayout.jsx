import StorefrontHeader from '@/Components/Storefront/StorefrontHeader';
import { usePage } from '@inertiajs/react';

export default function PublicLayout({ children }) {
    const { auth, cart, flash, ui } = usePage().props;
    const user = auth?.user;

    const cartCount = cart?.count ?? 0;
    const topBar = ui?.topBar;
    const success = flash?.success;
    const error = flash?.error;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <StorefrontHeader user={user} cartCount={cartCount} topBar={topBar} />

            {(success || error) && (
                <div className="w-full px-4 pt-4 sm:px-6 lg:px-8">
                    {success && (
                        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </div>
                    )}
                </div>
            )}

            <main className="w-full px-4 py-10 sm:px-6 lg:px-8">
                {children}
            </main>

            <footer className="border-t bg-white">
                <div className="w-full px-4 py-8 text-sm text-gray-500 sm:px-6 lg:px-8">
                    © {new Date().getFullYear()} Jikra. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
