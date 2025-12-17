<?php

namespace App\Domain\Menu\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class MenuItem extends Model
{
    protected $fillable = [
        'menu_id',
        'parent_id',
        'label',
        'url',
        'route_name',
        'route_params',
        'target',
        'icon',
        'css_class',
        'sort_order',
        'is_active',
        'is_mega',
        'mega_columns',
        'image_url',
        'image_alt',
        'video_url',
        'badge_text',
        'badge_color',
        'description',
        'featured_content',
    ];

    protected $casts = [
        'route_params' => 'array',
        'is_active' => 'boolean',
        'is_mega' => 'boolean',
        'sort_order' => 'integer',
        'mega_columns' => 'integer',
        'featured_content' => 'array',
    ];

    protected static function booted(): void
    {
        static::saved(function (self $item) {
            if ($item->menu) {
                Cache::forget("menu.{$item->menu->location}");
            }
        });
        static::deleted(function (self $item) {
            if ($item->menu) {
                Cache::forget("menu.{$item->menu->location}");
            }
        });
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getUrl(): string
    {
        if ($this->url) {
            return $this->url;
        }

        if ($this->route_name) {
            return route($this->route_name, $this->route_params ?? []);
        }

        return '#';
    }

    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }
}
