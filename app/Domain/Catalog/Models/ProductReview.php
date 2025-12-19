<?php

namespace App\Domain\Catalog\Models;

use App\Models\Product;
use App\Models\User;
use App\Models\Order;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductReview extends Model
{
    protected $fillable = [
        'product_id',
        'user_id',
        'order_id',
        'reviewer_name',
        'reviewer_email',
        'rating',
        'title',
        'body',
        'pros',
        'cons',
        'verified_purchase',
        'is_featured',
        'status',
        'helpful_count',
        'not_helpful_count',
        'admin_reply',
        'admin_replied_at',
    ];

    protected $casts = [
        'pros' => 'array',
        'cons' => 'array',
        'verified_purchase' => 'boolean',
        'is_featured' => 'boolean',
        'admin_replied_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeVerified($query)
    {
        return $query->where('verified_purchase', true);
    }

    public function markHelpful(): void
    {
        $this->increment('helpful_count');
    }

    public function markNotHelpful(): void
    {
        $this->increment('not_helpful_count');
    }

    public function approve(): void
    {
        $this->update(['status' => self::STATUS_APPROVED]);
        $this->product->updateRatingCache();
    }

    public function reject(): void
    {
        $this->update(['status' => self::STATUS_REJECTED]);
        $this->product->updateRatingCache();
    }

    public function addAdminReply(string $reply): void
    {
        $this->update([
            'admin_reply' => $reply,
            'admin_replied_at' => now(),
        ]);
    }
}
