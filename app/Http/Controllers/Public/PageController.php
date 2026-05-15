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
            'content' => $this->renderBodyJson($page->body_json),
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
     * Convert body_json to HTML content.
     *
     * Supports two formats:
     *   - Simple:  { "description": "..." }   — set by the Description textarea in the admin
     *   - Blocks:  { "blocks": [ {...}, ... ] } — legacy block-based format
     */
    protected function renderBodyJson(?array $bodyJson): string
    {
        if (!$bodyJson) {
            return '';
        }

        // Simple description format (used by the admin Description textarea)
        if (array_key_exists('description', $bodyJson)) {
            $desc = trim($bodyJson['description'] ?? '');
            if ($desc === '') {
                return '';
            }
            // If it contains HTML tags, return as-is; otherwise wrap plain text in paragraphs
            if (strip_tags($desc) !== $desc) {
                return $desc;
            }
            // Plain text: split on blank lines to make paragraphs, auto-linking URLs
            $paragraphs = array_filter(array_map('trim', preg_split('/\n{2,}/', $desc)));
            return implode('', array_map(
                fn($p) => '<p>' . $this->autoLinkUrls(nl2br(e($p))) . '</p>',
                $paragraphs
            ));
        }

        // Legacy block format
        if (empty($bodyJson['blocks'])) {
            return '';
        }

        $html = '';
        foreach ($bodyJson['blocks'] as $block) {
            $content = e($block['content'] ?? '');
            $rawContent = $block['content'] ?? '';

            switch ($block['type'] ?? 'paragraph') {
                case 'heading':
                    $level = $block['level'] ?? 2;
                    $html .= "<h{$level}>{$content}</h{$level}>";
                    break;
                case 'paragraph':
                    $html .= "<p>{$content}</p>";
                    break;
                case 'html':
                    $html .= $rawContent;
                    break;
                case 'list':
                    $items = $block['items'] ?? [];
                    $tag = ($block['style'] ?? 'unordered') === 'ordered' ? 'ol' : 'ul';
                    $html .= "<{$tag}>";
                    foreach ($items as $item) {
                        $html .= '<li>' . e($item) . '</li>';
                    }
                    $html .= "</{$tag}>";
                    break;
                default:
                    $html .= "<p>{$content}</p>";
            }
        }

        return $html;
    }

    /**
     * Convert bare URLs in already-escaped HTML text to clickable <a> links.
     * Handles https://, http://, and www. prefixes.
     */
    protected function autoLinkUrls(string $html): string
    {
        // Runs on already-HTML-escaped text. Only < > " ' should delimit a URL end.
        return preg_replace_callback(
            '/\b(https?:\/\/[^\s<>"\']+|www\.[a-zA-Z0-9._\-]+\.[a-zA-Z]{2,}[^\s<>"\']*)/i',
            function (array $m): string {
                $raw = $m[1];
                // Strip trailing punctuation that is unlikely part of the URL
                $raw = rtrim($raw, '.,;:!?)');
                $href = preg_match('/^https?:\/\//i', $raw) ? $raw : 'https://' . $raw;
                return '<a href="' . htmlspecialchars($href, ENT_QUOTES, 'UTF-8')
                    . '" target="_blank" rel="noopener noreferrer">'
                    . $raw . '</a>';
            },
            $html
        );
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
