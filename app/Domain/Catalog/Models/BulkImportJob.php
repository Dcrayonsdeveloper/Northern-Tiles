<?php

namespace App\Domain\Catalog\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BulkImportJob extends Model
{
    protected $fillable = [
        'vendor_id',
        'type',
        'status',
        'total',
        'processed',
        'failed',
        'result_json',
        'error_text',
        'created_by',
    ];

    protected $casts = [
        'total' => 'integer',
        'processed' => 'integer',
        'failed' => 'integer',
        'result_json' => 'array',
    ];

    public const TYPE_PRODUCTS_CSV = 'products_csv';
    public const TYPE_MEDIA_ZIP = 'media_zip';
    public const TYPE_PRICE_UPDATE_CSV = 'price_update_csv';

    public const STATUS_QUEUED = 'queued';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getProgressPercentage(): int
    {
        if ($this->total === 0) {
            return 0;
        }
        return (int) round(($this->processed / $this->total) * 100);
    }

    public function isRunning(): bool
    {
        return $this->status === self::STATUS_RUNNING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function markRunning(): void
    {
        $this->update(['status' => self::STATUS_RUNNING]);
    }

    public function markCompleted(array $result = []): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'result_json' => $result,
        ]);
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_text' => $error,
        ]);
    }

    public function incrementProcessed(int $count = 1): void
    {
        $this->increment('processed', $count);
    }

    public function incrementFailed(int $count = 1): void
    {
        $this->increment('failed', $count);
    }

    public function scopeForVendor($query, int $vendorId)
    {
        return $query->where('vendor_id', $vendorId);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [self::STATUS_QUEUED, self::STATUS_RUNNING]);
    }
}
