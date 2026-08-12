<?php

namespace App\Domain\Builder\Http\Controllers\Builder;

use App\Domain\Builder\Services\TradeUnitResolver;
use App\Domain\Catalog\Models\Attribute;
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

    public function __construct(private TradeUnitResolver $units) {}

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
            // The catalogue gate: only products the admin put on the builder list.
            ->whereHas('builderListing', fn ($q) => $q->where('is_active', true))
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
            ->when($filters['sort'], function ($query, $sort) {
                match ($sort) {
                    'newest' => $query->orderByDesc('products.created_at'),
                    'oldest' => $query->orderBy('products.created_at'),
                    // Sorting by trade price must sort by the builder price, not
                    // retail — otherwise the order on screen contradicts the
                    // prices shown next to it.
                    'price_asc' => $query->orderBy(
                        \App\Domain\Builder\Models\BuilderProduct::select('price')
                            ->whereColumn('builder_products.product_id', 'products.id')
                            ->limit(1)
                    ),
                    'price_desc' => $query->orderByDesc(
                        \App\Domain\Builder\Models\BuilderProduct::select('price')
                            ->whereColumn('builder_products.product_id', 'products.id')
                            ->limit(1)
                    ),
                    'name_asc' => $query->orderBy('name'),
                    'name_desc' => $query->orderByDesc('name'),
                    default => $query->orderByDesc('products.id'),
                };
            }, fn ($query) => $query->orderByDesc('products.id'))
            ->with([
                'category:id,name,slug',
                'builderListing',
                'media' => fn ($q) => $q->where('type', 'image')->orderByDesc('is_primary')->orderBy('sort'),
            ])
            ->paginate(12)
            ->withQueryString();

        $products->getCollection()->transform(function (Product $product) {
            $primary = $product->media->first();
            if ($primary) {
                $product->image_url = $primary->url;
            }
            $product->unsetRelation('media');

            return $this->decorateWithBuilderPrice($product);
        });

        // Only categories that actually contain builder products — an empty
        // category in the trade sidebar is just a dead end.
        $categories = Category::query()
            ->whereNull('parent_id')
            ->whereHas('products', fn ($q) => $q->where('is_active', true)
                ->whereHas('builderListing', fn ($b) => $b->where('is_active', true)))
            ->with(['children' => fn ($q) => $q->whereHas('products', fn ($p) => $p->where('is_active', true)
                ->whereHas('builderListing', fn ($b) => $b->where('is_active', true)))
                ->select('id', 'parent_id', 'name', 'slug')])
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Builder/Shop/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $filters,
            'currentCategory' => $currentCategory,
            'parentCategory' => $parentCategory,
            'pageTitle' => $currentCategory?->name ?? 'Trade Catalogue',
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        // Not on the trade list = does not exist as far as the portal is concerned.
        $listing = $product->builderListing()->where('is_active', true)->first();
        abort_unless($listing !== null, 404);

        $product->loadMissing(['category:id,name,slug', 'variants', 'options.values', 'media']);
        $this->decorateWithBuilderPrice($product);

        $relatedIds = Product::query()
            ->where('is_active', true)
            ->where('id', '!=', $product->id)
            ->whereHas('builderListing', fn ($q) => $q->where('is_active', true))
            ->when($product->category_id, fn ($q) => $q->where('category_id', $product->category_id))
            ->pluck('id')
            ->shuffle()
            ->take(8);

        $relatedProducts = collect();
        if ($relatedIds->isNotEmpty()) {
            $relatedProducts = Product::whereIn('id', $relatedIds)
                ->with(['builderListing', 'category:id,name,slug'])
                // category_id and sqm_per_box are needed by TradeUnitResolver;
                // without them every related card falls back to "not per m²".
                ->get(['id', 'category_id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description', 'sqm_per_box'])
                ->map(fn (Product $p) => $this->decorateWithBuilderPrice($p))
                ->shuffle()
                ->values();
        }

        return Inertia::render('Builder/Shop/Show', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    /**
     * Overwrite `price` with the trade price and keep the retail figure as
     * `retail_price`, so every existing price-rendering component shows trade
     * pricing without modification and the saving can still be displayed.
     */
    private function decorateWithBuilderPrice(Product $product): Product
    {
        $listing = $product->relationLoaded('builderListing')
            ? $product->getRelation('builderListing')
            : $product->builderListing()->first();

        $retail = (float) $product->price;
        $builderPrice = $listing ? (float) $listing->price : $retail;

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
