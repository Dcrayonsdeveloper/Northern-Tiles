<?php

namespace App\Domain\Cart\Models;

use App\Domain\Marketing\Models\AbandonedCartMessage;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Cart extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'email',
        'customer_id',
        'vendor_id',
        'currency',
        'expires_at',
        'abandoned_at',
        'recovered_order_id',
        'marketing_opt_in',
        'unsubscribe_token',
        'last_activity_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'abandoned_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'marketing_opt_in' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Cart $cart) {
            if (empty($cart->unsubscribe_token)) {
                $cart->unsubscribe_token = Str::random(64);
            }
        });
    }

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

    // Additional relationships for abandoned cart
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function recoveredOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'recovered_order_id');
    }

    public function abandonedCartMessages(): HasMany
    {
        return $this->hasMany(AbandonedCartMessage::class);
    }

    // Abandoned cart scopes
    public function scopeAbandoned($query)
    {
        return $query->whereNotNull('abandoned_at')
            ->whereNull('recovered_order_id');
    }

    public function scopeNotAbandoned($query)
    {
        return $query->whereNull('abandoned_at');
    }

    public function scopeRecovered($query)
    {
        return $query->whereNotNull('recovered_order_id');
    }

    public function scopeWithEmail($query)
    {
        return $query->whereNotNull('email');
    }

    public function scopeMarketingOptedIn($query)
    {
        return $query->where('marketing_opt_in', true);
    }

    public function scopeEligibleForAbandonment($query, int $thresholdMinutes = 60)
    {
        return $query->whereNull('abandoned_at')
            ->whereNull('recovered_order_id')
            ->whereNotNull('email')
            ->where('last_activity_at', '<=', now()->subMinutes($thresholdMinutes))
            ->whereHas('items');
    }

    // Abandoned cart helpers
    public function isAbandoned(): bool
    {
        return $this->abandoned_at !== null && $this->recovered_order_id === null;
    }

    public function isRecovered(): bool
    {
        return $this->recovered_order_id !== null;
    }

    public function canReceiveMarketingEmails(): bool
    {
        return $this->email !== null && $this->marketing_opt_in === true;
    }

    public function markAsAbandoned(): void
    {
        $this->update(['abandoned_at' => now()]);
    }

    public function markAsRecovered(int $orderId): void
    {
        $this->update(['recovered_order_id' => $orderId]);

        // Cancel any pending abandoned cart messages
        $this->abandonedCartMessages()
            ->pending()
            ->update(['status' => AbandonedCartMessage::STATUS_CANCELLED]);
    }

    public function updateLastActivity(): void
    {
        $this->update(['last_activity_at' => now()]);
    }

    public function setEmail(string $email, bool $optIn = false): void
    {
        $this->update([
            'email' => $email,
            'marketing_opt_in' => $optIn,
        ]);
    }

    public function unsubscribe(): void
    {
        $this->update(['marketing_opt_in' => false]);
    }

    public function getRecoveryUrl(): string
    {
        return route('cart.recover', ['token' => $this->unsubscribe_token]);
    }

    public function getUnsubscribeUrl(): string
    {
        return route('cart.unsubscribe', ['token' => $this->unsubscribe_token]);
    }

    public function hasPendingMessages(): bool
    {
        return $this->abandonedCartMessages()->pending()->exists();
    }

    public function getSentMessagesCount(): int
    {
        return $this->abandonedCartMessages()->sent()->count();
    }
}
