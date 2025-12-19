<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductOptionValue extends Model
{
    protected $fillable = [
        'product_option_id',
        'value',
        'position',
        'meta_json',
    ];

    protected $casts = [
        'position' => 'integer',
        'meta_json' => 'array',
    ];

    public function option(): BelongsTo
    {
        return $this->belongsTo(ProductOption::class, 'product_option_id');
    }

    public function variants(): BelongsToMany
    {
        return $this->belongsToMany(ProductVariant::class, 'variant_option_value', 'product_option_value_id', 'variant_id');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }
}
