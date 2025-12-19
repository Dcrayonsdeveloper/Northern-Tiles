<?php

namespace App\Domain\Marketing\Jobs;

use App\Domain\Marketing\Services\AbandonedCartService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DetectAbandonedCartsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;
    public int $timeout = 300;

    public function __construct(
        protected ?int $vendorId = null
    ) {}

    public function handle(AbandonedCartService $abandonedCartService): void
    {
        Log::info('DetectAbandonedCartsJob started', ['vendor_id' => $this->vendorId]);

        $count = $abandonedCartService->detectAbandonedCarts($this->vendorId);

        Log::info("DetectAbandonedCartsJob completed: {$count} carts marked as abandoned");
    }

    public function tags(): array
    {
        return ['abandoned-carts', 'detect'];
    }
}
