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
        // Create main admin user
        $admin = User::query()->firstOrNew(['email' => 'rahul@dcrayons.app']);
        $admin->name = 'Rahul Admin';
        $admin->password = Hash::make('password');
        $admin->is_admin = true;
        $admin->email_verified_at = now();
        $admin->save();

        // Create test admin user (backup)
        $testAdmin = User::query()->firstOrNew(['email' => 'test@example.com']);
        $testAdmin->name = 'Test User';
        $testAdmin->password = Hash::make('password');
        $testAdmin->is_admin = true;
        $testAdmin->email_verified_at = now();
        $testAdmin->save();

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
