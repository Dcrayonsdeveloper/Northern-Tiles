<?php

namespace Tests\Feature\Admin;

use App\Domain\Catalog\Services\ProductService;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Duplicate copies a product into a draft the admin can edit into something
 * new. Every product in the catalogue carries a SKU and products.sku is
 * UNIQUE, so the copy has to be given its own — replicating the original's
 * broke the constraint and the button 500'd for all 638 products.
 */
class ProductDuplicateTest extends TestCase
{
    use RefreshDatabase;

    private function product(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'name' => 'Vihal Cloud Polished 600x1200',
            'slug' => 'vihal-cloud-polished-600x1200',
            'sku' => 'NTD2004',
            'price' => 38.00,
            'inventory_quantity' => 0,
            'inventory_policy' => 'continue',
            'status' => Product::STATUS_PUBLISHED,
            'is_active' => true,
        ], $overrides));
    }

    public function test_a_product_with_a_sku_can_be_duplicated(): void
    {
        $user = User::factory()->create();
        $product = $this->product();

        $copy = app(ProductService::class)->duplicateProduct($product, $user);

        $this->assertNotSame($product->id, $copy->id);
        $this->assertSame('Vihal Cloud Polished 600x1200 (Copy)', $copy->name);
        $this->assertSame('NTD2004-COPY', $copy->sku);
        $this->assertSame(Product::STATUS_DRAFT, $copy->status);
        $this->assertNull($copy->published_at);

        // The original is untouched.
        $this->assertSame('NTD2004', $product->fresh()->sku);
    }

    public function test_duplicating_a_duplicate_keeps_numbering_instead_of_colliding(): void
    {
        $user = User::factory()->create();
        $service = app(ProductService::class);

        $first = $service->duplicateProduct($this->product(), $user);
        $second = $service->duplicateProduct($first, $user);

        $this->assertSame('NTD2004-COPY', $first->sku);
        $this->assertSame('NTD2004-COPY-2', $second->sku);
    }

    public function test_a_product_without_a_sku_copies_to_a_null_sku(): void
    {
        $user = User::factory()->create();
        $product = $this->product(['sku' => null, 'slug' => 'no-sku-tile']);

        $copy = app(ProductService::class)->duplicateProduct($product, $user);

        // NULLs do not collide under a unique index, so a blank SKU stays blank
        // rather than being invented.
        $this->assertNull($copy->sku);
    }

    public function test_images_are_copied_to_their_own_files(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $product = $this->product();

        Storage::disk('public')->put("products/{$product->id}/images/tile.jpg", 'original-bytes');
        $product->media()->create([
            'type' => 'image',
            'path' => "products/{$product->id}/images/tile.jpg",
            'mime' => 'image/jpeg',
            'is_primary' => true,
            'sort' => 0,
        ]);

        $copy = app(ProductService::class)->duplicateProduct($product, $user);
        $copied = $copy->media()->firstOrFail();

        // A copy that shared the original's path would lose the original's
        // image the moment anyone deleted the duplicate, because
        // MediaService::deleteMedia() removes the file from disk.
        $this->assertNotSame("products/{$product->id}/images/tile.jpg", $copied->path);
        $this->assertTrue(Storage::disk('public')->exists($copied->path));
        $this->assertTrue(Storage::disk('public')->exists("products/{$product->id}/images/tile.jpg"));
        $this->assertTrue($copied->is_primary);
    }

    public function test_a_remote_image_url_is_referenced_rather_than_copied(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $product = $this->product();

        $product->media()->create([
            'type' => 'image',
            'path' => 'https://cdn.shopify.com/tile.jpg',
            'mime' => 'image/jpeg',
            'sort' => 0,
        ]);

        $copy = app(ProductService::class)->duplicateProduct($product, $user);

        $this->assertSame('https://cdn.shopify.com/tile.jpg', $copy->media()->firstOrFail()->path);
    }

    public function test_the_admin_route_redirects_to_the_new_product(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $product = $this->product();

        $this->actingAs($admin)
            ->post(route('admin.products.duplicate', $product->id))
            ->assertRedirect();

        $this->assertDatabaseHas('products', ['sku' => 'NTD2004-COPY']);
    }
}
