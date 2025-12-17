<?php

namespace App\Http\Controllers\Public;

use App\Domain\Catalog\Services\CatalogService;
use App\Domain\Catalog\Services\FavoriteService;
use App\Domain\Personalization\Services\PersonalizationService;
use App\Domain\SEO\Services\SeoService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function __construct(
        protected CatalogService $catalogService,
        protected SeoService $seoService,
        protected PersonalizationService $personalizationService,
        protected FavoriteService $favoriteService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only([
            'category_slug',
            'brand',
            'min_price',
            'max_price',
            'in_stock',
            'search',
            'tags',
            'sort_by',
            'sort_dir',
        ]);

        $products = $this->catalogService->getProducts($filters, null, 15);
        $categories = $this->catalogService->getCategoryTree();
        $brands = $this->catalogService->getBrands();

        $favoriteIds = [];
        if ($request->user()) {
            $favoriteIds = $this->favoriteService->getFavoriteProductIds($request->user()->id);
        }

        return Inertia::render('CMS/Shop', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'filters' => $filters,
            'favoriteIds' => $favoriteIds,
        ]);
    }

    public function category(Request $request, string $slug): Response
    {
        $filters = $request->only([
            'brand',
            'min_price',
            'max_price',
            'in_stock',
            'sort_by',
            'sort_dir',
        ]);
        $filters['category_slug'] = $slug;

        $products = $this->catalogService->getProducts($filters, null, 15);
        $categories = $this->catalogService->getCategoryTree();
        $brands = $this->catalogService->getBrands();

        $favoriteIds = [];
        if ($request->user()) {
            $favoriteIds = $this->favoriteService->getFavoriteProductIds($request->user()->id);
        }

        return Inertia::render('CMS/CategoryProducts', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'filters' => $filters,
            'categorySlug' => $slug,
            'favoriteIds' => $favoriteIds,
        ]);
    }

    public function product(Request $request, string $slug): Response
    {
        $product = $this->catalogService->getProduct($slug);

        if (!$product || (!$product->is_active && !$request->user()?->is_admin)) {
            abort(404);
        }

        $userId = $request->user()?->id;
        $sessionId = $request->session()->getId();

        $this->personalizationService->trackView($product->id, $userId, $sessionId);

        $recommendations = $this->personalizationService->getRecommendations($product->id, 8);
        $recentlyViewed = $this->personalizationService->getRecentlyViewed($userId, $sessionId, 6);

        $isFavorite = $userId ? $this->favoriteService->isFavorite($userId, $product->id) : false;

        $seoMeta = $this->seoService->buildMetaTags($product, [
            'title' => $product->meta_title ?? $product->name,
            'description' => $product->meta_description ?? $product->short_description,
        ]);

        $productSchema = $this->seoService->buildProductSchema($product);

        return Inertia::render('CMS/ProductDetail', [
            'product' => $product,
            'recommendations' => $recommendations,
            'recentlyViewed' => $recentlyViewed,
            'isFavorite' => $isFavorite,
            'seoMeta' => $seoMeta,
            'productSchema' => $productSchema,
        ]);
    }
}
