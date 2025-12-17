<?php

namespace App\Domain\CMS\Http\Controllers;

use App\Domain\CMS\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    /**
     * Display a page by its full slug.
     *
     * Supports:
     * - Draft preview with ?preview=true query parameter (authenticated admins only)
     * - Scheduled pages that haven't been published yet
     * - Soft-deleted pages are excluded unless admin preview
     */
    public function show(Request $request, string $slug): Response
    {
        $isPreview = $request->boolean('preview') && $request->user()?->can('viewAny', Page::class);

        // Build query for finding the page
        $query = Page::query()
            ->with(['sections' => function ($q) {
                $q->where('is_active', true)->orderBy('sort');
            }, 'author'])
            ->where('full_slug', $slug);

        // For previews, allow draft/scheduled pages
        if ($isPreview) {
            $page = $query->first();
        } else {
            // Only show published pages
            $page = $query->published()->first();
        }

        if (!$page) {
            abort(404);
        }

        // Build SEO meta tags
        $seo = $this->buildSeoMeta($page, $isPreview);

        return Inertia::render('Public/Page', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'full_slug' => $page->full_slug,
                'template' => $page->template,
                'body_json' => $page->body_json,
                'featured_image_url' => $page->featured_image_url,
                'author' => $page->author ? [
                    'id' => $page->author->id,
                    'name' => $page->author->name,
                    'bio' => $page->author->bio,
                    'avatar_url' => $page->author->avatar_url,
                ] : null,
                'sections' => $page->sections->map(fn ($section) => [
                    'id' => $section->id,
                    'section_key' => $section->section_key,
                    'data_json' => $section->data_json,
                    'sort' => $section->sort,
                ]),
                'published_at' => $page->published_at?->toISOString(),
                'updated_at' => $page->updated_at?->toISOString(),
            ],
            'seo' => $seo,
            'isPreview' => $isPreview,
        ]);
    }

    /**
     * Build SEO meta tags for the page.
     */
    protected function buildSeoMeta(Page $page, bool $isPreview): array
    {
        $baseUrl = config('app.url');

        $meta = [
            'title' => $page->meta_title ?: $page->title,
            'description' => $page->meta_description ?: null,
            'canonical' => $page->canonical_url ?: $baseUrl . '/' . $page->full_slug,
            'og_image' => $page->og_image_url ?: $page->featured_image_url,
            'robots' => $this->buildRobotsTag($page, $isPreview),
        ];

        return $meta;
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
        $follow = $page->robots_follow ? 'follow' : 'nofollow';

        return "{$index}, {$follow}";
    }
}
