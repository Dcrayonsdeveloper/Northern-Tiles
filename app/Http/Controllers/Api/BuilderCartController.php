<?php

namespace App\Http\Controllers\Api;

use App\Domain\Cart\Http\Requests\AddToCartRequest;
use App\Domain\Cart\Models\Cart;
use Illuminate\Http\JsonResponse;

/**
 * JSON API for the trade cart drawer / sticky Add-to-Cart / trade Buy Now.
 * Same shape as the retail Api\CartController; only the channel and the
 * Buy Now redirect are different, and the store()/add() paths strip is_sample
 * so a builder can't sneak a free swatch into a trade order.
 */
class BuilderCartController extends CartController
{
    // parent already uses HasCartChannel; overriding the method is enough.
    protected function channel(): string
    {
        return Cart::CHANNEL_TRADE;
    }

    protected function checkoutRedirect(): string
    {
        return '/builder/checkout';
    }

    public function add(AddToCartRequest $request): JsonResponse
    {
        $this->stripSample($request);

        return parent::add($request);
    }

    public function buyNow(AddToCartRequest $request): JsonResponse
    {
        $this->stripSample($request);

        return parent::buyNow($request);
    }

    private function stripSample(AddToCartRequest $request): void
    {
        $input = $request->all();
        unset($input['is_sample']);
        $request->replace($input);
    }
}
