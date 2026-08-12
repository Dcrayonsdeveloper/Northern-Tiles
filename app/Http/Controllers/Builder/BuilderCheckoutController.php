<?php

namespace App\Http\Controllers\Builder;

use App\Domain\Cart\Models\Cart;
use App\Http\Controllers\Storefront\CheckoutController as RetailCheckoutController;

/**
 * Trade checkout. Extends the retail controller and overrides four hooks:
 *   - channel() → 'trade', so getCart/getOrCreate/getCount always resolve
 *     the trade cart, and CheckoutService writes is_builder_order = true
 *     and accepts trade-only payment methods (e.g. 'invoice').
 *   - orderSuccessTokenKey() → 'builder_order_success_token', so retail and
 *     trade success pages don't overwrite each other's session tokens.
 *   - successRouteName() → the trade success page.
 *   - emptyCartRoute() → back to /builder/shop when the trade cart is empty.
 *   - successInertiaComponent() → the trade-styled success page.
 *
 * The same payment gateway (CheckoutService::processCheckout) runs — no
 * separate integration is introduced. Only the presentation layer forks.
 */
class BuilderCheckoutController extends RetailCheckoutController
{
    protected function channel(): string
    {
        return Cart::CHANNEL_TRADE;
    }

    protected function orderSuccessTokenKey(): string
    {
        return 'builder_order_success_token';
    }

    protected function successRouteName(): string
    {
        return 'builder.checkout.success';
    }

    protected function emptyCartRoute(): string
    {
        return 'builder.shop.index';
    }

    protected function cartRoute(): string
    {
        return 'builder.cart.index';
    }

    protected function successInertiaComponent(): string
    {
        return 'Builder/Checkout/Success';
    }

    protected function checkoutInertiaComponent(): string
    {
        return 'Builder/Checkout/Index';
    }
}
