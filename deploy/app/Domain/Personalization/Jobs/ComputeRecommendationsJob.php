<?php

namespace App\Domain\Personalization\Jobs;

use App\Domain\Personalization\Services\PersonalizationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ComputeRecommendationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        protected int $productId
    ) {}

    public function handle(PersonalizationService $personalizationService): void
    {
        $personalizationService->flushRecommendationsCache($this->productId);

        $personalizationService->getRecommendations($this->productId);
    }

    public function tags(): array
    {
        return ['personalization', 'recommendations', 'product:' . $this->productId];
    }
}
