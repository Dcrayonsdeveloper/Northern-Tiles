<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Attribute extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'type',
        'values_json',
        'is_filterable',
        'is_visible',
        'sort_order',
    ];

    protected $casts = [
        'values_json' => 'array',
        'is_filterable' => 'boolean',
        'is_visible' => 'boolean',
        'sort_order' => 'integer',
    ];

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
        return $this->values_json ?? [];
    }

    public function addValue(string $value): void
    {
        $values = $this->getValues();
        if (!in_array($value, $values)) {
            $values[] = $value;
            $this->update(['values_json' => $values]);
        }
    }
}
