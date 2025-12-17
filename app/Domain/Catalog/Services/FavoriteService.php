<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\Favorite;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class FavoriteService
{
    public function toggle(int $userId, int $productId): array
    {
        $result = Favorite::toggle($userId, $productId);
        $this->flushCountCache($userId);
        return $result;
    }

    public function getCount(int $userId): int
    {
        return Cache::remember("favorites.count.{$userId}", 600, function () use ($userId) {
            return Favorite::getCount($userId);
        });
    }

    public function getFavorites(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return Favorite::with(['product' => function ($q) {
            $q->with('category');
        }])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function isFavorite(int $userId, int $productId): bool
    {
        return Favorite::isFavorite($userId, $productId);
    }

    public function getFavoriteProductIds(int $userId): array
    {
        return Favorite::where('user_id', $userId)
            ->pluck('product_id')
            ->toArray();
    }

    public function flushCountCache(int $userId): void
    {
        Cache::forget("favorites.count.{$userId}");
    }
}
