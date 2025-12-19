<?php

use App\Domain\Catalog\Jobs\ReindexCollectionsJob;
use App\Domain\Marketing\Jobs\DetectAbandonedCartsJob;
use App\Domain\Marketing\Jobs\SendAbandonedCartEmailJob;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Abandoned Cart Detection - Every 10 minutes
Schedule::job(new DetectAbandonedCartsJob())
    ->everyTenMinutes()
    ->withoutOverlapping()
    ->name('detect-abandoned-carts');

// Send Abandoned Cart Emails - Every 5 minutes
Schedule::job(new SendAbandonedCartEmailJob())
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->name('send-abandoned-cart-emails');

// Reindex All Collections - Daily at 2 AM
Schedule::job(new ReindexCollectionsJob())
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->name('reindex-collections');

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
