<?php

namespace App\Http\Controllers\Concerns;

use App\Domain\Cart\Models\Cart;

/**
 * Every cart / checkout controller declares which cart it operates on by
 * overriding channel(). The retail storefront controllers use the default
 * ('retail'); the builder-side controllers override to 'trade'. Passing the
 * channel through every CartService::getCart / getOrCreate / getCount call
 * is what keeps a builder's retail cart isolated from their trade cart.
 */
trait HasCartChannel
{
    protected function channel(): string
    {
        return Cart::CHANNEL_RETAIL;
    }
}
