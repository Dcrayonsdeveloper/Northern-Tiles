<?php

namespace App\Domain\Catalog\Jobs;

use App\Domain\Catalog\Services\TagService;
use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateProductTagsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        protected int $productId
    ) {}

    public function handle(TagService $tagService): void
    {
        $product = Product::with(['category', 'attributeSet.attributes'])->find($this->productId);

        if (!$product) {
            return;
        }

        $generatedTags = $tagService->generateTags($product);

        $existingManualTags = $product->tags()->where('type', 'manual')->pluck('name')->toArray();

        $allTags = array_unique(array_merge($existingManualTags, $generatedTags));

        $tagService->attachTags($product, $allTags, ['generated_at' => now()->toIso8601String()]);
    }

    public function tags(): array
    {
        return ['product-tags', 'product:' . $this->productId];
    }
}
