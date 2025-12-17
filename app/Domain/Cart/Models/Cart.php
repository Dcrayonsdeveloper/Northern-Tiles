<?php

namespace App\Domain\Cart\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'currency',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    public static function getOrCreate(?int $userId, ?string $sessionId): self
    {
        if ($userId) {
            $cart = static::where('user_id', $userId)->active()->first();
            if ($cart) {
                return $cart;
            }
        }

        if ($sessionId) {
            $cart = static::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->active()
                ->first();
            if ($cart) {
                if ($userId) {
                    $cart->update(['user_id' => $userId]);
                }
                return $cart;
            }
        }

        return static::create([
            'user_id' => $userId,
            'session_id' => $sessionId,
            'expires_at' => now()->addDays(30),
        ]);
    }

    public function getSubtotal(): float
    {
        return $this->items->sum(fn ($item) => $item->price * $item->quantity);
    }

    public function getItemCount(): int
    {
        return $this->items->sum('quantity');
    }

    public function isEmpty(): bool
    {
        return $this->items->isEmpty();
    }

    public function clear(): void
    {
        $this->items()->delete();
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at <= now();
    }

    public function extendExpiry(int $days = 30): void
    {
        $this->update(['expires_at' => now()->addDays($days)]);
    }
}
