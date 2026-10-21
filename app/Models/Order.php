<?php

namespace App\Models;

use App\Domain\Cart\Services\PricingService;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'cart_id',
        'is_builder_order',
        'order_number',
        'status',
        'customer_name',
        'customer_email',
        'customer_phone',
        'currency',
        'subtotal',
        'tax',
        'shipping_cost',
        'discount',
        'total',
        'shipping_address',
        'billing_address',
        'shipping_method',
        'delivery_quote',
        'delivery_quote_paid_at',
        'payment_method',
        'payment_status',
        'notes',
        'admin_note',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'subtotal'         => 'decimal:2',
        'tax'              => 'decimal:2',
        'shipping_cost'    => 'decimal:2',
        'discount'         => 'decimal:2',
        'total'            => 'decimal:2',
        'shipping_address' => 'array',
        'billing_address'  => 'array',
        'is_builder_order' => 'boolean',
        'shipped_at'       => 'datetime',
        'delivered_at'     => 'datetime',
        'delivery_quote'   => 'decimal:2',
        'delivery_quote_paid_at' => 'datetime',
    ];

    /**
     * Delivery for this order is quoted by the team rather than charged at
     * checkout. The quote is collected separately and is never part of
     * `total`, which is what the card was charged.
     */
    public function isDeliveryQuoted(): bool
    {
        return $this->shipping_method === PricingService::DELIVERY_QUOTE;
    }

    /** Where a quoted delivery stands: awaiting a quote, quoted, or paid. Null when nothing is quoted. */
    public function deliveryQuoteStatus(): ?string
    {
        if (! $this->isDeliveryQuoted()) {
            return null;
        }

        if ($this->delivery_quote_paid_at) {
            return 'paid';
        }

        return $this->delivery_quote === null ? 'awaiting' : 'quoted';
    }

    /** How delivery was priced, in words, for the order screens and the receipt. */
    public function deliveryLabel(): ?string
    {
        return match ($this->shipping_method) {
            null, '' => null,
            PricingService::DELIVERY_QUOTE => 'Quoted separately',
            PricingService::DELIVERY_SAMPLE_FLAT => 'Samples, flat rate',
            PricingService::DELIVERY_FREE => 'Free shipping (coupon)',
            // Orders placed before delivery was quoted recorded the zone they
            // were charged at, e.g. "sydney-metro".
            default => ucfirst(str_replace('-', ' ', $this->shipping_method)),
        };
    }

    /**
     * Hide checkouts that were started by card and never paid for.
     *
     * A card order is created `pending` before the customer is sent to
     * Stripe, so every abandoned attempt -- a closed tab, a declined card,
     * someone who changed their mind on the payment screen -- leaves a row
     * behind. Those are not orders anyone needs to action, and they buried
     * the real ones in the admin list.
     *
     * Narrow on purpose. It keys on the payment METHOD as well as the
     * status, so an order awaiting payment by invoice -- which is how trade
     * customers normally buy, and which sits `pending` indefinitely and
     * legitimately -- is still shown. Excluding every unpaid order would have
     * emptied the Builder Orders screen completely.
     *
     * Nothing is deleted; `withAbandonedCheckouts()` on the admin list brings
     * them back, so a payment that lands late is still reachable.
     */
    public function scopeExcludingAbandonedCheckouts($query)
    {
        return $query->whereNot(function ($q) {
            $q->where('payment_method', 'card')
                ->where('payment_status', 'pending');
        });
    }

    /** Count of what the above is hiding, so it is never silently lost. */
    public static function abandonedCheckoutCount(?callable $scope = null): int
    {
        $query = static::query()
            ->where('payment_method', 'card')
            ->where('payment_status', 'pending');

        if ($scope) {
            $scope($query);
        }

        return (int) $query->count();
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /** The cart this order was placed from, kept until payment succeeds. */
    public function cart()
    {
        return $this->belongsTo(\App\Domain\Cart\Models\Cart::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
