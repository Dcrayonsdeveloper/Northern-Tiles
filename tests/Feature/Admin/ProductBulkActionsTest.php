<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductBulkActionsTest extends TestCase
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
            'status' => Product::STATUS_DRAFT,
            'is_active' => true,
        ], $overrides));
    }

    public function test_bulk_status_publishes_the_selected_products(): void
    {
        $a = $this->product('NTD1');
        $b = $this->product('NTD2');
        $untouched = $this->product('NTD3');

        $this->actingAs($this->admin())
            ->post(route('admin.products.bulk-status'), [
                'ids' => [$a->id, $b->id],
                'status' => 'published',
            ])
            ->assertRedirect(route('admin.products.index'));

        $this->assertSame(Product::STATUS_PUBLISHED, $a->fresh()->status);
        $this->assertSame(Product::STATUS_PUBLISHED, $b->fresh()->status);
        $this->assertNotNull($a->fresh()->published_at);
        $this->assertSame(Product::STATUS_DRAFT, $untouched->fresh()->status);
    }

    public function test_bulk_status_keeps_is_active_in_step_with_status(): void
    {
        // Product::booted() holds these two columns in lockstep on save, but a
        // mass update fires no model events. Without the controller setting it
        // too, drafting a published product left is_active true — and the
        // storefront gates on is_active in most places, so the product stayed
        // listed and sellable while the admin showed it as a draft.
        $product = $this->product('NTD1', ['status' => Product::STATUS_PUBLISHED, 'is_active' => true]);

        $this->actingAs($this->admin())
            ->post(route('admin.products.bulk-status'), [
                'ids' => [$product->id],
                'status' => 'draft',
            ]);

        $fresh = $product->fresh();
        $this->assertSame(Product::STATUS_DRAFT, $fresh->status);
        $this->assertFalse($fresh->is_active);
    }

    public function test_bulk_actions_accept_a_catalogue_sized_selection(): void
    {
        // "Select all" posts every matching id. Validating each with
        // exists:products,id meant one query per id; this is the guard that
        // the endpoint stays usable at that size.
        $ids = collect(range(1, 50))
            ->map(fn ($n) => $this->product("NTD{$n}")->id)
            ->all();

        $this->actingAs($this->admin())
            ->post(route('admin.products.bulk-status'), ['ids' => $ids, 'status' => 'published'])
            ->assertRedirect();

        $this->assertSame(50, Product::where('status', Product::STATUS_PUBLISHED)->count());
    }

    public function test_bulk_delete_removes_only_the_selected_products(): void
    {
        $a = $this->product('NTD1');
        $keep = $this->product('NTD2');

        $this->actingAs($this->admin())
            ->post(route('admin.products.bulk-delete'), ['ids' => [$a->id]])
            ->assertRedirect();

        $this->assertNull(Product::find($a->id));
        $this->assertNotNull(Product::find($keep->id));
    }
}
