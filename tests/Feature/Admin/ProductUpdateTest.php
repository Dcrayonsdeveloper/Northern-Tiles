<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Save on the product editor posts the whole form back, including values the
 * admin never touched. A stock count taken below zero by "Continue selling"
 * orders was one of them, and the request refused it — on a field the page
 * printed no error for — so the edit was simply lost: the new text stayed in
 * the editor and the old text stayed on the site.
 */
class ProductUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function product(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'name' => 'Ibla Tombolo Dark Lappato 600x1200',
            'slug' => 'ibla-tombolo-dark-lappato-600x1200',
            'sku' => 'NTD6042',
            'description' => '<p>Gives the tile a sophisticated, timeless finish.</p>',
            'price' => 180.00,
            'inventory_quantity' => 0,
            'inventory_policy' => 'continue',
            'status' => Product::STATUS_PUBLISHED,
            'is_active' => true,
        ], $overrides));
    }

    /** Edit.jsx submits every field, edited or not. */
    private function editorPayload(Product $product, array $changes = []): array
    {
        return array_merge([
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'description' => $product->description,
            'price' => $product->price,
            'inventory_quantity' => $product->inventory_quantity,
            'inventory_policy' => $product->inventory_policy,
            'status' => $product->status,
            'is_active' => $product->is_active,
            'category_ids' => [],
            'collection_ids' => [],
            'specifications' => [],
        ], $changes);
    }

    public function test_an_oversold_product_can_still_be_edited(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $product = $this->product(['inventory_quantity' => -19]);

        $this->actingAs($admin)
            ->put(route('admin.products.update', $product->id), $this->editorPayload($product, [
                'description' => '<p>Gives the tile a sophisticated, timeless finish testing.</p>',
            ]))
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.products.edit', $product));

        $product->refresh();
        $this->assertSame('<p>Gives the tile a sophisticated, timeless finish testing.</p>', $product->description);
        // The oversold count is kept as it was, not reset to satisfy a rule.
        $this->assertSame(-19, $product->inventory_quantity);
    }

    public function test_the_saved_edit_is_what_the_product_page_shows(): void
    {
        $this->withoutVite();
        $admin = User::factory()->create(['is_admin' => true]);
        $product = $this->product(['inventory_quantity' => -19]);

        $this->actingAs($admin)->put(route('admin.products.update', $product->id), $this->editorPayload($product, [
            'description' => '<p>Updated in admin.</p>',
        ]));

        $this->get(route('products.show', $product->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Storefront/Shop/Show')
                ->where('product.description', '<p>Updated in admin.</p>'));
    }

    public function test_saving_without_tags_leaves_the_products_tags_alone(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $product = $this->product();
        $product->syncProductTags([['name' => 'Feature Tile', 'confidence' => 0.92]], 'ai');

        // The editor has no tag field, so it sends no tags. Posting them back
        // as {id, name, source} objects is what used to fail validation for
        // every tagged product.
        $this->actingAs($admin)
            ->put(route('admin.products.update', $product->id), $this->editorPayload($product, ['name' => 'Renamed']))
            ->assertSessionHasNoErrors();

        $this->assertSame('Renamed', $product->fresh()->name);
        $tag = $product->productTags()->sole();
        $this->assertSame('Feature Tile', $tag->name);
        $this->assertSame('ai', $tag->pivot->source);
    }
}
