<?php

namespace Tests\Feature\Admin;

use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Models\Post;
use App\Domain\CMS\Services\CMSService;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * The storefront caches the home page, CMS pages and blog posts. Each test
 * loads the public page first so the cache is warm, makes the change the way
 * the admin does, then checks the next visitor sees it — not the copy cached
 * before the change, which is what they used to get for up to an hour.
 */
class StorefrontCacheTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function product(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'name' => 'Vihal Cloud Polished 600x1200',
            'slug' => 'vihal-cloud-polished-600x1200',
            'price' => 38.00,
            'status' => Product::STATUS_PUBLISHED,
            'is_active' => true,
        ], $overrides));
    }

    private function page(array $overrides = []): Page
    {
        return Page::create(array_merge([
            'title' => 'Showroom',
            'slug' => 'showroom',
            'status' => Page::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ], $overrides));
    }

    public function test_a_renamed_category_shows_on_the_home_page(): void
    {
        // The migrations seed the real category tree, so the slugs here are
        // ones it does not use. Only roots holding products get a card.
        $root = Category::create(['name' => 'Feature Tiles', 'slug' => 'test-feature-tiles', 'is_active' => true]);
        $child = Category::create(['name' => 'Patchwork', 'slug' => 'test-patchwork', 'parent_id' => $root->id, 'is_active' => true]);
        $this->product(['category_id' => $child->id]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('rootCategories.0.name', 'Feature Tiles'));

        $root->update(['name' => 'Floor & Wall Tiles']);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('rootCategories.0.name', 'Floor & Wall Tiles'));
    }

    public function test_bulk_drafted_products_leave_the_trending_strip(): void
    {
        $product = $this->product(['is_featured' => true]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('trendingProducts.0.slug', $product->slug));

        // A mass update fires no model events, so Product::saved never ran.
        $this->actingAs($this->admin())->post(route('admin.products.bulk-status'), [
            'ids' => [$product->id],
            'status' => 'draft',
        ]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->has('trendingProducts', 0));
    }

    public function test_a_trashed_page_is_no_longer_served(): void
    {
        $page = $this->page();
        $this->get('/page/showroom')->assertOk();

        $this->actingAs($this->admin())->delete(route('admin.pages.destroy', $page));

        $this->get('/page/showroom')->assertNotFound();
    }

    public function test_bulk_archived_pages_are_no_longer_served(): void
    {
        $page = $this->page();
        $this->get('/page/showroom')->assertOk();

        $this->actingAs($this->admin())->post(route('admin.pages.bulk-status'), [
            'ids' => [$page->id],
            'status' => 'archived',
        ]);

        $this->get('/page/showroom')->assertNotFound();
    }

    public function test_a_renamed_page_stops_answering_at_its_old_address(): void
    {
        $page = $this->page();
        $this->get('/page/showroom')->assertOk();

        $page->update(['slug' => 'visit-us']);

        $this->get('/page/showroom')->assertNotFound();
        $this->get('/page/visit-us')->assertOk();
    }

    public function test_an_unpublished_post_is_no_longer_served(): void
    {
        $post = Post::create([
            'title' => 'Choosing grout',
            'slug' => 'choosing-grout',
            'status' => 'published',
            'published_at' => now()->subDay(),
            'body_json' => [['type' => 'html', 'content' => '<p>Match it to the tile.</p>']],
        ]);
        $this->get('/blog/choosing-grout')->assertOk();

        $this->actingAs($this->admin())->post(route('admin.posts.unpublish', $post));

        $this->get('/blog/choosing-grout')->assertNotFound();
    }

    public function test_a_post_saves_with_tags(): void
    {
        $post = Post::create(['title' => 'Choosing grout', 'slug' => 'choosing-grout', 'status' => 'draft']);

        // Threw BadMethodCallException after saving the other fields: Post had
        // no syncTags().
        app(CMSService::class)->updatePost($post, ['title' => 'Choosing grout colours', 'tags' => ['Grout', 'Bathrooms']]);

        $this->assertSame('Choosing grout colours', $post->fresh()->title);
        $this->assertSame(['Bathrooms', 'Grout'], $post->tags()->orderBy('name')->pluck('name')->all());
    }
}
