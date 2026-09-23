<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VisualizerRoomImage extends Model
{
    protected $fillable = [
        'visualizer_room_id',
        'image_path',
        'floor_bounds',
        'sort_order',
    ];

    protected $casts = [
        'floor_bounds' => 'array',
        'sort_order' => 'integer',
    ];

    // Relationships
    public function room(): BelongsTo
    {
        return $this->belongsTo(VisualizerRoom::class, 'visualizer_room_id');
    }

    // Accessors
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

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
}
