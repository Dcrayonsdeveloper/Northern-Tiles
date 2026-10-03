<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductExportTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function product(string $sku, array $overrides = []): Product
    {
        return Product::create(array_merge([
            'name' => "Tile {$sku}",
            'slug' => strtolower($sku),
            'sku' => $sku,
            'price' => 38.00,
            'inventory_quantity' => 0,
            'inventory_policy' => 'continue',
            'status' => Product::STATUS_PUBLISHED,
            'is_active' => true,
        ], $overrides));
    }

    private function csv(): string
    {
        $response = $this->actingAs($this->admin())->get(route('admin.products.export'));
        $response->assertOk();

        return $response->streamedContent();
    }

    public function test_the_export_downloads_as_a_csv(): void
    {
        $this->product('NTD1');

        $response = $this->actingAs($this->admin())->get(route('admin.products.export'));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('.csv', $response->headers->get('Content-Disposition'));
    }

    public function test_it_opens_in_excel_as_utf8(): void
    {
        $this->product('NTD1', ['name' => 'Café Crème Matt']);

        $csv = $this->csv();

        // Without the byte order mark Excel falls back to the system codepage
        // and the accents come through as mojibake.
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString('Café Crème Matt', $csv);
    }

    public function test_every_product_is_included(): void
    {
        $this->product('NTD1');
        $this->product('NTD2');
        $this->product('NTD3', ['status' => Product::STATUS_DRAFT, 'is_active' => false]);

        $csv = $this->csv();

        // Drafts too: this is the catalogue, not the storefront.
        $this->assertStringContainsString('NTD1', $csv);
        $this->assertStringContainsString('NTD2', $csv);
        $this->assertStringContainsString('NTD3', $csv);
    }

    public function test_it_carries_the_fields_the_admin_screen_shows(): void
    {
        $category = Category::create(['name' => 'Adhesives', 'slug' => 'adhesives', 'is_active' => true]);
        $product = $this->product('NTD1', ['price' => 42.99, 'brand' => 'Ardex']);
        $product->categories()->attach($category->id);

        $csv = $this->csv();
        $header = explode("\n", $csv)[0];

        foreach (['sku', 'price', 'inventory_quantity', 'inventory_policy', 'available_on_site', 'categories', 'brand'] as $column) {
            $this->assertStringContainsString($column, $header);
        }

        $this->assertStringContainsString('42.99', $csv);
        $this->assertStringContainsString('Ardex', $csv);
        $this->assertStringContainsString('Adhesives', $csv);
    }

    public function test_specifications_are_flattened_into_their_own_columns(): void
    {
        $this->product('NTD1', ['specifications' => ['finish' => 'Polished', 'size_nominal' => '600x1200']]);

        $csv = $this->csv();
        $header = explode("\n", $csv)[0];

        // A single JSON blob cell is not something anyone can sort or filter.
        $this->assertStringContainsString('spec_finish', $header);
        $this->assertStringContainsString('spec_size_nominal', $header);
        $this->assertStringContainsString('Polished', $csv);
        $this->assertStringContainsString('600x1200', $csv);
    }

    public function test_availability_matches_what_the_storefront_shows(): void
    {
        // Zero on hand but set to continue selling — the catalogue's normal
        // state, and in stock as far as a customer is concerned.
        $this->product('SELLS', ['inventory_quantity' => 0, 'inventory_policy' => 'continue']);
        $this->product('STOPS', ['inventory_quantity' => 0, 'inventory_policy' => 'deny']);

        $rows = array_filter(explode("\n", $this->csv()));

        $sells = current(array_filter($rows, fn ($r) => str_contains($r, 'SELLS')));
        $stops = current(array_filter($rows, fn ($r) => str_contains($r, 'STOPS')));

        $this->assertStringContainsString('TRUE', $sells);
        $this->assertStringContainsString('FALSE', $stops);
    }

    public function test_posting_ids_exports_only_those_products(): void
    {
        $wanted = $this->product('NTD1');
        $this->product('NTD2');
        $this->product('NTD3');

        $response = $this->actingAs($this->admin())
            ->post(route('admin.products.export'), ['ids' => [$wanted->id]]);

        $response->assertOk();
        $csv = $response->streamedContent();

        $this->assertStringContainsString('NTD1', $csv);
        $this->assertStringNotContainsString('NTD2', $csv);
        $this->assertStringNotContainsString('NTD3', $csv);
        // Named apart so a selection and a full export do not collide in the
        // browser's Downloads folder.
        $this->assertStringContainsString('selection', $response->headers->get('Content-Disposition'));
    }

    public function test_posting_no_ids_exports_everything(): void
    {
        $this->product('NTD1');
        $this->product('NTD2');

        $response = $this->actingAs($this->admin())
            ->post(route('admin.products.export'), ['ids' => []]);

        $response->assertOk();
        $csv = $response->streamedContent();

        // An empty selection is the button's "nothing ticked" state, which
        // means the whole catalogue — not an empty file.
        $this->assertStringContainsString('NTD1', $csv);
        $this->assertStringContainsString('NTD2', $csv);
        $this->assertStringNotContainsString('selection', $response->headers->get('Content-Disposition'));
    }

    public function test_a_selection_export_only_carries_its_own_spec_columns(): void
    {
        $wanted = $this->product('NTD1', ['specifications' => ['finish' => 'Polished']]);
        $this->product('NTD2', ['specifications' => ['grip_rating' => 'P4']]);

        $csv = $this->actingAs($this->admin())
            ->post(route('admin.products.export'), ['ids' => [$wanted->id]])
            ->streamedContent();

        $header = explode("\n", $csv)[0];

        $this->assertStringContainsString('spec_finish', $header);
        $this->assertStringNotContainsString('spec_grip_rating', $header);
    }

    public function test_the_export_is_admin_only(): void
    {
        $this->product('NTD1');

        $this->actingAs(User::factory()->create(['is_admin' => false]))
            ->get(route('admin.products.export'))
            ->assertForbidden();
    }

    public function test_matching_ids_returns_every_product_the_filter_matches(): void
    {
        $a = $this->product('NTD1', ['brand' => 'Ardex']);
        $b = $this->product('NTD2', ['brand' => 'Ardex']);
        $other = $this->product('NTD3', ['brand' => 'Mapei']);

        $all = $this->actingAs($this->admin())
            ->getJson(route('admin.products.matching-ids'))
            ->assertOk()
            ->json('ids');

        $this->assertEqualsCanonicalizing([$a->id, $b->id, $other->id], $all);

        // Same filters as the list, so select-all cannot pick a different set
        // from the one on screen.
        $filtered = $this->actingAs($this->admin())
            ->getJson(route('admin.products.matching-ids', ['search' => 'Ardex']))
            ->assertOk()
            ->json('ids');

        $this->assertEqualsCanonicalizing([$a->id, $b->id], $filtered);
    }

    public function test_matching_ids_is_admin_only(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => false]))
            ->get(route('admin.products.matching-ids'))
            ->assertForbidden();
    }
}
