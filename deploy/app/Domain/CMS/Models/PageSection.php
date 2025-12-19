<?php

namespace App\Domain\CMS\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageSection extends Model
{
    protected $fillable = [
        'page_id',
        'section_key',
        'data_json',
        'sort',
        'is_active',
    ];

    protected $casts = [
        'data_json' => 'array',
        'is_active' => 'boolean',
        'sort' => 'integer',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function registry(): BelongsTo
    {
        return $this->belongsTo(SectionRegistry::class, 'section_key', 'section_key');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort');
    }

    public function getData(string $key = null, $default = null)
    {
        if ($key === null) {
            return $this->data_json ?? [];
        }

        return data_get($this->data_json, $key, $default);
    }

    public function setData(array $data): void
    {
        $this->data_json = $data;
    }

    public function mergeData(array $data): void
    {
        $this->data_json = array_merge($this->data_json ?? [], $data);
    }

    public function moveUp(): void
    {
        $previous = static::where('page_id', $this->page_id)
            ->where('sort', '<', $this->sort)
            ->orderByDesc('sort')
            ->first();

        if ($previous) {
            $this->swapSortWith($previous);
        }
    }

    public function moveDown(): void
    {
        $next = static::where('page_id', $this->page_id)
            ->where('sort', '>', $this->sort)
            ->orderBy('sort')
            ->first();

        if ($next) {
            $this->swapSortWith($next);
        }
    }

    protected function swapSortWith(PageSection $other): void
    {
        $tempSort = $this->sort;
        $this->update(['sort' => $other->sort]);
        $other->update(['sort' => $tempSort]);
    }
}
