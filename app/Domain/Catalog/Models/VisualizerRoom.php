<?php

namespace App\Domain\Catalog\Models;

use App\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VisualizerRoom extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'image_path',
        'floor_bounds',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'floor_bounds' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (VisualizerRoom $room) {
            if (empty($room->slug)) {
                $room->slug = Str::slug($room->name);
            }
        });
    }

    // Relationships
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'visualizer_room_products')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderBy('visualizer_room_products.sort_order');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    // Accessors
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        // Check if it's already a full URL or starts with /
        if (Str::startsWith($this->image_path, ['http://', 'https://', '/'])) {
            return $this->image_path;
        }

        return Storage::disk('public')->url($this->image_path);
    }

    public function getFloorBoundsArrayAttribute(): array
    {
        return $this->floor_bounds ?? [
            'x' => 0,
            'y' => 0,
            'width' => 100,
            'height' => 100,
        ];
    }

    // Helpers
    public function getProductCount(): int
    {
        return $this->products()->count();
    }

    public static function getDefaultFloorBounds(): array
    {
        return [
            'x' => 0,
            'y' => 0,
            'width' => 100,
            'height' => 100,
        ];
    }
}
