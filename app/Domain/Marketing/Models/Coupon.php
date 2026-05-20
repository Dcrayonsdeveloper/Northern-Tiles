<?php

namespace App\Domain\Marketing\Models;

use App\Domain\Cart\Models\Cart;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'title',
        'description',
        'type',
        'value',
        'buy_quantity',
        'get_quantity',
        'minimum_purchase',
        'maximum_discount',
        'usage_limit',
        'usage_limit_per_customer',
        'times_used',
        'starts_at',
        'expires_at',
        'is_active',
        'first_order_only',
        'eligible_products',
        'eligible_categories',
        'excluded_products',
        'eligible_customers',
        'combinable',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'minimum_purchase' => 'decimal:2',
        'maximum_discount' => 'decimal:2',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'first_order_only' => 'boolean',
        'combinable' => 'boolean',
        'eligible_products' => 'array',
        'eligible_categories' => 'array',
        'excluded_products' => 'array',
        'eligible_customers' => 'array',
    ];

    const TYPE_PERCENTAGE = 'percentage';
    const TYPE_FIXED_AMOUNT = 'fixed_amount';
    const TYPE_FREE_SHIPPING = 'free_shipping';
    const TYPE_BUY_X_GET_Y = 'buy_x_get_y';

    const TYPES = [
        self::TYPE_PERCENTAGE => 'Percentage Discount',
        self::TYPE_FIXED_AMOUNT => 'Fixed Amount',
        self::TYPE_FREE_SHIPPING => 'Free Shipping',
        self::TYPE_BUY_X_GET_Y => 'Buy X Get Y',
    ];

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
            });
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('code', strtoupper(trim($code)));
    }

    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->usage_limit && $this->times_used >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    public function canBeUsedBy(?int $userId, ?string $email): bool
    {
        if (!$this->isValid()) {
            return false;
        }

        // Check customer eligibility
        if ($this->eligible_customers && !empty($this->eligible_customers)) {
            if (!$userId || !in_array($userId, $this->eligible_customers)) {
                return false;
            }
        }

        // Check per-customer usage limit
        if ($this->usage_limit_per_customer) {
            $usageCount = $this->usages()
                ->where(function ($q) use ($userId, $email) {
                    if ($userId) {
                        $q->where('user_id', $userId);
                    }
                    if ($email) {
                        $q->orWhere('customer_email', $email);
                    }
                })
                ->count();

            if ($usageCount >= $this->usage_limit_per_customer) {
                return false;
            }
        }

        // Check first order only
        if ($this->first_order_only) {
            if ($userId) {
                if (\App\Models\Order::where('user_id', $userId)->exists()) {
                    return false;
                }
            } elseif ($email) {
                if (\App\Models\Order::where('customer_email', $email)->exists()) {
                    return false;
                }
            }
        }

        return true;
    }

    public function calculateDiscount(float $subtotal, array $cartItems = []): float
    {
        if (!$this->isValid()) {
            return 0;
        }

        // Check minimum purchase
        if ($this->minimum_purchase && $subtotal < $this->minimum_purchase) {
            return 0;
        }

        $discount = 0;

        switch ($this->type) {
            case self::TYPE_PERCENTAGE:
                $discount = $subtotal * ($this->value / 100);
                // Apply maximum discount cap
                if ($this->maximum_discount && $discount > $this->maximum_discount) {
                    $discount = $this->maximum_discount;
                }
                break;

            case self::TYPE_FIXED_AMOUNT:
                $discount = min($this->value, $subtotal);
                break;

            case self::TYPE_FREE_SHIPPING:
                // Shipping discount handled separately
                $discount = 0;
                break;
        }

        return round($discount, 2);
    }

    public function givesFreeShipping(): bool
    {
        return $this->type === self::TYPE_FREE_SHIPPING;
    }

    public function incrementUsage(): void
    {
        $this->increment('times_used');
    }

    public function recordUsage(?int $userId, ?int $orderId, ?string $email, float $discountAmount): CouponUsage
    {
        $this->incrementUsage();

        return $this->usages()->create([
            'user_id' => $userId,
            'order_id' => $orderId,
            'customer_email' => $email,
            'discount_amount' => $discountAmount,
        ]);
    }

    public static function findByCode(string $code): ?self
    {
        return static::byCode($code)->first();
    }
}
