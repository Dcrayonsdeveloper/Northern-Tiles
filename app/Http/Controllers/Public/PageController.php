<?php

namespace App\Http\Controllers\Public;

use App\Domain\CMS\Services\CMSService;
use App\Domain\SEO\Services\SeoService;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(
        protected CMSService $cmsService,
        protected SeoService $seoService
    ) {}

    public function show(string $slug): Response
    {
        $page = $this->cmsService->getPage($slug);

        if (!$page) {
            abort(404);
        }

        $seoMeta = $this->seoService->buildMetaTags($page, [
            'title' => $page->meta_title ?? $page->title,
            'description' => $page->meta_description,
        ]);

        return Inertia::render('CMS/Page', [
            'page' => $page,
            'seoMeta' => $seoMeta,
        ]);
    }

    public function home(): Response
    {
        return Inertia::render('CMS/Home', [
        ]);
    }
}
