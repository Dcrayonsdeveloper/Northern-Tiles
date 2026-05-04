<?php

namespace App\Domain\Cart\Models;

use App\Domain\Catalog\Models\ProductVariant;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $fillable = [
        'cart_id',
        'product_id',
        'variant_id',
        'quantity',
        'price',
        'options_json',
        'is_sample',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'price' => 'decimal:2',
        'options_json' => 'array',
        'is_sample' => 'boolean',
    ];

    public function scopeSamples($query)
    {
        return $query->where('is_sample', true);
    }

    public function scopeNonSamples($query)
    {
        return $query->where('is_sample', false);
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function getLineTotal(): float
    {
        return $this->price * $this->quantity;
    }

    public function updateQuantity(float $quantity): bool
    {
        if ($quantity <= 0.001) {
            $this->delete();
            return true;
        }

        if ($this->variant) {
            if (!$this->variant->canPurchase($quantity)) {
                return false;
            }
        }

        $this->update(['quantity' => $quantity]);
        return true;
    }

    public function incrementQuantity(float $amount = 1): bool
    {
        return $this->updateQuantity((float) $this->quantity + $amount);
    }

    public function decrementQuantity(float $amount = 1): bool
    {
        return $this->updateQuantity((float) $this->quantity - $amount);
    }

    public function getCurrentPrice(): float
    {
        if ($this->is_sample) {
            return 0;
        }
        if ($this->variant) {
            return $this->variant->price;
        }
        return $this->product->price ?? $this->price;
    }

    public function syncPrice(): void
    {
        // Samples are always free — never sync from product
        if ($this->is_sample) {
            return;
        }
        $this->update(['price' => $this->getCurrentPrice()]);
    }
}
