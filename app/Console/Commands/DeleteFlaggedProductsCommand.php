<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Support\ProductNameMatcher;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Deletes the products named in a slug list, one slug per line.
 *
 * Product does not use SoftDeletes, so this is permanent. Everything the rows
 * touch is written to a JSON backup first — the product rows themselves, their
 * variants, their media and their category pivot entries — because "restore the
 * eight we did not mean to remove" is a request that arrives a week later, and
 * without that file the answer is no.
 *
 * order_items.product_id is nullOnDelete, so past orders keep their line items
 * but lose the link to the product. That is the one effect the backup cannot
 * undo, which is why the count of affected order lines is reported up front.
 */
class DeleteFlaggedProductsCommand extends Command
{
    protected $signature = 'products:delete-flagged
                            {file : Path to a file of slugs (or names, with --by=name), one per line}
                            {--by=slug : Match the file against product "slug" or "name"}
                            {--dry-run : Report what would go without deleting}
                            {--backup=/tmp : Directory for the pre-delete JSON backup}';

    protected $description = 'Delete the products listed in a slug or name file (permanent)';

    public function handle(): int
    {
        $file = (string) $this->argument('file');

        if (! is_file($file)) {
            $this->error("No such file: {$file}");

            return self::FAILURE;
        }

        $lines = collect(preg_split('/\R/', (string) file_get_contents($file)))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->unique()
            ->values();

        $byName = $this->option('by') === 'name';

        $this->info("{$lines->count()} " . ($byName ? 'name' : 'slug') . '(s) in the list.');

        if ($byName) {
            // Same matcher the assign command uses, so "this product" means the
            // same thing whether it is being filed or removed.
            $result = (new ProductNameMatcher())->resolve($lines);

            $products = Product::whereIn('id', $result['ids'])->get(['id', 'name', 'slug', 'sku', 'price']);

            $this->info('matched in the catalogue : ' . $products->count()
                . "  (exact {$result['tiers']['exact']}, prefix {$result['tiers']['prefix']}, tokens {$result['tiers']['tokens']})");

            if ($result['ambiguous']) {
                $this->warn('ambiguous — NOT deleted : ' . count($result['ambiguous']));

                foreach ($result['ambiguous'] as $a) {
                    $this->line("  ~ {$a}");
                }
            }

            if ($result['unmatched']) {
                $this->warn('not in the catalogue : ' . count($result['unmatched']));

                foreach (array_slice($result['unmatched'], 0, 15) as $u) {
                    $this->line("  ? {$u}");
                }

                if (count($result['unmatched']) > 15) {
                    $this->line('  … ' . (count($result['unmatched']) - 15) . ' more');
                }
            }
        } else {
            $products = Product::whereIn('slug', $lines)->get(['id', 'name', 'slug', 'sku', 'price']);
            $missing = $lines->diff($products->pluck('slug'));

            $this->info("matched in the catalogue : {$products->count()}");

            if ($missing->isNotEmpty()) {
                $this->warn("not found (already gone, or the slug differs) : {$missing->count()}");

                foreach ($missing->take(10) as $m) {
                    $this->line("  ? {$m}");
                }
            }
        }

        if ($products->isEmpty()) {
            return self::SUCCESS;
        }

        $ids = $products->pluck('id')->all();

        $orderLines = DB::table('order_items')->whereIn('product_id', $ids)->count();
        $variants   = DB::table('product_variants')->whereIn('product_id', $ids)->count();
        $media      = DB::table('product_media')->whereIn('product_id', $ids)->count();

        $this->line('');
        $this->line("  variants that go with them     : {$variants}");
        $this->line("  media rows that go with them   : {$media}");

        if ($orderLines > 0) {
            $this->warn("  order lines that lose their product link : {$orderLines}");
            $this->warn('  (order history survives; the line just stops pointing at a product)');
        }

        $this->line('');
        $this->line('first 10 to be deleted:');

        foreach ($products->take(10) as $p) {
            $this->line("  <fg=red>-</> {$p->slug}  ({$p->sku})");
        }

        if ($this->option('dry-run')) {
            $this->line('');
            $this->info('[dry run] Nothing was deleted. Re-run without --dry-run to apply.');

            return self::SUCCESS;
        }

        $backupDir = rtrim((string) $this->option('backup'), '/');
        $backupFile = $backupDir . '/products-deleted-' . date('Ymd-His') . '.json';

        file_put_contents($backupFile, json_encode([
            'deleted_at' => now()->toIso8601String(),
            'products'   => DB::table('products')->whereIn('id', $ids)->get(),
            'variants'   => DB::table('product_variants')->whereIn('product_id', $ids)->get(),
            'media'      => DB::table('product_media')->whereIn('product_id', $ids)->get(),
            'categories' => DB::table('product_category')->whereIn('product_id', $ids)->get(),
        ], JSON_PRETTY_PRINT));

        $this->info("backup written: {$backupFile}");

        $deleted = Product::whereIn('id', $ids)->delete();

        $this->info("Deleted {$deleted} product(s).");

        return self::SUCCESS;
    }
}
