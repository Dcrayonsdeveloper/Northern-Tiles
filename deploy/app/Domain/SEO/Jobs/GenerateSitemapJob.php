<?php

namespace App\Domain\SEO\Jobs;

use App\Domain\SEO\Services\SeoService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateSitemapJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 120;

    public function handle(SeoService $seoService): void
    {
        try {
            $seoService->generateSitemap();
            Log::info('Sitemap generated successfully');
        } catch (\Exception $e) {
            Log::error('Failed to generate sitemap: ' . $e->getMessage());
            throw $e;
        }
    }

    public function tags(): array
    {
        return ['seo', 'sitemap'];
    }
}
