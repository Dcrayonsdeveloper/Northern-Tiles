<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

class FixProductInventoryCommand extends Command
{
    protected $signature = 'ntd:fix-inventory
                            {--dry-run : Preview changes without writing to the database}
                            {--verbose : List every product that will be updated}';

    protected $description = 'Set inventory_quantity = 100 for all priced products that currently have zero stock.
                              Products with price <= 0 are intentionally left out-of-stock.';

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        // ── Products that WILL be updated ─────────────────────────────────────
        // Criteria: price > 0 AND inventory_quantity = 0
        $toUpdate = Product::where('price', '>', 0)
            ->where('inventory_quantity', 0)
            ->select('id', 'name', 'price', 'inventory_quantity', 'sku')
            ->get();

        // ── Products intentionally left OOS (price = 0) ───────────────────────
        $zeroPriceCount = Product::where('price', '<=', 0)->count();

        // ── Products already in stock (no action needed) ──────────────────────
        $alreadyInStockCount = Product::where('price', '>', 0)
            ->where('inventory_quantity', '>', 0)
            ->count();

        $this->newLine();
        $this->line('  <options=bold>ntd:fix-inventory</>');
        $this->line('  ' . str_repeat('─', 44));
        $this->line(sprintf('  Products to update  (price > 0, stock = 0) : <fg=yellow;options=bold>%d</>', $toUpdate->count()));
        $this->line(sprintf('  Already in stock    (price > 0, stock > 0) : <fg=green>%d</>', $alreadyInStockCount));
        $this->line(sprintf('  Zero-price products (skipped, kept OOS)    : <fg=gray>%d</>', $zeroPriceCount));
        $this->newLine();

        if ($toUpdate->isEmpty()) {
            $this->info('  ✓ Nothing to do — all priced products already have stock.');
            $this->newLine();
            return self::SUCCESS;
        }

        if ($this->option('verbose')) {
            $this->table(
                ['ID', 'SKU', 'Name', 'Price', 'Stock → New Stock'],
                $toUpdate->map(fn ($p) => [
                    $p->id,
                    $p->sku ?? '—',
                    str($p->name)->limit(45),
                    '$' . number_format($p->price, 2),
                    '0 → 100',
                ])->all()
            );
        }

        if ($isDryRun) {
            $this->warn('  [DRY RUN] No changes written. Remove --dry-run to apply.');
            $this->newLine();
            return self::SUCCESS;
        }

        // ── Bulk update (single SQL statement) ────────────────────────────────
        $updated = Product::where('price', '>', 0)
            ->where('inventory_quantity', 0)
            ->update(['inventory_quantity' => 100]);

        $this->info("  ✓ Updated {$updated} product(s) — inventory_quantity set to 100.");
        $this->newLine();

        return self::SUCCESS;
    }
}
