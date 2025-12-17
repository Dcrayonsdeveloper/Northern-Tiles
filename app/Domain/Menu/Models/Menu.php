<?php

namespace App\Domain\Menu\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Menu extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'location',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(fn (self $menu) => Cache::forget("menu.{$menu->location}"));
        static::deleted(fn (self $menu) => Cache::forget("menu.{$menu->location}"));
    }

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('sort_order');
    }

    public function rootItems(): HasMany
    {
        return $this->hasMany(MenuItem::class)
            ->whereNull('parent_id')
            ->orderBy('sort_order');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByLocation($query, string $location)
    {
        return $query->where('location', $location);
    }

    public function getTree(): array
    {
        return $this->buildTree($this->items()->with('children')->get());
    }

    protected function buildTree($items, $parentId = null): array
    {
        $branch = [];
        foreach ($items as $item) {
            if ($item->parent_id === $parentId) {
                $children = $this->buildTree($items, $item->id);
                $node = $item->toArray();
                $node['children'] = $children;
                $branch[] = $node;
            }
        }
        return $branch;
    }
}
