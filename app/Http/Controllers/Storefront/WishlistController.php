<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Catalog\Models\Favorite;
use App\Domain\Catalog\Services\FavoriteService;
use App\Domain\Catalog\Services\ProductUnitResolver;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The customer's saved products.
 *
 * Session-authenticated sibling of Api\FavoriteController, which is token
 * (sanctum) authenticated and answers JSON. The storefront is Inertia over
 * session cookies, so it needs these web routes; both read and write the same
 * favorites table through FavoriteService.
 *
 * Every route here sits behind `auth`, which is what makes signing in a
 * prerequisite for saving anything: a guest posting to toggle is bounced to
 * the login page, and because the request is a POST, Laravel stores the
 * referring product page as the intended url and returns them to it.
 */
class WishlistController extends Controller
{
    public function __construct(private FavoriteService $favorites) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        $products = Product::query()
            ->whereIn('id', $this->favorites->getFavoriteProductIds($user->id))
            ->where('is_active', true)
            ->with([
                'category:id,name,slug',
                'media' => fn ($q) => $q->where('type', 'image')->orderByDesc('is_primary')->orderBy('sort'),
            ])
            ->get([
                'id', 'category_id', 'name', 'slug', 'sku', 'price', 'compare_at_price',
                'image_url', 'short_description', 'sqm_per_box',
                'inventory_quantity', 'inventory_policy',
            ]);

        // Saved-at drives the ordering: newest first, the way every other
        // "your saved things" list reads.
        $savedAt = Favorite::where('user_id', $user->id)
            ->pluck('created_at', 'product_id');

        $units = app(ProductUnitResolver::class);

        $products = $products
            ->map(function (Product $product) use ($units, $savedAt) {
                // Skip media rows whose file was never synced, or the card
                // renders a broken image instead of falling back to image_url.
                $primary = $product->media->first(fn ($m) => $m->fileExists());
                if ($primary) {
                    $product->image_url = $primary->url;
                }
                $product->unsetRelation('media');

                $product->setAttribute('saved_at', $savedAt[$product->id] ?? null);
                $product->setAttribute(
                    'in_stock',
                    (float) $product->price > 0
                        && (($product->inventory_quantity ?? 0) > 0 || $product->inventory_policy === 'continue'),
                );

                return $units->decorate($product);
            })
            ->sortByDesc('saved_at')
            ->values();

        return Inertia::render('Storefront/Wishlist/Index', [
            'products' => $products,
        ]);
    }

    /**
     * Add or remove one product. Returns to the page it was called from, so
     * the heart on a product page and the remove button on this page can share
     * a single endpoint.
     */
    public function toggle(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $result = $this->favorites->toggle($request->user()->id, (int) $validated['product_id']);

        return back()->with(
            'success',
            $result['is_favorite'] ? 'Saved to your wishlist.' : 'Removed from your wishlist.',
        );
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        Favorite::where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->delete();

        $this->favorites->flushCountCache($request->user()->id);

        return back()->with('success', 'Removed from your wishlist.');
    }
}
