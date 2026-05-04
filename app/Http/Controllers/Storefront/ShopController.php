<?php

namespace App\Http\Controllers\Storefront;

use App\Domain\Catalog\Models\Attribute;
use App\Domain\Marketing\Models\Coupon;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    /**
     * Slugs of attribute-based facets supported as query params.
     * Each one accepts a comma-separated list (e.g. ?color=white,grey).
     */
    private const ATTRIBUTE_FILTERS = ['color', 'space', 'size', 'material', 'finish', 'style'];

    public function index(Request $request, ?string $category = null, ?string $subcategory = null): Response
    {
        // Determine category from URL path or query parameter
        $categorySlug = $subcategory ?? $category ?? $request->string('category')->toString();

        $filters = [
            'q' => $request->input('q', ''),
            'category' => $categorySlug,
            'sort' => $request->input('sort', ''),
            'on_sale' => $request->boolean('on_sale'),
        ];

        // Collect attribute facet filters: ['color' => ['white', 'grey'], ...]
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

        // Resolve attribute IDs once per request (small fixed set, fine to keep static).
        $attributeIds = $attributeFilters
            ? Attribute::whereIn('slug', array_keys($attributeFilters))->pluck('id', 'slug')
            : collect();

        // Find current category for breadcrumbs and title
        $currentCategory = null;
        $parentCategory = null;

        if ($categorySlug) {
            $currentCategory = Category::where('slug', $categorySlug)->first();
        }

        if ($category && $subcategory && $currentCategory) {
            $parentCategory = Category::where('slug', $category)->first();
        }

        $products = Product::query()
            ->where('is_active', true)
            ->when($filters['q'], function ($query, $q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('name', 'like', "%{$q}%")
                        ->orWhere('short_description', 'like', "%{$q}%");
                });
            })
            ->when($categorySlug, function ($query) use ($categorySlug) {
                $query->whereHas('category', fn ($q) => $q->where('slug', $categorySlug));
            })
            ->when($filters['on_sale'], function ($query) {
                $query->whereColumn('compare_at_price', '>', 'price');
            })
            ->when(! empty($attributeFilters), function ($query) use ($attributeFilters, $attributeIds) {
                // Multi-value within one attribute = OR (whereIn on slug).
                // Across different attributes = AND (each whereHas chained).
                foreach ($attributeFilters as $attrSlug => $values) {
                    $attrId = $attributeIds[$attrSlug] ?? null;
                    if (! $attrId) {
                        continue;
                    }
                    $query->whereHas('attributeValues', function ($q) use ($attrId, $values) {
                        $q->where('attribute_id', $attrId)
                            ->whereIn('slug', $values);
                    });
                }
            })
            ->when($filters['sort'], function ($query, $sort) {
                match ($sort) {
                    'newest' => $query->orderByDesc('created_at'),
                    'oldest' => $query->orderBy('created_at'),
                    'price_asc' => $query->orderBy('price'),
                    'price_desc' => $query->orderByDesc('price'),
                    'name_asc' => $query->orderBy('name'),
                    'name_desc' => $query->orderByDesc('name'),
                    default => $query->orderByDesc('id'),
                };
            }, function ($query) {
                $query->orderByDesc('id');
            })
            ->with(['category:id,name,slug'])
            ->paginate(12)
            ->withQueryString();

        $categories = Category::query()
            ->whereNull('parent_id')
            ->with('children:id,parent_id,name,slug')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Storefront/Shop/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $filters,
            'currentCategory' => $currentCategory,
            'parentCategory' => $parentCategory,
            'pageTitle' => $currentCategory?->name ?? 'Shop',
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        $product->loadMissing(['category:id,name,slug', 'variants', 'options.values', 'media']);

        // Get related products from same category
        $relatedProducts = Product::query()
            ->where('is_active', true)
            ->where('id', '!=', $product->id)
            ->when($product->category_id, function ($query) use ($product) {
                $query->where('category_id', $product->category_id);
            })
            ->inRandomOrder()
            ->limit(8)
            ->get(['id', 'name', 'slug', 'price', 'compare_at_price', 'image_url', 'short_description']);

        // Get available active coupons to display (gracefully handle missing table)
        $availableCoupons = collect();
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('coupons')) {
                $availableCoupons = Coupon::query()
                    ->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
                    })
                    ->where(function ($q) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
                    })
                    ->where(function ($q) {
                        $q->whereNull('usage_limit')->orWhereColumn('times_used', '<', 'usage_limit');
                    })
                    ->orderByDesc('value')
                    ->limit(3)
                    ->get(['code', 'type', 'value', 'title', 'description', 'minimum_purchase', 'maximum_discount']);
            }
        } catch (\Exception $e) {
            // Coupons table may not exist yet
            $availableCoupons = collect();
        }

        return Inertia::render('Storefront/Shop/Show', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
            'availableCoupons' => $availableCoupons,
        ]);
    }
}
