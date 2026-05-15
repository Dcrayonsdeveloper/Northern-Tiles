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
