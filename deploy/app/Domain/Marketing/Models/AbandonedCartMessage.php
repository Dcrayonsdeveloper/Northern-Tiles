<?php

namespace App\Domain\Marketing\Models;

use App\Domain\Cart\Models\Cart;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AbandonedCartMessage extends Model
{
    protected $fillable = [
        'cart_id',
        'flow_id',
        'step',
        'template_key',
        'status',
        'scheduled_at',
        'sent_at',
        'error_text',
        'message_id',
        'metadata',
    ];

    protected $casts = [
        'step' => 'integer',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'metadata' => 'array',
    ];

    public const STATUS_QUEUED = 'queued';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_SENT = 'sent';
    public const STATUS_SKIPPED = 'skipped';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    // Relationships
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function flow(): BelongsTo
    {
        return $this->belongsTo(AbandonedCartFlow::class, 'flow_id');
    }

    // Scopes
    public function scopeQueued($query)
    {
        return $query->where('status', self::STATUS_QUEUED);
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED);
    }

    public function scopeSent($query)
    {
        return $query->where('status', self::STATUS_SENT);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [self::STATUS_QUEUED, self::STATUS_SCHEDULED]);
    }

    public function scopeReadyToSend($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
            ->where('scheduled_at', '<=', now());
    }

    public function scopeForCart($query, int $cartId)
    {
        return $query->where('cart_id', $cartId);
    }

    // Helpers
    public function isPending(): bool
    {
        return in_array($this->status, [self::STATUS_QUEUED, self::STATUS_SCHEDULED]);
    }

    public function isSent(): bool
    {
        return $this->status === self::STATUS_SENT;
    }

    public function isSkipped(): bool
    {
        return $this->status === self::STATUS_SKIPPED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function markAsSent(?string $messageId = null): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
            'message_id' => $messageId,
        ]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_text' => $error,
        ]);
    }

    public function markAsSkipped(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_SKIPPED,
            'error_text' => $reason,
        ]);
    }

    public function markAsCancelled(string $reason = 'Cart recovered'): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'error_text' => $reason,
        ]);
    }

    public function schedule(\DateTimeInterface $at): void
    {
        $this->update([
            'status' => self::STATUS_SCHEDULED,
            'scheduled_at' => $at,
        ]);
    }

    public static function getStatuses(): array
    {
        return [
            self::STATUS_QUEUED => 'Queued',
            self::STATUS_SCHEDULED => 'Scheduled',
            self::STATUS_SENT => 'Sent',
            self::STATUS_SKIPPED => 'Skipped',
            self::STATUS_FAILED => 'Failed',
            self::STATUS_CANCELLED => 'Cancelled',
        ];
    }
}
