<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttributeSet extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    public function attributes(): BelongsToMany
    {
        return $this->belongsToMany(Attribute::class, 'attribute_attribute_set')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }

    public function products(): HasMany
    {
        return $this->hasMany(\App\Models\Product::class);
    }

    public function addAttribute(Attribute $attribute, int $sortOrder = 0): void
    {
        $this->attributes()->syncWithoutDetaching([
            $attribute->id => ['sort_order' => $sortOrder]
        ]);
    }

    public function removeAttribute(Attribute $attribute): void
    {
        $this->attributes()->detach($attribute->id);
    }
}
