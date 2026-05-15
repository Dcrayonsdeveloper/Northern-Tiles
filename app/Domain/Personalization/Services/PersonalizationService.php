<?php

namespace App\Domain\Personalization\Services;

use App\Domain\Personalization\Models\RecentlyViewed;
use App\Domain\Personalization\Models\TrackingEvent;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class PersonalizationService
{
    public function trackView(int $productId, ?int $userId = null, ?string $sessionId = null): void
    {
        RecentlyViewed::track($productId, $userId, $sessionId);

        TrackingEvent::track(
            TrackingEvent::TYPE_PRODUCT_VIEW,
            ['product_id' => $productId],
            $userId,
            $sessionId
        );
    }

    public function trackEvent(string $eventType, array $data, ?int $userId = null, ?string $sessionId = null): void
    {
        TrackingEvent::track($eventType, $data, $userId, $sessionId);
    }

    public function getRecentlyViewed(?int $userId = null, ?string $sessionId = null, int $limit = 10): Collection
    {
        $recentItems = RecentlyViewed::getRecent($userId, $sessionId, $limit);

        return $recentItems->map(fn ($item) => $item->product)->filter();
    }

    public function getRecommendations(int $productId, int $limit = 8): Collection
    {
        return Cache::remember("recommendations.{$productId}", 1800, function () use ($productId, $limit) {
            $product = Product::find($productId);

            if (!$product) {
                return collect();
            }

            $related = collect();

            if ($product->category_id) {
                $categoryIds = Product::where('category_id', $product->category_id)
                    ->where('id', '!=', $productId)
                    ->active()
                    ->pluck('id')
                    ->shuffle()
                    ->take($limit);
                $categoryProducts = $categoryIds->isNotEmpty()
                    ? Product::whereIn('id', $categoryIds)->get()
                    : collect();

                $related = $related->merge($categoryProducts);
            }

            if ($related->count() < $limit && $product->tags->isNotEmpty()) {
                $tagIds = $product->tags->pluck('id');
                $needed = $limit - $related->count();
                $taggedIds = Product::whereHas('tags', function ($q) use ($tagIds) {
                    $q->whereIn('tags.id', $tagIds);
                })
                    ->where('id', '!=', $productId)
                    ->whereNotIn('id', $related->pluck('id'))
                    ->active()
                    ->pluck('id')
                    ->shuffle()
                    ->take($needed);
                $taggedProducts = $taggedIds->isNotEmpty()
                    ? Product::whereIn('id', $taggedIds)->get()
                    : collect();

                $related = $related->merge($taggedProducts);
            }

            if ($related->count() < $limit) {
                $viewedWith = $this->getFrequentlyViewedWith($productId, $limit - $related->count());
                $related = $related->merge($viewedWith);
            }

            return $related->unique('id')->take($limit);
        });
    }

    protected function getFrequentlyViewedWith(int $productId, int $limit): Collection
    {
        $sessions = RecentlyViewed::where('product_id', $productId)
            ->whereNotNull('session_id')
            ->pluck('session_id')
            ->unique()
            ->take(100);

        if ($sessions->isEmpty()) {
            return collect();
        }

        return Product::whereIn('id', function ($query) use ($sessions, $productId) {
            $query->select('product_id')
                ->from('recently_viewed')
                ->whereIn('session_id', $sessions)
                ->where('product_id', '!=', $productId)
                ->groupBy('product_id')
                ->orderByRaw('COUNT(*) DESC');
        })
            ->active()
            ->limit($limit)
            ->get();
    }

    public function getPersonalizedProducts(?int $userId = null, ?string $sessionId = null, int $limit = 12): Collection
    {
        $cacheKey = $userId ? "personalized.user.{$userId}" : "personalized.session.{$sessionId}";

        return Cache::remember($cacheKey, 600, function () use ($userId, $sessionId, $limit) {
            $recentlyViewed = RecentlyViewed::query()
                ->when($userId, fn ($q) => $q->where('user_id', $userId))
                ->when(!$userId && $sessionId, fn ($q) => $q->where('session_id', $sessionId))
                ->orderBy('viewed_at', 'desc')
                ->limit(5)
                ->pluck('product_id');

            if ($recentlyViewed->isEmpty()) {
                $ids = Product::active()->pluck('id')->shuffle()->take($limit);
                return $ids->isNotEmpty() ? Product::whereIn('id', $ids)->get() : collect();
            }

            $categoryIds = Product::whereIn('id', $recentlyViewed)
                ->pluck('category_id')
                ->filter()
                ->unique();

            $ids = Product::whereIn('category_id', $categoryIds)
                ->whereNotIn('id', $recentlyViewed)
                ->active()
                ->pluck('id')
                ->shuffle()
                ->take($limit);
            return $ids->isNotEmpty() ? Product::whereIn('id', $ids)->get() : collect();
        });
    }

    public function flushRecommendationsCache(int $productId): void
    {
        Cache::forget("recommendations.{$productId}");
    }
}
