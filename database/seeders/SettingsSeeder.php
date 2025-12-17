<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $topBar = Setting::getValue('ui.topBar');

        if ($topBar === null) {
            Setting::setValue('ui.topBar', config('ui.topBar'));
        }
    }
}
