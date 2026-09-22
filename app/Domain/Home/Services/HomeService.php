<?php

namespace App\Domain\Home\Services;

use App\Domain\CMS\Models\Page;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class HomeService
{
    /**
     * Home section types in display order.
     */
    public const HOME_SECTIONS = [
        'hero_slider',
        'category_carousel',
        'new_arrivals',
        'video_section',
        'discount_tile_carousel',
        'gallery',
    ];

    /**
     * The home page's "Trending Products" strip.
     *
     * Hand-picked: whatever the admin has ticked as trending, in catalogue
     * order. It used to be "the 8 most recently created products", which is
     * not trending and could not be influenced from the admin at all — the
     * only way to change it was to add products in a different order.
     *
     * Falls back to the newest products when nothing is ticked, so the strip
     * never renders empty while the list is being set up.
     *
     * Draft products are excluded by is_active, so unticking is not the only
     * way to pull something out of here — setting it to Draft does too.
     *
     * @return array<int, array<string, mixed>>
     */
    public function trendingProducts(int $limit = 12): array
    {
        return Cache::remember('home.trending_products', 600, function () use ($limit) {
            $columns = [
                'id', 'name', 'slug', 'short_description',
                'price', 'compare_at_price', 'image_url', 'sqm_per_box', 'category_id',
            ];

            $picked = Product::query()
                ->where('is_active', true)
                ->where('is_featured', true)
                ->orderBy('name')
                ->limit($limit)
                ->get($columns);

            if ($picked->isEmpty()) {
                $picked = Product::query()
                    ->where('is_active', true)
                    ->orderByDesc('created_at')
                    ->limit(8)
                    ->get($columns);
            }

            return $picked->all();
        });
    }

    /**
     * The home page's "Find your perfect tile" filters.
     *
     * Built from the collections the admin maintains, grouped by the dimension
     * their handle encodes — colour-white, space-bathroom, finish-matt. The
     * section used to be hardcoded literals linking at ?color=white, which read
     * a separate set of import tags nobody could edit; the collections page
     * existed to drive this and was never wired to it.
     *
     * Only collections holding products are offered: a swatch that lands on an
     * empty page is worse than one less swatch. Dimensions with nothing in them
     * drop out entirely, which is what makes an unused "By Size" disappear
     * rather than render an empty tab.
     *
     * @return array<int, array<string, mixed>>
     */
    public function tileFinder(): array
    {
        return Cache::remember('home.tile_finder', 600, function () {
            $dimensions = [
                'colour' => ['label' => 'By Colour', 'prefix' => 'colour-'],
                'space' => ['label' => 'By Space', 'prefix' => 'space-'],
                'size' => ['label' => 'By Size', 'prefix' => 'size-'],
                'material' => ['label' => 'By Material', 'prefix' => 'material-'],
                'finish' => ['label' => 'By Finish', 'prefix' => 'finish-'],
                'style' => ['label' => 'By Style', 'prefix' => 'style-'],
            ];

            $collections = \App\Domain\Catalog\Models\Collection::query()
                ->where('is_active', true)
                ->orderBy('title')
                ->get(['id', 'title', 'handle', 'image_path']);

            $out = [];

            foreach ($dimensions as $key => $dimension) {
                $items = $collections
                    ->filter(fn ($c) => str_starts_with((string) $c->handle, $dimension['prefix']))
                    ->map(fn ($c) => [
                        'title' => $c->title,
                        'handle' => $c->handle,
                        'url' => '/collections/' . $c->handle,
                        'count' => $c->products()->where('is_active', true)->count(),
                        'image' => $c->image_url,
                    ])
                    ->filter(fn ($item) => $item['count'] > 0)
                    ->values();

                if ($items->isEmpty()) {
                    continue;
                }

                $out[] = [
                    'key' => $key,
                    'label' => $dimension['label'],
                    'items' => $items->all(),
                ];
            }

            return $out;
        });
    }

    /**
     * Root categories for the "Shop by Category" strip.
     *
     * Was six hardcoded cards with stock photography, invented counts
     * ("120+ Products") and slugs that no longer exist — ?category=external
     * and ?category=trade-products both resolve to nothing since the category
     * rebuild. Now it is the real tree: each root, its true product count
     * counted across its children, and a picture taken from a product inside
     * it rather than a stock photo of somebody else's tiles.
     *
     * Roots holding no products are left out. A card advertising a range and
     * landing on "No products found" is worse than no card, and the moment
     * one gets products it appears here on its own.
     *
     * @return array<int, array<string, mixed>>
     */
    public function rootCategories(): array
    {
        return Cache::remember('home.root_categories', 600, function () {
            $roots = Category::query()
                ->whereNull('parent_id')
                ->where('is_active', true)
                ->with(['children' => fn ($q) => $q->where('is_active', true)->orderBy('sort')->orderBy('name')])
                ->orderBy('sort')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'image_path', 'sort']);

            $cards = [];

            foreach ($roots as $root) {
                $count = Product::query()
                    ->where('is_active', true)
                    ->inCategoryTree($root->slug)
                    ->count();

                if ($count === 0) {
                    continue;
                }

                $children = $root->children->pluck('name');

                $cards[] = [
                    'id' => $root->id,
                    'name' => $root->name,
                    'slug' => $root->slug,
                    'href' => "/shop?category={$root->slug}",
                    'count' => $count,
                    // The sub-categories are the honest description of a root,
                    // and they update themselves when the tree changes.
                    'desc' => $children->isNotEmpty()
                        ? $children->take(3)->implode(', ') . ($children->count() > 3 ? ' & more' : '')
                        : null,
                    'image' => $root->image_path
                        ? '/storage/' . ltrim($root->image_path, '/')
                        : $this->sampleImageFor($root->slug),
                ];
            }

            return $cards;
        });
    }

    /**
     * A picture of something actually in this part of the catalogue.
     *
     * Walks a few candidates rather than taking the first: image_url is
     * sometimes set to a local path whose file was never synced, and a card
     * with a broken image is worse than one with none.
     */
    private function sampleImageFor(string $slug): ?string
    {
        $candidates = Product::query()
            ->where('is_active', true)
            ->inCategoryTree($slug)
            ->whereNotNull('image_url')
            ->where('image_url', '!=', '')
            ->orderByDesc('is_featured')
            ->limit(12)
            ->pluck('image_url');

        foreach ($candidates as $url) {
            if (! str_starts_with($url, '/storage')) {
                return $url;    // remote CDN url — taken on trust
            }

            if (is_file(storage_path('app/public' . substr($url, strlen('/storage'))))) {
                return $url;
            }
        }

        return null;
    }

    /**
     * Get all home page data with caching.
     * Data is pulled from a Page with template='home'.
     */
    public function getHomeData(): array
    {
        return Cache::remember('home.page_data', 3600, function () {
            $homePage = $this->getHomePage();

            if (!$homePage) {
                return $this->getDefaultHomeData();
            }

            $sections = [];
            foreach ($homePage->activeSections()->ordered()->get() as $section) {
                $sectionKey = $section->section_key;
                $data = $section->data_json ?? [];

                $sections[$sectionKey] = match ($sectionKey) {
                    'hero_slider' => $this->resolveHeroSlider($data),
                    'category_carousel' => $this->resolveCategoryCarousel($data),
                    'new_arrivals' => $this->resolveNewArrivals($data),
                    'video_section' => $this->resolveVideoSection($data),
                    'discount_tile_carousel' => $this->resolveDiscountTileCarousel($data),
                    'gallery' => $this->resolveGallery($data),
                    default => $data,
                };
            }

            return $sections;
        });
    }

    /**
     * Get the home page (template='home', published).
     */
    protected function getHomePage(): ?Page
    {
        return Page::query()
            ->where('template', 'home')
            ->published()
            ->with(['activeSections'])
            ->first();
    }

    /**
     * Get default home data when no home page exists.
     */
    protected function getDefaultHomeData(): array
    {
        return [
            'hero_slider' => ['slides' => []],
            'category_carousel' => $this->resolveCategoryCarousel([]),
            'new_arrivals' => $this->resolveNewArrivals([]),
            'video_section' => null,
            'discount_tile_carousel' => $this->resolveDiscountTileCarousel([]),
            'gallery' => ['items' => []],
        ];
    }

    /**
     * Resolve hero slider data.
     */
    protected function resolveHeroSlider(array $data): array
    {
        $slides = $data['slides'] ?? [];

        // Filter active slides and resolve image URLs
        $resolvedSlides = collect($slides)
            ->filter(fn($slide) => ($slide['is_active'] ?? true))
            ->sortBy(fn($slide) => $slide['sort'] ?? 0)
            ->map(function ($slide, $index) {
                // If image_path is set, resolve the full URL
                if (!empty($slide['image_path'])) {
                    $slide['image_url'] = asset('storage/' . $slide['image_path']);
                }
                $slide['id'] = $index + 1;

                // Normalize CTA key names (support both old and new naming)
                // Map cta1_* to cta_primary_* for component compatibility
                if (isset($slide['cta1_label_key']) && !isset($slide['cta_primary_label_key'])) {
                    $slide['cta_primary_label_key'] = $slide['cta1_label_key'];
                }
                if (isset($slide['cta1_href']) && !isset($slide['cta_primary_href'])) {
                    $slide['cta_primary_href'] = $slide['cta1_href'];
                }
                if (isset($slide['cta2_label_key']) && !isset($slide['cta_secondary_label_key'])) {
                    $slide['cta_secondary_label_key'] = $slide['cta2_label_key'];
                }
                if (isset($slide['cta2_href']) && !isset($slide['cta_secondary_href'])) {
                    $slide['cta_secondary_href'] = $slide['cta2_href'];
                }

                // Normalize alt key name
                if (isset($slide['alt_key']) && !isset($slide['image_alt_key'])) {
                    $slide['image_alt_key'] = $slide['alt_key'];
                }

                return $slide;
            })
            ->values()
            ->all();

        return ['slides' => $resolvedSlides];
    }

    /**
     * Resolve category carousel data with cached categories.
     */
    protected function resolveCategoryCarousel(array $data): array
    {
        $titleKey = $data['title_key'] ?? 'home.categories.title';
        $categoryIds = $data['category_ids'] ?? [];
        $limit = $data['limit'] ?? 12;

        $cacheKey = 'home.categories.' . md5(json_encode($categoryIds) . $limit);

        $categories = Cache::remember($cacheKey, 300, function () use ($categoryIds, $limit) {
            $query = Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->limit($limit);

            if (!empty($categoryIds)) {
                $query->whereIn('id', $categoryIds);
            }

            return $query->get([
                'id',
                'name',
                'slug',
            ]);
        });

        return [
            'title_key' => $titleKey,
            'categories' => $categories,
        ];
    }

    /**
     * Resolve new arrivals data with cached products.
     */
    protected function resolveNewArrivals(array $data): array
    {
        $titleKey = $data['title_key'] ?? 'home.new_arrivals.title';
        $limit = $data['limit'] ?? 8;
        $categoryId = $data['category_id'] ?? null;

        $cacheKey = 'home.new_arrivals.' . ($categoryId ?? 'all') . '.' . $limit;

        $products = Cache::remember($cacheKey, 3600, function () use ($limit, $categoryId) {
            $query = Product::query()
                ->where('is_active', true)
                ->orderByDesc('created_at')
                ->limit($limit);

            if ($categoryId) {
                $query->where('category_id', $categoryId);
            }

            return $query->get([
                'id',
                'name',
                'slug',
                'short_description',
                'price',
                'compare_at_price',
                'image_url',
            ]);
        });

        return [
            'title_key' => $titleKey,
            'products' => $products,
        ];
    }

    /**
     * Resolve video section data.
     */
    protected function resolveVideoSection(array $data): ?array
    {
        if (empty($data['video_file_path']) && empty($data['embed_url'])) {
            return null;
        }

        $resolved = [
            'heading_key' => $data['heading_key'] ?? null,
            'subheading_key' => $data['subheading_key'] ?? null,
            'video_type' => $data['video_type'] ?? 'embed',
            'cta_label_key' => $data['cta_label_key'] ?? null,
            'cta_href' => $data['cta_href'] ?? null,
        ];

        if (($data['video_type'] ?? 'embed') === 'upload' && !empty($data['video_file_path'])) {
            $resolved['video_url'] = asset('storage/' . $data['video_file_path']);
        } else {
            $resolved['embed_url'] = $data['embed_url'] ?? null;
        }

        if (!empty($data['poster_path'])) {
            $resolved['poster_url'] = asset('storage/' . $data['poster_path']);
        }

        return $resolved;
    }

    /**
     * Resolve discount tile carousel data with cached discounted products.
     */
    protected function resolveDiscountTileCarousel(array $data): array
    {
        $titleKey = $data['title_key'] ?? 'home.discounts.title';
        $limit = $data['limit'] ?? 10;
        $minDiscountPercent = $data['min_discount_percent'] ?? 10;

        $cacheKey = 'home.discounts.' . $limit . '.' . $minDiscountPercent;

        $products = Cache::remember($cacheKey, 3600, function () use ($limit, $minDiscountPercent) {
            return Product::query()
                ->where('is_active', true)
                ->whereNotNull('compare_at_price')
                ->whereColumn('compare_at_price', '>', 'price')
                ->whereRaw('((compare_at_price - price) / compare_at_price * 100) >= ?', [$minDiscountPercent])
                ->orderByRaw('((compare_at_price - price) / compare_at_price) DESC')
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get([
                    'id',
                    'name',
                    'slug',
                    'short_description',
                    'price',
                    'compare_at_price',
                    'image_url',
                ]);
        });

        return [
            'title_key' => $titleKey,
            'products' => $products,
        ];
    }

    /**
     * Resolve gallery data.
     */
    protected function resolveGallery(array $data): array
    {
        $titleKey = $data['title_key'] ?? 'home.gallery.title';
        $items = $data['items'] ?? [];

        $resolvedItems = collect($items)
            ->filter(fn($item) => !empty($item['image_path']))
            ->sortBy('sort')
            ->map(function ($item) {
                return [
                    'image_url' => asset('storage/' . $item['image_path']),
                    'alt_key' => $item['alt_key'] ?? '',
                    'href' => $item['href'] ?? null,
                ];
            })
            ->values()
            ->all();

        return [
            'title_key' => $titleKey,
            'items' => $resolvedItems,
        ];
    }

    /**
     * Clear all home page caches.
     */
    public function clearCache(): void
    {
        Cache::forget('home.page_data');
        // Clear related caches with pattern
        $patterns = ['home.categories.*', 'home.new_arrivals.*', 'home.discounts.*'];
        foreach ($patterns as $pattern) {
            // For simple implementations, clear known keys
            Cache::forget('home.categories.all');
            Cache::forget('home.new_arrivals.all.8');
            Cache::forget('home.discounts.10.10');
        }
    }
}
