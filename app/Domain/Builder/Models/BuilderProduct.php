<?php

namespace App\Domain\Builder\Models;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One product offered to trade (builder) accounts at an admin-set price.
 *
 * The presence of a row is what puts a product in the builder catalogue —
 * there is no "all products at a discount" fallback by design, so nothing
 * leaks into trade pricing without an explicit decision.
 */
class BuilderProduct extends Model
{
    protected $fillable = [
        'product_id',
        'price',
        'is_active',
        'sort',
        'note',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'sort' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Live entries only: switched on here AND still active in the main catalogue.
     * Archiving a product in admin therefore pulls it from the builder portal too.
     */
    public function scopeLive(EloquentBuilder $query): EloquentBuilder
    {
        return $query->where('is_active', true)
            ->whereHas('product', fn ($q) => $q->where('is_active', true));
    }
}
