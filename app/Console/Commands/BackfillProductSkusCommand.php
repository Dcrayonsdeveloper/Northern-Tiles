<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Support\ProductNameMatcher;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Fills in a SKU ONLY where a product has none.
 *
 * Same narrow shape as products:backfill-prices — reads the catalogue not the
 * sheet, never creates a product, never touches one that already has a SKU,
 * writes nothing but `sku` — with one guard that prices did not need:
 *
 * products.sku carries a UNIQUE index. Writing a code that already belongs to
 * another product would throw, and worse, a partly-applied run would leave the
 * catalogue half-updated. So collisions are detected up front and skipped, and
 * the whole batch is only attempted once every row is known to be safe.
 *
 * Matching is exact on the normalised name, or on the part before the first
 * " - ". No prefix or token fallback: a SKU is how a warehouse picks stock, so
 * a near-miss here ships the wrong tile.
 */
class BackfillProductSkusCommand extends Command
{
    protected $signature = 'products:backfill-skus
                            {csv : CSV export of the sheet, with Name and SKU columns}
                            {--name-col=Name : Header of the product name column}
                            {--sku-col=SKU : Header of the SKU column}
                            {--dry-run : Report what would change without writing}';

    protected $description = 'Set a SKU on products that have none, from a sheet export';

    public function handle(): int
    {
        $csv = (string) $this->argument('csv');

        if (! is_file($csv)) {
            $this->error("No such file: {$csv}");

            return self::FAILURE;
        }

        [$skus, $sheetRows] = $this->readSheet($csv);

        $this->info("sheet rows with a name: {$sheetRows}");
        $this->info('sheet rows carrying a SKU: ' . count($skus));

        $missing = Product::query()
            ->where(fn ($q) => $q->whereNull('sku')->orWhere('sku', ''))
            ->orderBy('id')
            ->get(['id', 'name', 'slug', 'sku']);

        $this->line('');
        $this->info("products with no SKU: {$missing->count()}");

        // Every SKU already in use, so a collision is caught before any write.
        $taken = DB::table('products')
            ->whereNotNull('sku')->where('sku', '!=', '')
            ->pluck('id', 'sku')
            ->all();

        $toWrite   = [];
        $noRow     = [];
        $blank     = [];
        $collision = [];
        $seen      = [];

        foreach ($missing as $product) {
            $key  = ProductNameMatcher::key($product->name);
            $head = ProductNameMatcher::key(preg_split('/\s+[-–|]\s+/', $product->name)[0] ?? $product->name);

            $sku = $skus[$key] ?? $skus[$head] ?? null;

            if ($sku === null) {
                $noRow[] = $product;

                continue;
            }

            if ($sku === '') {
                $blank[] = $product;

                continue;
            }

            if (isset($taken[$sku])) {
                $collision[] = "{$product->name}  → {$sku} already on product {$taken[$sku]}";

                continue;
            }

            // Two unpriced products can map to the same sheet SKU if the sheet
            // repeats a code; the unique index would reject the second.
            if (isset($seen[$sku])) {
                $collision[] = "{$product->name}  → {$sku} also claimed by product {$seen[$sku]}";

                continue;
            }

            $seen[$sku] = $product->id;
            $toWrite[] = ['product' => $product, 'sku' => $sku];
        }

        $this->line('');
        $this->info('would get a SKU       : ' . count($toWrite));
        $this->warn('no matching sheet row : ' . count($noRow));
        $this->warn('sheet row has no SKU  : ' . count($blank));

        if ($collision) {
            $this->error('SKU already in use    : ' . count($collision) . '  — skipped');

            foreach ($collision as $c) {
                $this->line("  ! {$c}");
            }
        }

        if ($toWrite) {
            $this->line('');
            $this->table(
                ['id', 'product', 'new SKU'],
                array_map(fn ($r) => [
                    $r['product']->id,
                    mb_strimwidth($r['product']->name, 0, 52, '…'),
                    $r['sku'],
                ], array_slice($toWrite, 0, 30)),
            );

            if (count($toWrite) > 30) {
                $this->line('  … ' . (count($toWrite) - 30) . ' more');
            }
        }

        foreach (array_slice($noRow, 0, 15) as $p) {
            $this->line('  ? not in sheet : ' . mb_strimwidth($p->name, 0, 60, '…'));
        }

        if (count($noRow) > 15) {
            $this->line('  … ' . (count($noRow) - 15) . ' more not in sheet');
        }

        if ($this->option('dry-run')) {
            $this->line('');
            $this->info('[dry run] Nothing was written.');

            return self::SUCCESS;
        }

        if (! $toWrite) {
            $this->info('Nothing to do.');

            return self::SUCCESS;
        }

        // All or nothing: a unique-index rejection midway would otherwise leave
        // half the catalogue updated with no record of where it stopped.
        DB::transaction(function () use ($toWrite) {
            foreach ($toWrite as $row) {
                DB::table('products')->where('id', $row['product']->id)->update(['sku' => $row['sku']]);
            }
        });

        $this->line('');
        $this->info('Set a SKU on ' . count($toWrite) . ' product(s). Nothing else was modified.');

        return self::SUCCESS;
    }

    /**
     * @return array{0: array<string,string>, 1: int}
     */
    private function readSheet(string $path): array
    {
        $nameCol = strtolower(trim((string) $this->option('name-col')));
        $skuCol  = strtolower(trim((string) $this->option('sku-col')));

        $handle = fopen($path, 'r');
        $iName = $iSku = null;
        $skus = [];
        $rows = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if ($iName === null) {
                foreach ($row as $i => $cell) {
                    $c = strtolower(trim((string) $cell));

                    if ($c === $nameCol && $iName === null) {
                        $iName = $i;
                    } elseif ($c === $skuCol && $iSku === null) {
                        $iSku = $i;
                    }
                }

                if ($iName !== null && $iSku !== null) {
                    continue;
                }

                $iName = null;
                $iSku = null;

                continue;
            }

            $name = trim((string) ($row[$iName] ?? ''));

            if ($name === '') {
                continue;
            }

            $rows++;

            $skus[ProductNameMatcher::key($name)] ??= trim((string) ($row[$iSku] ?? ''));
        }

        fclose($handle);

        return [$skus, $rows];
    }
}
