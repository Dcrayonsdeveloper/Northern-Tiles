<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Database\Seeders\StorefrontSeeder;
use Database\Seeders\DictionarySeeder;
use Database\Seeders\SettingsSeeder;
use Database\Seeders\DashboardSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\MenuSeeder;
use Database\Seeders\CMSSeeder;
use Database\Seeders\SectionRegistrySeeder;
use Database\Seeders\CouponSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Create/update main admin user - always reset password
        User::updateOrCreate(
            ['email' => 'rahul@dcrayons.app'],
            [
                'name' => 'Rahul Admin',
                'password' => Hash::make('password'),
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create/update test admin user - always reset password
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->call([
            RolesAndPermissionsSeeder::class,
            DictionarySeeder::class,
            SettingsSeeder::class,
            MenuSeeder::class,
            CMSSeeder::class,
            SectionRegistrySeeder::class,
            StorefrontSeeder::class,
            CouponSeeder::class,
            DashboardSeeder::class,
        ]);
    }
}
