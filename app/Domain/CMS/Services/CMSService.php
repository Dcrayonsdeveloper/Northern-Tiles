<?php

namespace App\Domain\CMS\Services;

use App\Domain\CMS\Models\Author;
use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Models\Post;
use App\Domain\CMS\Models\PostCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class CMSService
{
    /**
     * Get a page by slug or full_slug.
     *
     * @param string $slug The page slug or full path slug (e.g., "about" or "company/about/team")
     * @param bool $preview If true, return drafts/scheduled pages as well
     */
    public function getPage(string $slug, bool $preview = false): ?Page
    {
        $cacheKey = $preview ? "page.preview.{$slug}" : "page.{$slug}";
        $ttl = $preview ? 60 : 3600; // Shorter TTL for previews

        return Cache::remember($cacheKey, $ttl, function () use ($slug, $preview) {
            $query = Page::with([
                'author',
                'sections' => function ($q) {
                    $q->where('is_active', true)->orderBy('sort');
                },
            ]);

            // Try full_slug first, then regular slug
            $query->where(function ($q) use ($slug) {
                $q->where('full_slug', $slug)
                    ->orWhere('slug', $slug);
            });

            if (!$preview) {
                $query->published();
            }

            return $query->first();
        });
    }

    /**
     * Get a page by full_slug for hierarchical pages.
     */
    public function getPageByFullSlug(string $fullSlug, bool $preview = false): ?Page
    {
        return $this->getPage($fullSlug, $preview);
    }

    public function getPost(string $slug): ?Post
    {
        return Cache::remember("post.{$slug}", 3600, function () use ($slug) {
            return Post::with(['author', 'category', 'tags'])
                ->where('slug', $slug)
                ->published()
                ->first();
        });
    }

    public function getPosts(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Post::with(['author', 'category'])
            ->published()
            ->orderBy('published_at', 'desc');

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['category_slug'])) {
            $query->whereHas('category', function ($q) use ($filters) {
                $q->where('slug', $filters['category_slug']);
            });
        }

        if (!empty($filters['author_id'])) {
            $query->where('author_id', $filters['author_id']);
        }

        if (!empty($filters['is_featured'])) {
            $query->featured();
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }

    public function getPostCategories(): Collection
    {
        return Cache::remember('post_categories', 3600, function () {
            return PostCategory::active()
                ->withCount(['posts' => function ($q) {
                    $q->published();
                }])
                ->orderBy('sort_order')
                ->get();
        });
    }

    public function getAuthor(string $slug): ?Author
    {
        return Cache::remember("author.{$slug}", 3600, function () use ($slug) {
            return Author::with(['posts' => function ($q) {
                $q->published()->latest('published_at')->limit(10);
            }])
                ->where('slug', $slug)
                ->active()
                ->first();
        });
    }

    public function getAuthors(): Collection
    {
        return Cache::remember('authors', 3600, function () {
            return Author::active()
                ->withCount(['posts' => function ($q) {
                    $q->published();
                }])
                ->orderBy('name')
                ->get();
        });
    }

    public function createPage(array $data): Page
    {
        $page = Page::create($data);
        $this->flushPageCache($page->slug);
        return $page;
    }

    public function updatePage(Page $page, array $data): Page
    {
        $oldSlug = $page->slug;
        $page->update($data);

        $this->flushPageCache($oldSlug);
        if ($oldSlug !== $page->slug) {
            $this->flushPageCache($page->slug);
        }

        return $page;
    }

    public function createPost(array $data): Post
    {
        $post = Post::create($data);

        if (!empty($data['tags'])) {
            $post->syncTags($data['tags']);
        }

        $this->flushPostCache($post->slug);
        return $post;
    }

    public function updatePost(Post $post, array $data): Post
    {
        $oldSlug = $post->slug;
        $post->update($data);

        if (isset($data['tags'])) {
            $post->syncTags($data['tags']);
        }

        $this->flushPostCache($oldSlug);
        if ($oldSlug !== $post->slug) {
            $this->flushPostCache($post->slug);
        }

        return $post;
    }

    public function publishPage(Page $page): Page
    {
        $page->publish();
        $this->flushPageCache($page->slug);
        return $page;
    }

    public function publishPost(Post $post): Post
    {
        $post->publish();
        $this->flushPostCache($post->slug);
        return $post;
    }

    public function flushPageCache(string $slug, ?string $fullSlug = null): void
    {
        Cache::forget("page.{$slug}");
        Cache::forget("page.preview.{$slug}");

        if ($fullSlug && $fullSlug !== $slug) {
            Cache::forget("page.{$fullSlug}");
            Cache::forget("page.preview.{$fullSlug}");
        }
    }

    public function flushPostCache(string $slug): void
    {
        Cache::forget("post.{$slug}");
        Cache::forget('post_categories');
    }

    public function flushAuthorCache(string $slug): void
    {
        Cache::forget("author.{$slug}");
        Cache::forget('authors');
    }
}
