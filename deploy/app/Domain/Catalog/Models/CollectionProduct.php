<?php

namespace App\Domain\Catalog\Models;

use App\Models\Product;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class CollectionProduct extends Pivot
{
    protected $table = 'collection_products';

    public const SOURCE_MANUAL = 'manual';
    public const SOURCE_AUTO = 'auto';

    protected $fillable = [
        'collection_id',
        'product_id',
        'source',
        'sort_order',
        'computed_at',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'computed_at' => 'datetime',
    ];

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function isManual(): bool
    {
        return $this->source === self::SOURCE_MANUAL;
    }

    public function isAuto(): bool
    {
        return $this->source === self::SOURCE_AUTO;
    }
}
