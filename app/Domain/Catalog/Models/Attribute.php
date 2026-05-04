<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Attribute extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'type',
        'is_filterable',
        'is_visible',
        'sort_order',
    ];

    protected $casts = [
        'is_filterable' => 'boolean',
        'is_visible' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class)->orderBy('sort_order')->orderBy('value');
    }

    public function attributeSets(): BelongsToMany
    {
        return $this->belongsToMany(AttributeSet::class, 'attribute_attribute_set')
            ->withPivot('sort_order')
            ->withTimestamps();
    }

    public function scopeFilterable($query)
    {
        return $query->where('is_filterable', true);
    }

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function getValues(): array
    {
        return $this->values()->pluck('value')->all();
    }

    public function addValue(string $value, ?string $slug = null, array $meta = []): AttributeValue
    {
        return $this->values()->firstOrCreate(
            ['slug' => $slug ?? Str::slug($value)],
            ['value' => $value, 'meta_json' => $meta ?: null],
        );
    }
}
