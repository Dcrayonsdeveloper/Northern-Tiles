<?php

namespace App\Domain\Catalog\Jobs;

use App\Domain\Catalog\Services\CollectionIndexService;
use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ReindexCollectionsForProductJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;
    public int $timeout = 120;

    public function __construct(
        protected int $productId
    ) {}

    public function handle(CollectionIndexService $indexService): void
    {
        $product = Product::find($this->productId);

        if (!$product) {
            Log::warning("Product {$this->productId} not found for collection reindex");
            return;
        }

        Log::info("Updating collections for product {$this->productId}");

        $results = $indexService->updateCollectionsForProduct($product);

        Log::info("Collection update results for product {$this->productId}", $results);
    }

    public function tags(): array
    {
        return ['collections', 'product-' . $this->productId];
    }
}
