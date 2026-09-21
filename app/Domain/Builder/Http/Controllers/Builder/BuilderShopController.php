<?php

namespace App\Domain\Builder\Http\Controllers\Builder;

use App\Domain\Builder\Models\BuilderProduct;
use App\Domain\Builder\Services\BuilderNavigationService;
use App\Domain\Builder\Services\BuilderPricingService;
use App\Domain\Catalog\Services\ProductUnitResolver;
use App\Domain\Catalog\Models\Attribute;
use App\Domain\Catalog\Support\ProductFamily;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The trade storefront. Deliberately a separate controller from the retail
 * ShopController: it is scoped to the builder catalogue, and every price it
 * emits is the builder price, so there is no branch in the retail path that
 * could leak trade pricing to the public site.
 */
class BuilderShopController extends Controller
{
    /** Attribute facets accepted as comma-separated query params (?color=white,grey). */
    private const ATTRIBUTE_FILTERS = ['color', 'space', 'size', 'material', 'finish', 'style'];

    public function __construct(
        private ProductUnitResolver $units,
        private BuilderPricingService $pricing,
    ) {}

    public function index(Request $request, ?string $category = null, ?string $subcategory = null): Response
    {
        $categorySlug = $subcategory ?? $category ?? $request->string('category')->toString();

        $filters = [
            'q' => $request->input('q', ''),
            'category' => $categorySlug,
            'sort' => $request->input('sort', ''),
        ];

        $attributeFilters = [];
        foreach (self::ATTRIBUTE_FILTERS as $slug) {
            $raw = trim((string) $request->input($slug, ''));
            if ($raw === '') {
                continue;
            }
            $values = array_values(array_filter(array_map('trim', explode(',', $raw))));
            if (! empty($values)) {
                $attributeFilters[$slug] = $values;
                $filters[$slug] = $raw;
            }
        }

        $attributeIds = $attributeFilters
            ? Attribute::whereIn('slug', array_keys($attributeFilters))->pluck('id', 'slug')
            : collect();

        $currentCategory = $categorySlug ? Category::where('slug', $categorySlug)->first() : null;
        $parentCategory = ($category && $subcategory && $currentCategory)
            ? Category::where('slug', $category)->first()
            : null;

        $products = Product::query()
            ->where('is_active', true)
            // The catalogue gate: this account's own list when it has one,
            // otherwise the shared builder list.
            ->builderVisibleTo($request->user())
            ->when($filters['q'], function ($query, $q) {
                $terms = array_values(array_filter(
                    preg_split('/\s+/', $q, -1, PREG_SPLIT_NO_EMPTY),
                    fn ($t) => mb_strlen($t) >= 2
                ));

                $query->where(function ($sub) use ($q, $terms) {
                    $sub->where('name', 'like', "%{$q}%")
                        ->orWhere('short_description', 'like', "%{$q}%")
                        ->orWhere('brand', 'like', "%{$q}%")
                        ->orWhere('sku', 'like', "%{$q}%")
                        ->orWhereHas('category', fn ($c) => $c->where('name', 'like', "%{$q}%"))
                        ->orWhereHas('categories', fn ($c) => $c->where('name', 'like', "%{$q}%"));

                    foreach ($terms as $term) {
                        $sub->orWhere('name', 'like', "%{$term}%")
                            ->orWhere('brand', 'like', "%{$term}%");
                    }
                });
            })
            ->when($categorySlug, function ($query) use ($categorySlug) {
                $query->where(function ($q) use ($categorySlug) {
                    $q->whereHas('category', fn ($inner) => $inner->where('slug', $categorySlug))
                        ->orWhereHas('categories', fn ($inner) => $inner->where('slug', $categorySlug));
                });
            })
            ->when(! empty($attributeFilters), function ($query) use ($attributeFilters, $attributeIds) {
                foreach ($attributeFilters as $attrSlug => $values) {
                    $attrId = $attributeIds[$attrSlug] ?? null;
                    if (! $attrId) {
                        continue;
                    }
                    $query->whereHas('attributeValues', function ($q) use ($attrId, $values) {
                        $q->where('attribute_id', $attrId)->whereIn('slug', $values);
                    });
                }
            })
            ->when($filters['sort'], function ($query, $sort) use ($request) {
                // Sorting by trade price must sort by the price this account
                // actually pays, not retail and not the shared price —
                // otherwise the order on screen contradicts the prices printed
                // next to it. For an account with its own catalogue that is its
                // own price, falling back to the shared one where its row
                // leaves the price blank.
                $tradePrice = $this->tradePriceSubquery($request->user());

                match ($sort) {
                    'newest' => $query->orderByDesc('products.created_at'),
                    'oldest' => $query->orderBy('products.created_at'),
                    'price_asc' => $query->orderBy($tradePrice),
                    'price_desc' => $query->orderByDesc($tradePrice),
                    'name_asc' => $query->orderBy('name'),
                    'name_desc' => $query->orderByDesc('name'),
                    default => $query->orderByDesc('products.id'),
                };
            }, function ($query) use ($filters) {
                // Default order for a search query: rank exact-name-prefix matches
                // first, then any name match containing the phrase, then the
                // per-token OR fallback. Without this, an exact match on an old
                // product (low id) drops below every newer product whose name
                // just happens to share a token, so a user searching by full
                // product name has to scroll past 10 unrelated hits.
                if ($filters['q']) {
                    $q = $filters['q'];
                    $query->orderByRaw(
                        'CASE WHEN products.name LIKE ? THEN 0 WHEN products.name LIKE ? THEN 1 ELSE 2 END',
                        [$q . '%', '%' . $q . '%']
                    )->orderBy('products.name');
                } else {
                    $query->orderByDesc('products.id');
                }
            })
            ->with([
                'category:id,name,slug',
                'builderListing',
                'media' => fn ($q) => $q->where('type', 'image')->orderByDesc('is_primary')->orderBy('sort'),
            ])
            ->paginate(12)
            ->withQueryString();

        $viewer = $request->user();

        $products->getCollection()->transform(function (Product $product) use ($viewer) {
            $primary = $product->media->first();
            // Only overwrite the DB image_url if the primary media file actually
            // exists on disk. Older imports left dead product_media rows that
            // point at storage/app/public/products/<id>/images/… files that
            // were never synced; without this check the transform threw away
            // a perfectly good external CDN url in image_url and replaced it
            // with a 403 local path, so the trade catalogue showed "No Image"
            // for every affected product even though the storefront rendered fine.
            if ($primary && \Illuminate\Support\Facades\Storage::disk('public')->exists($primary->path)) {
                $product->image_url = $primary->url;
            }
            $product->unsetRelation('media');

            return $this->decorateWithBuilderPrice($product, $viewer);
        });

        // Same list the header uses — the sidebar and the nav must not disagree
        // about which categories have trade stock.
        $categories = app(BuilderNavigationService::class)->categories($request->user());

        return Inertia::render('Builder/Shop/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $filters,
            'currentCategory' => $currentCategory,
            'parentCategory' => $parentCategory,
            'pageTitle' => $currentCategory?->name ?? 'Trade Catalogue',
        ]);
    }

    public function show(Request $request, Product $product): Response
    {
        abort_unless($product->is_active, 404);

        // Not on this account's trade list = does not exist as far as the
        // portal is concerned. Checked through the same scope the listing uses,
        // so a product hidden from the grid cannot be reached by typing its URL.
        $visible = Product::query()
            ->whereKey($product->id)
            ->builderVisibleTo($request->user())
            ->exists();

        abort_unless($visible, 404);

        $product->loadMissing(['category:id,name,slug', 'variants', 'options.values', 'media', 'variantFamily']);
        $this->decorateWithBuilderPrice($product, $request->user());

        $relatedIds = Product::query()
            ->where('is_active', true)
            ->where('id', '!=', $product->id)
            ->builderVisibleTo($request->user())
            ->when($product->category_id, fn ($q) => $q->where('category_id', $product->category_id))
            ->pluck('id')
            ->shuffle()
            ->take(8);

        $relatedProducts = collect();
        if ($relatedIds->isNotEmpty()) {
            $relatedProducts = Product::whereIn('id', $relatedIds)
                ->with(['builderListing', 'category:id,name,slug'])
                // category_id and sqm_per_box are needed by ProductUnitResolver;
                // without them every related card falls back to "not per m²".
                ->get(['id', 'category_id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description', 'sqm_per_box'])
                ->map(fn (Product $p) => $this->decorateWithBuilderPrice($p, $request->user()))
                ->shuffle()
                ->values();
        }

        return Inertia::render('Builder/Shop/Show', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
            'familyVariants' => $this->builderFamilySelector($product, $request->user()),
        ]);
    }

    /**
     * The product's range selector, rewritten for trade.
     *
     * Two differences from the retail selector: siblings that are not on the
     * builder list are dropped (their pages 404 in the portal, so linking to
     * them would be a dead end), and the survivors are re-priced to trade with
     * retail kept alongside for the strikethrough.
     *
     * @return array{family: array{id:int,name:string}, variants: array<int, array<string, mixed>>}|null
     */
    private function builderFamilySelector(Product $product, ?\App\Models\User $user = null): ?array
    {
        $selector = ProductFamily::selectorFor($product);

        if (! $selector) {
            return null;
        }

        // priceMap is account-aware: for an account with its own catalogue it
        // returns only the siblings on that list, at that account's prices.
        // Reading builder_products here offered siblings whose pages 404 for
        // them, tagged with prices they do not pay.
        $tradePrices = $this->pricing->priceMap(
            array_column($selector['variants'], 'id'),
            $user
        );

        $variants = [];
        foreach ($selector['variants'] as $variant) {
            if (! isset($tradePrices[$variant['id']])) {
                continue;
            }

            $retail = (float) $variant['price'];
            $trade = (float) $tradePrices[$variant['id']];

            $variant['retail_price'] = $retail;
            $variant['price'] = $trade;
            $variant['compare_at_price'] = $retail > $trade ? $retail : null;

            $variants[] = $variant;
        }

        // Same rule the retail page uses: a single remaining card is not a choice.
        return count($variants) > 1
            ? ['family' => $selector['family'], 'variants' => $variants]
            : null;
    }

    /**
     * Overwrite `price` with the trade price and keep the retail figure as
     * `retail_price`, so every existing price-rendering component shows trade
     * pricing without modification and the saving can still be displayed.
     */
    /**
     * Sub-select yielding the trade price for each product row, for ORDER BY.
     *
     * An account with its own catalogue sorts by its own price, falling back to
     * the shared price where its row leaves the price blank; everyone else
     * sorts by the shared price.
     */
    private function tradePriceSubquery(?\App\Models\User $user)
    {
        $hasOwn = $user && \App\Domain\Builder\Models\BuilderAccountProduct::live()
            ->forAccount($user)
            ->exists();

        if (! $hasOwn) {
            return BuilderProduct::select('price')
                ->whereColumn('builder_products.product_id', 'products.id')
                ->limit(1);
        }

        return \App\Domain\Builder\Models\BuilderAccountProduct::query()
            ->selectRaw(
                'COALESCE(builder_account_products.price, ('
                . 'SELECT bp.price FROM builder_products bp '
                . 'WHERE bp.product_id = products.id AND bp.is_active = 1 LIMIT 1))'
            )
            ->whereColumn('builder_account_products.product_id', 'products.id')
            ->where('builder_account_products.user_id', $user->id)
            ->where('builder_account_products.is_active', true)
            ->limit(1);
    }

    private function decorateWithBuilderPrice(Product $product, ?\App\Models\User $user = null): Product
    {
        $retail = (float) $product->price;

        // Through the pricing service, not the shared listing: an account with
        // its own catalogue may pay a different price for the same product, and
        // reading builder_products directly here would show them the shared one
        // while checkout charged theirs.
        $builderPrice = $this->pricing->builderPrice($product, $user) ?? $retail;

        $product->setAttribute('retail_price', $retail);
        $product->setAttribute('builder_price', $builderPrice);
        $product->setAttribute('price', $builderPrice);
        // compare_at_price drives the strikethrough in the shared product card;
        // pointing it at retail makes the trade saving render for free.
        $product->setAttribute('compare_at_price', $retail > $builderPrice ? $retail : null);
        $product->unsetRelation('builderListing');

        // Tiles and flooring are priced per m²; grouts, adhesives, silicones and
        // trims are not. Adds is_sold_per_sqm / unit_label to the payload so the
        // trade views can drop the "/ sqm" suffix where it does not apply.
        // Trade-side only — the retail storefront and admin never see this.
        return $this->units->decorate($product);
    }
}
