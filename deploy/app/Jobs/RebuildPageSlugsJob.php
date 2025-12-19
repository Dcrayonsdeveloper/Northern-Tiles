<?php

namespace App\Jobs;

use App\Domain\CMS\Services\PageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RebuildPageSlugsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;

    public function __construct(
        public int $pageId
    ) {}

    public function handle(PageService $pageService): void
    {
        $pageService->rebuildDescendantSlugs($this->pageId);
    }

    public function tags(): array
    {
        return ['cms', 'page-slugs', 'page:' . $this->pageId];
    }
}
