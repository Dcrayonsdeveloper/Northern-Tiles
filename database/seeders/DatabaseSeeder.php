<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Database\Seeders\StorefrontSeeder;
use Database\Seeders\SettingsSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $admin = User::query()->firstOrNew(['email' => 'test@example.com']);
        $admin->name = 'Test User';
        $admin->password = Hash::make('password');
        $admin->is_admin = true;
        $admin->email_verified_at = now();
        $admin->save();

        $this->call(SettingsSeeder::class);
        $this->call(StorefrontSeeder::class);
    }
}
