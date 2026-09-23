<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\VariantFamily;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Removes every variant family, leaving the products themselves untouched.
 *
 * products.variant_family_id is ON DELETE SET NULL, so deleting a family
 * unlinks its members rather than cascading into them — no product is ever
 * removed by this command. variant_family_position is reset separately
 * because the FK does not cover it, and a stale position on an unlinked
 * product is just noise.
 *
 * A JSON backup of every family and every membership is written before
 * anything is deleted, so the grouping can be rebuilt if it is wanted back.
 */
class RemoveVariantFamiliesCommand extends Command
{
    protected $signature = 'catalog:remove-variant-families
                            {--dry-run : Report what would be removed and write the backup, but delete nothing}';

    protected $description = 'Delete all variant families and unlink their products (products are kept)';

    public function handle(): int
    {
        $families = VariantFamily::orderBy('id')->get();
        $memberships = Product::whereNotNull('variant_family_id')
            ->orderBy('variant_family_id')
            ->orderBy('variant_family_position')
            ->get(['id', 'sku', 'name', 'variant_family_id', 'variant_family_position']);

        $productsBefore = Product::count();

        $this->info("Families:            {$families->count()}");
        $this->info("Linked products:     {$memberships->count()}");
        $this->info("Products in catalogue: {$productsBefore} (none of these are deleted)");

        if ($families->isEmpty() && $memberships->isEmpty()) {
            $this->info('Nothing to remove.');

            return self::SUCCESS;
        }

        $path = 'backups/variant-families-' . now()->format('Ymd-His') . '.json';
        Storage::disk('local')->put($path, json_encode([
            'taken_at' => now()->toIso8601String(),
            'families' => $families->map(fn (VariantFamily $f) => [
                'id' => $f->id,
                'name' => $f->name,
                'is_active' => $f->is_active,
                'position' => $f->position,
                'default_product_id' => $f->default_product_id,
            ])->all(),
            'memberships' => $memberships->map(fn (Product $p) => [
                'product_id' => $p->id,
                'sku' => $p->sku,
                'name' => $p->name,
                'variant_family_id' => $p->variant_family_id,
                'variant_family_position' => $p->variant_family_position,
            ])->all(),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

        $this->info('Backup written to: ' . Storage::disk('local')->path($path));

        if ($this->option('dry-run')) {
            $this->warn('Dry run — nothing deleted.');

            return self::SUCCESS;
        }

        DB::transaction(function () {
            // Unlink explicitly rather than relying on the FK, so the position
            // column is cleared in the same statement and the result does not
            // depend on the storage engine honouring SET NULL.
            Product::whereNotNull('variant_family_id')->update([
                'variant_family_id' => null,
                'variant_family_position' => 0,
            ]);

            Product::where('variant_family_position', '>', 0)->update(['variant_family_position' => 0]);

            VariantFamily::query()->delete();
        });

        $productsAfter = Product::count();

        $this->newLine();
        $this->info('Families remaining:  ' . VariantFamily::count());
        $this->info('Linked products:     ' . Product::whereNotNull('variant_family_id')->count());
        $this->info("Products in catalogue: {$productsAfter}");

        if ($productsAfter !== $productsBefore) {
            $this->error("PRODUCT COUNT CHANGED ({$productsBefore} -> {$productsAfter}) — investigate immediately.");

            return self::FAILURE;
        }

        $this->info('Done. Product count unchanged.');

        return self::SUCCESS;
    }
}
