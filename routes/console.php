<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('user:make-admin {email}', function (string $email) {
    $user = User::query()->where('email', $email)->first();

    if (!$user) {
        $this->error("User not found: {$email}");
        return 1;
    }

    $user->is_admin = true;
    $user->save();

    $this->info("User promoted to admin: {$email}");
    return 0;
})->purpose('Promote a user to admin');
