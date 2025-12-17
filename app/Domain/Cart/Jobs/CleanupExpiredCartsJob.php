<?php

namespace App\Domain\Cart\Jobs;

use App\Domain\Cart\Models\Cart;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CleanupExpiredCartsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function handle(): void
    {
        $expiredCarts = Cart::expired()->get();

        $count = 0;
        foreach ($expiredCarts as $cart) {
            $cart->items()->delete();
            $cart->delete();
            $count++;
        }

        Log::info("Cleaned up {$count} expired carts");
    }

    public function tags(): array
    {
        return ['cart', 'cleanup'];
    }
}
