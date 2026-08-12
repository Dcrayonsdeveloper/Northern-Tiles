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

        $retail = (float) ($this->variant
            ? $this->variant->price
            : ($this->product->price ?? $this->price));

        if (! $this->product) {
            return $retail;
        }

        // Re-resolve through builder pricing, scoped to the CART'S CHANNEL:
        // a builder's retail cart must stay at retail on syncPrice(), and a
        // trade cart must stay at trade. Without the channel arg syncPrice
        // would silently flip a retail line to trade whenever the cart owner
        // qualifies for builder pricing.
        return app(\App\Domain\Builder\Services\BuilderPricingService::class)
            ->effectivePrice(
                $this->product,
                $retail,
                $this->cart?->user,
                $this->cart?->channel ?? Cart::CHANNEL_RETAIL
            );
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
