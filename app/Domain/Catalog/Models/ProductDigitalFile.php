<?php

namespace App\Domain\Catalog\Models;

use App\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductDigitalFile extends Model
{
    protected $fillable = [
        'product_id',
        'variant_id',
        'file_path',
        'file_name',
        'mime',
        'file_size_bytes',
        'max_downloads',
        'expires_days',
        'is_active',
    ];

    protected $casts = [
        'file_size_bytes' => 'integer',
        'max_downloads' => 'integer',
        'expires_days' => 'integer',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function getDownloadUrl(): string
    {
        return Storage::disk('local')->temporaryUrl(
            $this->file_path,
            now()->addMinutes(30)
        );
    }

    public function getFileSizeFormatted(): string
    {
        $bytes = $this->file_size_bytes;
        if ($bytes >= 1073741824) {
            return round($bytes / 1073741824, 2) . ' GB';
        }
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return round($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' bytes';
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
