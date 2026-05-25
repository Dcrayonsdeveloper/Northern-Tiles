<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'seller_id',
        'name',
        'sku',
        'price',
        'quantity',
        'line_total',
        'tax',
        'options_json',
        'is_sample',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'decimal:2',
        'line_total' => 'decimal:2',
        'options_json' => 'array',
        'is_sample' => 'boolean',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(\App\Domain\Catalog\Models\ProductVariant::class);
    }
}
