<?php

namespace App\Models;

use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
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
    ];

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

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
