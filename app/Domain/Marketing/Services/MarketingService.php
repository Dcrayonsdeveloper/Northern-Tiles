<?php

namespace App\Domain\Marketing\Services;

use App\Domain\Marketing\Models\ContentChecklist;
use App\Domain\Marketing\Models\UtmCampaign;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class MarketingService
{
    public function buildUtmUrl(UtmCampaign $campaign): string
    {
        return $campaign->getUrl();
    }

    public function createCampaign(array $data): UtmCampaign
    {
        return UtmCampaign::create($data);
    }

    public function getCampaigns(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = UtmCampaign::with('creator');

        if (!empty($filters['is_active'])) {
            $query->active();
        }

        if (!empty($filters['utm_source'])) {
            $query->where('utm_source', $filters['utm_source']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('utm_campaign', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function getContentChecklist(string $contentType, int $contentId): ContentChecklist
    {
        return ContentChecklist::firstOrCreate(
            ['content_type' => $contentType, 'content_id' => $contentId],
            ['checklist_json' => ContentChecklist::getDefaultItems($contentType)]
        );
    }

    public function updateChecklist(string $contentType, int $contentId, array $items): ContentChecklist
    {
        $checklist = $this->getContentChecklist($contentType, $contentId);
        $checklist->updateChecklist($items);
        return $checklist;
    }

    public function processContentChecklist($content, string $contentType): ContentChecklist
    {
        $checklist = $this->getContentChecklist($contentType, $content->id);
        $items = $checklist->getChecklist();

        foreach ($items as &$item) {
            $item['completed'] = $this->checkItem($content, $item['key'], $contentType);
        }

        $checklist->updateChecklist($items);
        return $checklist;
    }

    protected function checkItem($content, string $key, string $contentType): bool
    {
        switch ($key) {
            case 'has_title':
                return !empty($content->title) || !empty($content->name);
            case 'has_description':
                return !empty($content->description);
            case 'has_content':
                return !empty($content->body_json);
            case 'has_excerpt':
                return !empty($content->excerpt);
            case 'has_meta_title':
                return !empty($content->meta_title);
            case 'has_meta_description':
                return !empty($content->meta_description);
            case 'has_images':
                return !empty($content->image_url) || !empty($content->featured_image);
            case 'has_featured_image':
                return !empty($content->featured_image);
            case 'has_price':
                return isset($content->price) && $content->price > 0;
            case 'has_category':
                return !empty($content->category_id);
            case 'has_author':
                return !empty($content->author_id);
            case 'has_tags':
                return method_exists($content, 'tags') && $content->tags()->count() > 0;
            case 'has_content_blocks':
                return method_exists($content, 'contentBlocks') && $content->contentBlocks()->count() > 0;
            case 'has_sources':
                return !empty($content->sources_json);
            default:
                return false;
        }
    }

    public function getInsights(?int $userId = null): array
    {
        $cacheKey = $userId ? "insights.{$userId}" : 'insights.global';

        return Cache::remember($cacheKey, 600, function () {
            return [
                'total_products' => \App\Models\Product::count(),
                'active_products' => \App\Models\Product::active()->count(),
                'total_orders' => \App\Models\Order::count(),
                'pending_orders' => \App\Models\Order::where('status', 'pending')->count(),
                'total_posts' => \App\Domain\CMS\Models\Post::count(),
                'published_posts' => \App\Domain\CMS\Models\Post::published()->count(),
                'total_pages' => \App\Domain\CMS\Models\Page::count(),
                'published_pages' => \App\Domain\CMS\Models\Page::published()->count(),
                'active_campaigns' => UtmCampaign::active()->count(),
            ];
        });
    }

    public function flushInsightsCache(?int $userId = null): void
    {
        $cacheKey = $userId ? "insights.{$userId}" : 'insights.global';
        Cache::forget($cacheKey);
    }
}
