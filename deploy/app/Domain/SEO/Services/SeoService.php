<?php

namespace App\Domain\SEO\Services;

use App\Domain\SEO\Models\NotFoundLog;
use App\Domain\SEO\Models\Redirect;
use App\Domain\SEO\Models\SeoMeta;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SeoService
{
    public function getMeta(Model $model): ?SeoMeta
    {
        return SeoMeta::getFor(get_class($model), $model->id);
    }

    public function saveMeta(Model $model, array $data): SeoMeta
    {
        return SeoMeta::updateFor(get_class($model), $model->id, $data);
    }

    public function getRedirect(string $path): ?Redirect
    {
        return Redirect::findMatch($path);
    }

    public function log404(string $path, Request $request): NotFoundLog
    {
        return NotFoundLog::log(
            $path,
            $request->header('referer'),
            $request->userAgent(),
            $request->ip()
        );
    }

    public function generateSitemap(): string
    {
        $urls = [];

        $urls[] = $this->sitemapUrl(url('/'), now(), 'daily', '1.0');

        $pages = \App\Domain\CMS\Models\Page::published()->get();
        foreach ($pages as $page) {
            $urls[] = $this->sitemapUrl(
                url("/page/{$page->slug}"),
                $page->updated_at,
                'weekly',
                '0.8'
            );
        }

        $posts = \App\Domain\CMS\Models\Post::published()->get();
        foreach ($posts as $post) {
            $urls[] = $this->sitemapUrl(
                url("/blog/{$post->slug}"),
                $post->updated_at,
                'weekly',
                '0.7'
            );
        }

        $categories = \App\Models\Category::where('is_active', true)->get();
        foreach ($categories as $category) {
            $urls[] = $this->sitemapUrl(
                url("/shop/category/{$category->slug}"),
                $category->updated_at,
                'weekly',
                '0.8'
            );
        }

        $products = \App\Models\Product::active()->get();
        foreach ($products as $product) {
            $urls[] = $this->sitemapUrl(
                url("/shop/product/{$product->slug}"),
                $product->updated_at,
                'daily',
                '0.9'
            );
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        $xml .= implode("\n", $urls);
        $xml .= "\n</urlset>";

        Storage::disk('public')->put('sitemap.xml', $xml);

        return $xml;
    }

    protected function sitemapUrl(string $loc, $lastmod, string $changefreq, string $priority): string
    {
        $lastmod = $lastmod instanceof \Carbon\Carbon ? $lastmod->toIso8601String() : $lastmod;

        return "  <url>\n" .
            "    <loc>{$loc}</loc>\n" .
            "    <lastmod>{$lastmod}</lastmod>\n" .
            "    <changefreq>{$changefreq}</changefreq>\n" .
            "    <priority>{$priority}</priority>\n" .
            "  </url>";
    }

    public function getRobotsTxt(): string
    {
        $path = Storage::disk('public')->exists('robots.txt')
            ? Storage::disk('public')->get('robots.txt')
            : $this->getDefaultRobotsTxt();

        return $path;
    }

    public function saveRobotsTxt(string $content): void
    {
        Storage::disk('public')->put('robots.txt', $content);
    }

    protected function getDefaultRobotsTxt(): string
    {
        $sitemapUrl = url('/sitemap.xml');

        return "User-agent: *\n" .
            "Allow: /\n" .
            "Disallow: /admin/\n" .
            "Disallow: /seller/\n" .
            "Disallow: /api/\n" .
            "Disallow: /cart\n" .
            "Disallow: /checkout\n" .
            "\n" .
            "Sitemap: {$sitemapUrl}";
    }

    public function buildMetaTags(Model $model, array $defaults = []): array
    {
        $meta = $this->getMeta($model);

        $title = $meta?->getMetaTitle($defaults['title'] ?? null) ?? $defaults['title'] ?? '';
        $description = $meta?->getMetaDescription($defaults['description'] ?? null) ?? $defaults['description'] ?? '';

        return [
            'title' => $title,
            'description' => $description,
            'robots' => $meta?->getRobotsContent() ?? 'index, follow',
            'canonical' => $meta?->canonical_url ?? $defaults['canonical'] ?? null,
            'og' => [
                'title' => $meta?->getOgTitle($title) ?? $title,
                'description' => $meta?->getOgDescription($description) ?? $description,
                'image' => $meta?->og_image ?? $defaults['og_image'] ?? null,
                'type' => $meta?->og_type ?? $defaults['og_type'] ?? 'website',
            ],
            'twitter' => [
                'title' => $meta?->getTwitterTitle($title) ?? $title,
                'description' => $meta?->getTwitterDescription($description) ?? $description,
                'image' => $meta?->twitter_image ?? $meta?->og_image ?? $defaults['twitter_image'] ?? null,
                'card' => $meta?->twitter_card ?? 'summary_large_image',
            ],
            'schema' => $meta?->getSchema() ?? [],
        ];
    }

    public function buildProductSchema(\App\Models\Product $product): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $product->name,
            'description' => $product->description,
            'sku' => $product->sku,
            'brand' => $product->brand ? [
                '@type' => 'Brand',
                'name' => $product->brand,
            ] : null,
            'image' => $product->image_url,
            'offers' => [
                '@type' => 'Offer',
                'price' => $product->price,
                'priceCurrency' => 'USD',
                'availability' => $product->isInStock()
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
            ],
        ];
    }

    public function buildArticleSchema(\App\Domain\CMS\Models\Post $post): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $post->title,
            'description' => $post->excerpt,
            'image' => $post->featured_image,
            'datePublished' => $post->published_at?->toIso8601String(),
            'dateModified' => $post->updated_at->toIso8601String(),
            'author' => $post->author ? [
                '@type' => 'Person',
                'name' => $post->author->name,
            ] : null,
        ];
    }
}
