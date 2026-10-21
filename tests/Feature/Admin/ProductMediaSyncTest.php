<?php

namespace Tests\Feature\Admin;

use App\Domain\Catalog\Services\MediaService;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The product page shows the gallery, but the home strips, search, the cart
 * and related products read products.image_url. That column was only ever set
 * by the image imports, so a photo changed in the editor never reached them.
 */
class ProductMediaSyncTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_the_product_image_follows_the_primary_photo(): void
    {
        Storage::fake('public');
        $product = $this->product(['image_url' => '/storage/products/1/images/imported.webp']);
        $media = app(MediaService::class);

        [$first, $second] = $media->storeMedia($product, [
            UploadedFile::fake()->image('first.jpg', 400, 400),
            UploadedFile::fake()->image('second.jpg', 400, 400),
        ]);

        $this->assertSame($first->url, $product->fresh()->image_url);

        $media->setPrimary($second);
        $this->assertSame($second->url, $product->fresh()->image_url);

        // Deleting the primary promotes the next photo instead of leaving a
        // link to the file that was just deleted.
        $media->deleteMedia($second->fresh());
        $this->assertSame($first->url, $product->fresh()->image_url);
    }

    public function test_emptying_the_gallery_keeps_a_remote_image_it_never_held(): void
    {
        Storage::fake('public');
        $product = $this->product(['image_url' => 'https://cdn.shopify.com/s/files/tile.jpg']);
        $row = $product->media()->create([
            'type' => 'image',
            'path' => "products/{$product->id}/images/missing.jpg",
            'mime' => 'image/jpeg',
            'sort' => 0,
        ]);

        app(MediaService::class)->deleteMedia($row);

        $this->assertSame('https://cdn.shopify.com/s/files/tile.jpg', $product->fresh()->image_url);
    }
}
