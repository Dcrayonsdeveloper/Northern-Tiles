<?php

namespace App\Http\Controllers\Public;

use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Services\CMSService;
use App\Domain\SEO\Services\SeoService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(
        protected CMSService $cmsService,
        protected SeoService $seoService
    ) {}

    /**
     * Show a CMS page by its slug (supports hierarchical full_slug).
     *
     * Supports draft preview with ?preview=true for authenticated admins.
     */
    public function show(Request $request, string $slug): Response
    {
        // Check if preview mode is requested and user has permission
        $isPreview = $request->boolean('preview')
            && $request->user()
            && $request->user()->can('viewAny', Page::class);

        $page = $this->cmsService->getPage($slug, $isPreview);

        if (!$page) {
            abort(404);
        }

        // Build SEO meta tags
        $seoMeta = $this->buildSeoMeta($page, $isPreview);

        // Transform page data for frontend
        $pageData = $this->transformPage($page);

        return Inertia::render('CMS/Page', [
            'page' => $pageData,
            'seoMeta' => $seoMeta,
            'isPreview' => $isPreview,
        ]);
    }

    /**
     * Transform page model to frontend data.
     */
    protected function transformPage(Page $page): array
    {
        return [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'full_slug' => $page->full_slug,
            'template' => $page->template ?? 'default',
            'body_json' => $page->body_json,
            'featured_image_url' => $page->featured_image_url,
            'og_image_url' => $page->og_image_url,
            'status' => $page->status,
            'author' => $page->author ? [
                'id' => $page->author->id,
                'name' => $page->author->name,
                'bio' => $page->author->bio ?? null,
                'avatar_url' => $page->author->avatar_url ?? null,
            ] : null,
            'sections' => $page->sections->map(fn ($section) => [
                'id' => $section->id,
                'section_key' => $section->section_key,
                'data_json' => $section->data_json ?? [],
                'sort' => $section->sort,
            ])->values(),
            'published_at' => $page->published_at?->toISOString(),
            'updated_at' => $page->updated_at?->toISOString(),
            'created_at' => $page->created_at?->toISOString(),
        ];
    }

    /**
     * Build SEO meta tags for the page.
     */
    protected function buildSeoMeta(Page $page, bool $isPreview): array
    {
        $baseUrl = config('app.url');
        $pageUrl = $baseUrl . '/' . ($page->full_slug ?? $page->slug);

        return [
            'title' => $page->meta_title ?: $page->title,
            'description' => $page->meta_description ?: null,
            'canonical' => $page->canonical_url ?: $pageUrl,
            'og_title' => $page->meta_title ?: $page->title,
            'og_description' => $page->meta_description ?: null,
            'og_image' => $page->og_image_url ?: $page->featured_image_url,
            'og_url' => $pageUrl,
            'og_type' => 'website',
            'robots' => $this->buildRobotsTag($page, $isPreview),
        ];
    }

    /**
     * Build robots meta tag based on page settings.
     */
    protected function buildRobotsTag(Page $page, bool $isPreview): string
    {
        // Preview pages should never be indexed
        if ($isPreview || $page->status !== Page::STATUS_PUBLISHED) {
            return 'noindex, nofollow';
        }

        $index = $page->noindex ? 'noindex' : 'index';
        $follow = ($page->robots_follow ?? true) ? 'follow' : 'nofollow';

        return "{$index}, {$follow}";
    }

    public function home(): Response
    {
        return Inertia::render('CMS/Home', [
        ]);
    }
}
