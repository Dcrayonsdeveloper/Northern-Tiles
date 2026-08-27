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
    /** Optional hero photo; the dashboard draws its own artwork when absent. */
    private const HERO_BANNER = 'images/builder/hero-banner.png';

    /**
     * A 6px slice of the banner's left edge. Stretched across the hero it
     * reproduces the artwork's own vertical gradient, so the card and the
     * image are the same colour at every height. A single flat navy could
     * only ever match at one height, which is what showed as a vertical band
     * down the middle of the hero.
     */
    private const HERO_BANNER_EDGE = 'images/builder/hero-banner-edge.png';

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
            // A real banner dropped at public/images/builder/hero-banner.png
            // replaces the drawn artwork with no code change. Checked here
            // rather than in the view so a missing file renders the fallback
            // instead of a broken <img>.
            'heroBanner' => file_exists(public_path(self::HERO_BANNER))
                ? asset(self::HERO_BANNER)
                : null,
            'heroBannerEdge' => file_exists(public_path(self::HERO_BANNER_EDGE))
                ? asset(self::HERO_BANNER_EDGE)
                : null,
        ]);
    }
}
