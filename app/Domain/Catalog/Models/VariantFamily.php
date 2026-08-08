<?php

namespace App\Domain\Catalog\Models;

use App\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A Variant Family groups whole, standalone Product records that are the same
 * range in different colours / sizes / finishes (e.g. every ARGILE tile).
 *
 * It is NOT the per-product ProductVariant (size/colour options inside one
 * product). The two are mutually exclusive on the product page.
 */
class VariantFamily extends Model
{
    protected $fillable = [
        'name',
        'is_active',
        'position',
        'default_product_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Members, always ordered by their in-family position.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class)->orderBy('variant_family_position');
    }

    public function defaultProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'default_product_id');
    }
}
