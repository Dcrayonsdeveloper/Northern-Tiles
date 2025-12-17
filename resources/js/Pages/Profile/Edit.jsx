import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <DashboardLayout title="Profile">
            <Head title="Profile" />

            <div className="mx-auto max-w-5xl space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </DashboardLayout>
    );
}
