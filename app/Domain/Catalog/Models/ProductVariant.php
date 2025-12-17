<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'sku',
        'name',
        'attributes_json',
        'price',
        'compare_at_price',
        'cost',
        'inventory_quantity',
        'inventory_policy',
        'weight',
        'image_path',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'attributes_json' => 'array',
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'cost' => 'decimal:2',
        'inventory_quantity' => 'integer',
        'weight' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock($query)
    {
        return $query->where(function ($q) {
            $q->where('inventory_quantity', '>', 0)
                ->orWhere('inventory_policy', 'continue');
        });
    }

    public function isInStock(): bool
    {
        return $this->inventory_quantity > 0 || $this->inventory_policy === 'continue';
    }

    public function canPurchase(int $quantity = 1): bool
    {
        if ($this->inventory_policy === 'continue') {
            return true;
        }
        return $this->inventory_quantity >= $quantity;
    }

    public function decrementInventory(int $quantity = 1): bool
    {
        if (!$this->canPurchase($quantity)) {
            return false;
        }
        $this->decrement('inventory_quantity', $quantity);
        return true;
    }

    public function incrementInventory(int $quantity = 1): void
    {
        $this->increment('inventory_quantity', $quantity);
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path
            ? Storage::disk('public')->url($this->image_path)
            : null;
    }

    public function getAttributeValue(string $key): mixed
    {
        return $this->attributes_json[$key] ?? null;
    }

    public function getSalePercentage(): ?int
    {
        if (!$this->compare_at_price || $this->compare_at_price <= $this->price) {
            return null;
        }
        return (int) round((($this->compare_at_price - $this->price) / $this->compare_at_price) * 100);
    }
}
