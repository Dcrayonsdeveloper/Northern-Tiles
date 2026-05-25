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
    ];

    protected $casts = [
        'subtotal'         => 'decimal:2',
        'tax'              => 'decimal:2',
        'shipping_cost'    => 'decimal:2',
        'discount'         => 'decimal:2',
        'total'            => 'decimal:2',
        'shipping_address' => 'array',
        'billing_address'  => 'array',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
