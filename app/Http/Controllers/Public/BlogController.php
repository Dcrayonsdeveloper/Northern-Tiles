<?php

namespace App\Http\Controllers\Public;

use App\Domain\CMS\Services\CMSService;
use App\Domain\SEO\Services\SeoService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function __construct(
        protected CMSService $cmsService,
        protected SeoService $seoService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['category_slug', 'search']);

        $posts = $this->cmsService->getPosts($filters, 12);
        $categories = $this->cmsService->getPostCategories();

        return Inertia::render('CMS/Blog', [
            'posts' => $posts,
            'categories' => $categories,
            'filters' => $filters,
        ]);
    }

    public function category(Request $request, string $slug): Response
    {
        $filters = ['category_slug' => $slug];

        $posts = $this->cmsService->getPosts($filters, 12);
        $categories = $this->cmsService->getPostCategories();

        return Inertia::render('CMS/BlogCategory', [
            'posts' => $posts,
            'categories' => $categories,
            'categorySlug' => $slug,
        ]);
    }

    public function show(string $slug): Response
    {
        $post = $this->cmsService->getPost($slug);

        if (!$post) {
            abort(404);
        }

        $post->incrementViewCount();

        $relatedPosts = $this->cmsService->getPosts([
            'category_id' => $post->category_id,
        ], 4);

        $seoMeta = $this->seoService->buildMetaTags($post, [
            'title' => $post->meta_title ?? $post->title,
            'description' => $post->meta_description ?? $post->excerpt,
        ]);

        $articleSchema = $this->seoService->buildArticleSchema($post);

        return Inertia::render('CMS/BlogPost', [
            'post' => $post,
            'relatedPosts' => $relatedPosts,
            'seoMeta' => $seoMeta,
            'articleSchema' => $articleSchema,
        ]);
    }

    public function author(string $slug): Response
    {
        $author = $this->cmsService->getAuthor($slug);

        if (!$author) {
            abort(404);
        }

        $posts = $this->cmsService->getPosts(['author_id' => $author->id], 12);

        return Inertia::render('CMS/Author', [
            'author' => $author,
            'posts' => $posts,
        ]);
    }
}
