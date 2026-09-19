<?php

namespace App\Domain\Builder\Models;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One product offered to ONE trade account, optionally at its own price.
 *
 * A null price means "this account may buy it at the shared catalogue price",
 * so giving an account a bespoke product list does not force re-entering
 * prices that have not changed.
 *
 * The presence of any row for an account switches that account off the shared
 * catalogue entirely — see the migration for why that is all-or-nothing.
 */
class BuilderAccountProduct extends Model
{
    protected $fillable = [
        'user_id',
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

    public function account(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /** Rows a builder can actually buy from: active, and on a live product. */
    public function scopeLive(EloquentBuilder $query): EloquentBuilder
    {
        return $query->where('is_active', true);
    }

    public function scopeForAccount(EloquentBuilder $query, User|int $user): EloquentBuilder
    {
        return $query->where('user_id', $user instanceof User ? $user->id : (int) $user);
    }
}
