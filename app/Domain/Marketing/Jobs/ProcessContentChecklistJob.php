<?php

namespace App\Domain\Marketing\Jobs;

use App\Domain\Marketing\Services\MarketingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessContentChecklistJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        protected string $contentType,
        protected int $contentId
    ) {}

    public function handle(MarketingService $marketingService): void
    {
        $modelClass = $this->getModelClass($this->contentType);

        if (!$modelClass) {
            return;
        }

        $content = $modelClass::find($this->contentId);

        if (!$content) {
            return;
        }

        $marketingService->processContentChecklist($content, $this->contentType);
    }

    protected function getModelClass(string $contentType): ?string
    {
        return match ($contentType) {
            'product' => \App\Models\Product::class,
            'post' => \App\Domain\CMS\Models\Post::class,
            'page' => \App\Domain\CMS\Models\Page::class,
            default => null,
        };
    }

    public function tags(): array
    {
        return ['marketing', 'checklist', "{$this->contentType}:{$this->contentId}"];
    }
}
