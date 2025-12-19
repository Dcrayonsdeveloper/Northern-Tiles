<?php

namespace App\Domain\Catalog\Jobs;

use App\Domain\Catalog\Models\Collection;
use App\Domain\Catalog\Services\CollectionIndexService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ReindexCollectionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;
    public int $timeout = 600;

    public function __construct(
        protected ?int $collectionId = null,
        protected ?int $vendorId = null
    ) {}

    public function handle(CollectionIndexService $indexService): void
    {
        Log::info('ReindexCollectionsJob started', [
            'collection_id' => $this->collectionId,
            'vendor_id' => $this->vendorId,
        ]);

        if ($this->collectionId) {
            // Reindex single collection
            $collection = Collection::find($this->collectionId);
            if ($collection) {
                $count = $indexService->reindexCollection($collection);
                Log::info("Reindexed collection {$this->collectionId} with {$count} products");
            }
        } else {
            // Reindex all collections
            $results = $indexService->reindexAllCollections($this->vendorId);
            Log::info('Reindexed all collections', ['results' => $results]);
        }
    }

    public function tags(): array
    {
        return ['collections', 'reindex'];
    }
}
