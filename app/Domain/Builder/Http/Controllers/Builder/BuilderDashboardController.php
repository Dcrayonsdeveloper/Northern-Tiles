<?php

namespace App\Domain\Builder\Http\Controllers\Builder;

use App\Domain\Builder\Models\BuilderProduct;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Landing page of the trade portal — a short "what's here / what have I
 * ordered" view rather than a second shop page.
 */
class BuilderDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $featured = Product::query()
            ->where('is_active', true)
            ->whereHas('builderListing', fn ($q) => $q->where('is_active', true))
            ->with([
                'builderListing',
                'media' => fn ($q) => $q->where('type', 'image')->orderByDesc('is_primary')->orderBy('sort'),
            ])
            ->orderByDesc('is_featured')
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(function (Product $product) {
                $primary = $product->media->first();
                if ($primary) {
                    $product->image_url = $primary->url;
                }
                $product->unsetRelation('media');

                $listing = $product->getRelation('builderListing');
                $retail = (float) $product->price;
                $builderPrice = $listing ? (float) $listing->price : $retail;

                $product->setAttribute('retail_price', $retail);
                $product->setAttribute('price', $builderPrice);
                $product->setAttribute('compare_at_price', $retail > $builderPrice ? $retail : null);
                $product->unsetRelation('builderListing');

                return $product;
            });

        $recentOrders = Order::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get(['id', 'order_number', 'status', 'payment_status', 'total', 'currency', 'created_at']);

        return Inertia::render('Builder/Dashboard', [
            'featuredProducts' => $featured,
            'recentOrders' => $recentOrders,
            'stats' => [
                'catalogue_size' => BuilderProduct::live()->count(),
                'order_count' => Order::where('user_id', $user->id)->count(),
                'total_spent' => (float) Order::where('user_id', $user->id)
                    ->where('payment_status', 'paid')
                    ->sum('total'),
            ],
            'company' => $user->builder_company,
        ]);
    }
}
