<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'sku',
        'barcode',
        'name',
        'attributes_json',
        'price',
        'compare_at_price',
        'cost',
        'currency',
        'inventory_quantity',
        'inventory_policy',
        'track_inventory',
        'requires_shipping',
        'weight',
        'weight_grams',
        'length_mm',
        'width_mm',
        'height_mm',
        'image_path',
        'is_active',
        'is_default',
        'sort_order',
    ];

    protected $casts = [
        'attributes_json' => 'array',
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'cost' => 'decimal:2',
        'inventory_quantity' => 'integer',
        'weight' => 'decimal:2',
        'weight_grams' => 'integer',
        'length_mm' => 'integer',
        'width_mm' => 'integer',
        'height_mm' => 'integer',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'track_inventory' => 'boolean',
        'requires_shipping' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Product::class);
    }

    public function optionValues(): BelongsToMany
    {
        return $this->belongsToMany(ProductOptionValue::class, 'variant_option_value', 'variant_id', 'product_option_value_id');
    }

    public function media(): BelongsToMany
    {
        return $this->belongsToMany(ProductMedia::class, 'variant_media', 'variant_id', 'product_media_id');
    }

    public function digitalFiles()
    {
        return $this->hasMany(ProductDigitalFile::class, 'variant_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeInStock($query)
    {
        return $query->where(function ($q) {
            $q->where('inventory_quantity', '>', 0)
                ->orWhere('inventory_policy', 'continue')
                ->orWhere('track_inventory', false);
        });
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function isInStock(): bool
    {
        if (!$this->track_inventory) {
            return true;
        }
        return $this->inventory_quantity > 0 || $this->inventory_policy === 'continue';
    }

    public function canPurchase(int $quantity = 1): bool
    {
        if (!$this->track_inventory) {
            return true;
        }
        if ($this->inventory_policy === 'continue') {
            return true;
        }
        return $this->inventory_quantity >= $quantity;
    }

    public function decrementInventory(int $quantity = 1): bool
    {
        if (!$this->track_inventory) {
            return true;
        }
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

    public function getVariantAttribute(string $key): mixed
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

    public function getOptionValuesString(): string
    {
        return $this->optionValues->pluck('value')->join(' / ');
    }

    public function getWeightInKg(): ?float
    {
        if ($this->weight_grams) {
            return $this->weight_grams / 1000;
        }
        return $this->weight;
    }

    public function getDimensionsString(): ?string
    {
        if (!$this->length_mm && !$this->width_mm && !$this->height_mm) {
            return null;
        }
        return sprintf('%d x %d x %d mm', $this->length_mm ?? 0, $this->width_mm ?? 0, $this->height_mm ?? 0);
    }
}
