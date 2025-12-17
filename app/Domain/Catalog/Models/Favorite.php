<?php

namespace App\Domain\Catalog\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favorite extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'product_id',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $favorite) {
            $favorite->created_at = $favorite->created_at ?? now();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Product::class);
    }

    public static function toggle(int $userId, int $productId): array
    {
        $favorite = static::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($favorite) {
            $favorite->delete();
            return ['action' => 'removed', 'is_favorite' => false];
        }

        static::create([
            'user_id' => $userId,
            'product_id' => $productId,
        ]);

        return ['action' => 'added', 'is_favorite' => true];
    }

    public static function isFavorite(int $userId, int $productId): bool
    {
        return static::where('user_id', $userId)
            ->where('product_id', $productId)
            ->exists();
    }

    public static function getCount(int $userId): int
    {
        return static::where('user_id', $userId)->count();
    }
}
