<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The product forms promised more than the products table could hold. A short
 * description of 256-500 characters passed validation and then broke the
 * insert, and so did a blank price on a NOT NULL column — both as a bare 500
 * on Save, with the admin's work lost and no hint of which field was at fault.
 */
class ProductSaveLimitsTest extends TestCase
{
    use RefreshDatabase;

    /** What Create.jsx sends for a product the admin has filled in. */
    private function createPayload(array $changes = []): array
    {
        return array_merge([
            'name' => 'Calacatta Gold Matt 600x1200',
            'description' => '<p>A warm white marble look.</p>',
            'price' => '68.00',
            'inventory_quantity' => 0,
            'inventory_policy' => 'deny',
            'status' => Product::STATUS_DRAFT,
            'is_active' => true,
        ], $changes);
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_a_short_description_as_long_as_the_form_allows_is_saved(): void
    {
        $summary = rtrim(str_repeat('Rectified porcelain with a soft matt finish. ', 11));   // 494 chars

        $this->actingAs($this->admin())
            ->post(route('admin.products.store'), $this->createPayload(['short_description' => $summary]))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertSame($summary, Product::sole()->short_description);
    }

    public function test_image_urls_as_long_as_the_form_allows_are_saved(): void
    {
        $url = 'https://cdn.example.com/tiles/' . str_repeat('a', 400) . '.jpg';

        $this->actingAs($this->admin())
            ->post(route('admin.products.store'), $this->createPayload(['lifestyle_image_url' => $url]))
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertSame($url, Product::sole()->lifestyle_image_url);
    }

    public function test_a_product_without_a_price_is_refused_with_a_message(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.products.store'), $this->createPayload(['price' => '']))
            ->assertSessionHasErrors('price');

        $this->assertSame(0, Product::count());
    }

    public function test_clearing_the_price_on_edit_is_refused_with_a_message(): void
    {
        $product = Product::create([
            'name' => 'Calacatta Gold Matt 600x1200',
            'slug' => 'calacatta-gold-matt-600x1200',
            'price' => 68.00,
            'status' => Product::STATUS_PUBLISHED,
            'is_active' => true,
        ]);

        $this->actingAs($this->admin())
            ->put(route('admin.products.update', $product->id), [
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => '',
            ])
            ->assertSessionHasErrors('price');

        $this->assertSame('68.00', $product->fresh()->price);
    }
}
