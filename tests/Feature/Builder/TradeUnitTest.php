<?php

namespace Tests\Feature\Builder;

use App\Domain\Builder\Models\BuilderProduct;
use App\Domain\Builder\Services\TradeUnitResolver;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * The trade portal printed "/ sqm" against every price, so a 20kg bag of grout
 * read as "$52.50 / sqm". Only tiles and flooring are sold by area.
 */
class TradeUnitTest extends TestCase
{
    use RefreshDatabase;

    /** No Product/Category factories exist in this app, so build the rows directly. */
    private function productInCategory(string $slug, array $attrs = []): Product
    {
        $category = Category::create(['slug' => $slug, 'name' => $slug]);

        $product = Product::create(array_merge([
            'name' => "Test {$slug} product",
            'slug' => $slug . '-test-product',
            'price' => 75.00,
            'category_id' => $category->id,
            'is_active' => true,
        ], $attrs));

        return $product->load('category');
    }

    #[DataProvider('perSquareMetreProvider')]
    public function test_tiles_and_flooring_are_priced_per_square_metre(string $slug): void
    {
        $product = $this->productInCategory($slug, ['sqm_per_box' => null]);

        $this->assertTrue(
            app(TradeUnitResolver::class)->isSoldPerSquareMetre($product),
            "{$slug} should be sold per m²",
        );
    }

    public static function perSquareMetreProvider(): array
    {
        return array_map(fn ($s) => [$s], [
            'porcelain', 'tiles', 'subway', 'external-porcelain', 'italian-porcelain',
            'terrazzo', 'decorative-tile', 'floor-wall-tile', 'wall-tile', 'outdoor-tile',
            'stone', 'marble', 'mosaics', 'ntd-tiles', 'sward-range', 'baltic-stone',
            'tundra', 'hybrid', 'hybrid-7mm', 'hybrid-herringbone', 'hybrid-tile',
            'hybrid-timber-oak-range', 'timber', 'engineered-timber', 'engineered-oak',
        ]);
    }

    #[DataProvider('perUnitProvider')]
    public function test_trade_supplies_are_not_priced_per_square_metre(string $slug): void
    {
        $product = $this->productInCategory($slug, ['sqm_per_box' => null]);

        $this->assertFalse(
            app(TradeUnitResolver::class)->isSoldPerSquareMetre($product),
            "{$slug} must NOT be sold per m²",
        );
    }

    public static function perUnitProvider(): array
    {
        return array_map(fn ($s) => [$s], [
            'ardex', 'mapei', 'soudal', 'durotech', 'grout', 'glue', 'silicone',
            'primer', 'spacers', 'sponge', 'drill-bits', 'efflock', 'ata-products',
            'soudal-silicone-caulks', 'waterproof', 'trade-products',
            // Contain a tile/floor keyword but are accessories sold per unit.
            'tile-crosses', 'tiling-waterproofing', 'levelling-clips',
            'levelling-system', 'quad', 'smart-waste',
        ]);
    }

    public function test_a_box_area_forces_per_square_metre_even_in_an_unknown_category(): void
    {
        $product = $this->productInCategory('some-new-range', ['sqm_per_box' => 1.44]);

        $this->assertTrue(app(TradeUnitResolver::class)->isSoldPerSquareMetre($product));
    }

    public function test_an_accessory_category_wins_over_a_stray_box_area(): void
    {
        $product = $this->productInCategory('tile-crosses', ['sqm_per_box' => 1.44]);

        $this->assertFalse(app(TradeUnitResolver::class)->isSoldPerSquareMetre($product));
    }

    public function test_the_trade_product_page_flags_a_grout_as_not_per_square_metre(): void
    {
        $builder = User::factory()->create([
            'is_builder' => true,
            'builder_approved_at' => now(),
            'is_active' => true,
        ]);

        $product = $this->productInCategory('ardex', ['sqm_per_box' => null, 'price' => 75.00]);
        BuilderProduct::create(['product_id' => $product->id, 'price' => 52.50, 'is_active' => true]);

        $this->actingAs($builder)
            ->get("/builder/products/{$product->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('product.is_sold_per_sqm', false)
                ->where('product.unit_label', null));
    }

    public function test_the_trade_product_page_flags_a_tile_as_per_square_metre(): void
    {
        $builder = User::factory()->create([
            'is_builder' => true,
            'builder_approved_at' => now(),
            'is_active' => true,
        ]);

        $product = $this->productInCategory('porcelain', ['sqm_per_box' => 1.44, 'price' => 75.00]);
        BuilderProduct::create(['product_id' => $product->id, 'price' => 52.50, 'is_active' => true]);

        $this->actingAs($builder)
            ->get("/builder/products/{$product->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('product.is_sold_per_sqm', true)
                ->where('product.unit_label', 'sqm'));
    }

    /**
     * The retail storefront must be completely unaware of this — it is trade-only
     * decoration and the public product payload should not carry it.
     */
    public function test_the_retail_storefront_payload_is_untouched(): void
    {
        $product = $this->productInCategory('porcelain', ['sqm_per_box' => 1.44]);

        $this->get("/products/{$product->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->missing('product.is_sold_per_sqm'));
    }
}
