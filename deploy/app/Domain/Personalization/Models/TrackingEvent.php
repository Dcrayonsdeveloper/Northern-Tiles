<?php

namespace App\Domain\Personalization\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrackingEvent extends Model
{
    public $timestamps = false;

    protected $table = 'tracking_events';

    protected $fillable = [
        'user_id',
        'session_id',
        'event_type',
        'event_data',
        'ip_address',
        'user_agent',
        'referrer',
        'created_at',
    ];

    protected $casts = [
        'event_data' => 'array',
        'created_at' => 'datetime',
    ];

    public const TYPE_PAGE_VIEW = 'page_view';
    public const TYPE_PRODUCT_VIEW = 'product_view';
    public const TYPE_ADD_TO_CART = 'add_to_cart';
    public const TYPE_REMOVE_FROM_CART = 'remove_from_cart';
    public const TYPE_CHECKOUT_START = 'checkout_start';
    public const TYPE_PURCHASE = 'purchase';
    public const TYPE_SEARCH = 'search';
    public const TYPE_FILTER = 'filter';
    public const TYPE_FAVORITE_ADD = 'favorite_add';
    public const TYPE_FAVORITE_REMOVE = 'favorite_remove';

    protected static function booted(): void
    {
        static::creating(function (self $event) {
            $event->created_at = $event->created_at ?? now();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('event_type', $type);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForSession($query, string $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public static function track(
        string $type,
        array $data = [],
        ?int $userId = null,
        ?string $sessionId = null
    ): self {
        return static::create([
            'user_id' => $userId,
            'session_id' => $sessionId,
            'event_type' => $type,
            'event_data' => $data,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'referrer' => request()->header('referer'),
        ]);
    }
}
