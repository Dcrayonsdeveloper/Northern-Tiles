<?php

namespace Database\Seeders;

use App\Domain\Dictionary\Models\Dictionary;
use App\Domain\Dictionary\Services\DictionaryService;
use Illuminate\Database\Seeder;

class DictionarySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['locale' => 'en', 'dkey' => 'auth.sign_in.title', 'value_text' => 'Sign in', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.sign_in.subtitle', 'value_text' => 'Welcome back. Please enter your details.', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.email.label', 'value_text' => 'Email', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.password.label', 'value_text' => 'Password', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.remember_me', 'value_text' => 'Remember me', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.forgot_password', 'value_text' => 'Forgot password?', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.sign_in.button', 'value_text' => 'Sign in', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.no_account', 'value_text' => "Don't have an account?", 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.sign_up.link', 'value_text' => 'Sign up', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.sign_up.title', 'value_text' => 'Create account', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.sign_up.subtitle', 'value_text' => 'Create your account in seconds.', 'group' => 'auth'],

            ['locale' => 'en', 'dkey' => 'auth.name.label', 'value_text' => 'Name', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.confirm_password.label', 'value_text' => 'Confirm Password', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.already_registered', 'value_text' => 'Already registered?', 'group' => 'auth'],

            ['locale' => 'en', 'dkey' => 'auth.reset_password.title', 'value_text' => 'Reset Password', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.reset_password.button', 'value_text' => 'Reset Password', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.forgot_password.title', 'value_text' => 'Forgot Password', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.forgot_password.description', 'value_text' => 'Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.forgot_password.button', 'value_text' => 'Email Password Reset Link', 'group' => 'auth'],

            ['locale' => 'en', 'dkey' => 'auth.confirm_password.title', 'value_text' => 'Confirm Password', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.confirm_password.description', 'value_text' => 'This is a secure area of the application. Please confirm your password before continuing.', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.confirm', 'value_text' => 'Confirm', 'group' => 'auth'],

            ['locale' => 'en', 'dkey' => 'auth.verify_email.title', 'value_text' => 'Email Verification', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.verify_email.description', 'value_text' => "Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we will gladly send you another.", 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.verify_email.sent', 'value_text' => 'A new verification link has been sent to the email address you provided during registration.', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.verify_email.resend', 'value_text' => 'Resend Verification Email', 'group' => 'auth'],
            ['locale' => 'en', 'dkey' => 'auth.logout', 'value_text' => 'Log Out', 'group' => 'auth'],

            ['locale' => 'en', 'dkey' => 'common.save', 'value_text' => 'Save', 'group' => 'common'],

            ['locale' => 'en', 'dkey' => 'dash.admin.revenue_overview', 'value_text' => 'Revenue Overview', 'group' => 'dashboard'],
            ['locale' => 'en', 'dkey' => 'dash.admin.orders_by_status', 'value_text' => 'Orders by Status', 'group' => 'dashboard'],
            ['locale' => 'en', 'dkey' => 'dash.admin.top_sellers', 'value_text' => 'Top Sellers', 'group' => 'dashboard'],
            ['locale' => 'en', 'dkey' => 'dash.admin.system_health', 'value_text' => 'System Health', 'group' => 'dashboard'],

            ['locale' => 'en', 'dkey' => 'dash.seller.sales_kpi', 'value_text' => 'Sales KPI', 'group' => 'dashboard'],
            ['locale' => 'en', 'dkey' => 'dash.seller.orders_summary', 'value_text' => 'Orders Summary', 'group' => 'dashboard'],
            ['locale' => 'en', 'dkey' => 'dash.seller.top_products', 'value_text' => 'Top Products', 'group' => 'dashboard'],
            ['locale' => 'en', 'dkey' => 'dash.seller.low_stock', 'value_text' => 'Low Stock Alerts', 'group' => 'dashboard'],

            ['locale' => 'en', 'dkey' => 'dash.common.announcements', 'value_text' => 'Announcements', 'group' => 'dashboard'],
        ];

        foreach ($items as $item) {
            Dictionary::query()->updateOrCreate(
                ['locale' => $item['locale'], 'dkey' => $item['dkey']],
                [
                    'value_text' => $item['value_text'],
                    'group' => $item['group'] ?? null,
                    'is_active' => true,
                ],
            );
        }

        $locales = collect($items)->pluck('locale')->unique()->values();
        $dictionary = app(DictionaryService::class);

        foreach ($locales as $locale) {
            $dictionary->clearCache((string) $locale);
        }
    }
}
