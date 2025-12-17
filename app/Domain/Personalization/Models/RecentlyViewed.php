<?php

namespace App\Domain\Personalization\Models;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecentlyViewed extends Model
{
    public $timestamps = false;

    protected $table = 'recently_viewed';

    protected $fillable = [
        'user_id',
        'session_id',
        'product_id',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForSession($query, string $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    public static function track(int $productId, ?int $userId = null, ?string $sessionId = null): void
    {
        $existing = static::query()
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->when(!$userId && $sessionId, fn ($q) => $q->where('session_id', $sessionId))
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            $existing->update(['viewed_at' => now()]);
            return;
        }

        static::create([
            'user_id' => $userId,
            'session_id' => $sessionId,
            'product_id' => $productId,
            'viewed_at' => now(),
        ]);

        static::cleanup($userId, $sessionId);
    }

    protected static function cleanup(?int $userId, ?string $sessionId, int $keep = 50): void
    {
        $query = static::query()
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->when(!$userId && $sessionId, fn ($q) => $q->where('session_id', $sessionId))
            ->orderBy('viewed_at', 'desc');

        $toDelete = $query->skip($keep)->pluck('id');

        if ($toDelete->isNotEmpty()) {
            static::whereIn('id', $toDelete)->delete();
        }
    }

    public static function getRecent(?int $userId = null, ?string $sessionId = null, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return static::with('product')
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->when(!$userId && $sessionId, fn ($q) => $q->where('session_id', $sessionId))
            ->orderBy('viewed_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
