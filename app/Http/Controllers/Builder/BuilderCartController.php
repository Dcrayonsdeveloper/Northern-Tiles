<?php

namespace App\Http\Controllers\Builder;

use App\Domain\Cart\Models\Cart;
use App\Http\Controllers\Storefront\CartController as RetailCartController;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Trade cart. Extends the retail controller and overrides the channel so the
 * same CartService plumbing scopes every query to the builder cart. Renders
 * a separate Inertia page (Builder/Cart/Index) so the layout, cross-sell,
 * and Checkout button all point at trade equivalents.
 *
 * Samples are stripped in store() — a builder is buying at trade pricing, not
 * requesting free swatches.
 */
class BuilderCartController extends RetailCartController
{
    protected function channel(): string
    {
        return Cart::CHANNEL_TRADE;
    }

    public function index(Request $request): Response
    {
        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $cart = $this->cartService->getCart($userId, $sessionId, $this->channel());

        $items = collect();
        $subtotal = 0;

        if ($cart) {
            $cart->load(['items.product', 'items.variant']);

            $items = $cart->items->map(function ($item) {
                return [
                    'id'         => $item->id,
                    'product'    => $item->product,
                    'variant'    => $item->variant,
                    'quantity'   => (float) $item->quantity,
                    'price'      => (float) $item->price,
                    'line_total' => (float) ($item->price * $item->quantity),
                    'is_sample'  => (bool)  $item->is_sample,
                ];
            })->values();

            $totals = $this->pricingService->computeTotals($cart);
            $subtotal = $totals['subtotal'];
        }

        // Cross-sell scoped to the trade catalogue only — never dump retail
        // suggestions into a trade cart page.
        $cartProductIds = $items->pluck('product.id')->filter()->toArray();
        $crossSellIds = Product::where('is_active', true)
            ->where('status', 'published')
            ->whereHas('builderListing', fn ($q) => $q->where('is_active', true))
            ->whereNotIn('id', $cartProductIds)
            ->pluck('id')
            ->shuffle()
            ->take(8);
        $crossSellProducts = $crossSellIds->isNotEmpty()
            ? Product::whereIn('id', $crossSellIds)
                ->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url'])
                ->shuffle()
            : collect();

        return Inertia::render('Builder/Cart/Index', [
            'items' => $items,
            'subtotal' => $subtotal,
            'crossSellProducts' => $crossSellProducts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // Samples are a retail-only concept; scrub the flag before validation
        // so the retail rules pass, and CartService::addItem enforces the
        // same rule server-side as a belt-and-braces guard.
        $input = $request->all();
        unset($input['is_sample']);
        $request->replace($input);

        return parent::store($request);
    }
}
