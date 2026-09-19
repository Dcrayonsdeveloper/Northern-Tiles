<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Support\ProductNameMatcher;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Fills in a price ONLY where a product has none.
 *
 * Deliberately narrow, because a price is the one field where a wrong write is
 * both invisible and expensive:
 *
 *   - It reads the catalogue, not the sheet. Only products that already exist
 *     are considered; a sheet row with no product is ignored, never created.
 *   - It only ever looks at products whose price is null or <= 0. A product
 *     with a price is not read, not compared, not touched.
 *   - It writes nothing but `price`. Not the name, not the description, not
 *     the variant, not updated_at.
 *   - A sheet row with a blank or zero price is skipped rather than written as
 *     zero, which would be a no-op that still dirtied the row.
 *
 * Matching is exact on the normalised name, or on the part before the first
 * " - " where the catalogue appends marketing copy. No prefix or token
 * fallback: those tiers are right for filing a product under a category, where
 * a near-miss is visible and reversible, and wrong for money.
 */
class BackfillProductPricesCommand extends Command
{
    protected $signature = 'products:backfill-prices
                            {csv : CSV export of the sheet, with Name and Price columns}
                            {--name-col=Name : Header of the product name column}
                            {--price-col=Price : Header of the price column}
                            {--dry-run : Report what would change without writing}';

    protected $description = 'Set a price on products that have none, from a sheet export';

    public function handle(): int
    {
        $csv = (string) $this->argument('csv');

        if (! is_file($csv)) {
            $this->error("No such file: {$csv}");

            return self::FAILURE;
        }

        [$prices, $sheetRows] = $this->readSheet($csv);

        $this->info("sheet rows with a name: {$sheetRows}");
        $this->info('sheet rows with a usable price: ' . count($prices));

        $unpriced = Product::query()
            ->where(fn ($q) => $q->whereNull('price')->orWhere('price', '<=', 0))
            ->orderBy('id')
            ->get(['id', 'name', 'slug', 'price']);

        $this->line('');
        $this->info("products with no price: {$unpriced->count()}");

        $toWrite = [];
        $noRow   = [];
        $noPrice = [];

        foreach ($unpriced as $product) {
            $key  = ProductNameMatcher::key($product->name);
            $head = ProductNameMatcher::key(preg_split('/\s+[-–|]\s+/', $product->name)[0] ?? $product->name);

            $price = $prices[$key] ?? $prices[$head] ?? null;

            if ($price === null) {
                // Distinguish "not in the sheet" from "in the sheet with no
                // price" — they need different fixes.
                $noRow[] = $product;

                continue;
            }

            if ($price <= 0) {
                $noPrice[] = $product;

                continue;
            }

            $toWrite[] = ['product' => $product, 'price' => $price];
        }

        $this->line('');
        $this->info('would be priced      : ' . count($toWrite));
        $this->warn('no matching sheet row: ' . count($noRow));
        $this->warn('sheet row has no price: ' . count($noPrice));

        if ($toWrite) {
            $this->line('');
            $this->table(
                ['id', 'product', 'new price'],
                array_map(fn ($r) => [
                    $r['product']->id,
                    mb_strimwidth($r['product']->name, 0, 54, '…'),
                    number_format($r['price'], 2),
                ], $toWrite),
            );
        }

        foreach ($noRow as $p) {
            $this->line("  ? not in sheet : " . mb_strimwidth($p->name, 0, 60, '…'));
        }

        foreach ($noPrice as $p) {
            $this->line("  0 sheet blank  : " . mb_strimwidth($p->name, 0, 60, '…'));
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

        foreach ($toWrite as $row) {
            // Bare update, not save(): price is the only column that should
            // move, and touching updated_at on these rows would erase the
            // "recently changed" signal for no benefit.
            DB::table('products')->where('id', $row['product']->id)->update(['price' => $row['price']]);
        }

        $this->line('');
        $this->info('Priced ' . count($toWrite) . ' product(s). Nothing else was modified.');

        return self::SUCCESS;
    }

    /**
     * @return array{0: array<string,float>, 1: int}
     */
    private function readSheet(string $path): array
    {
        $nameCol  = strtolower(trim((string) $this->option('name-col')));
        $priceCol = strtolower(trim((string) $this->option('price-col')));

        $handle = fopen($path, 'r');
        $iName = $iPrice = null;
        $prices = [];
        $rows = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if ($iName === null) {
                foreach ($row as $i => $cell) {
                    $c = strtolower(trim((string) $cell));

                    if ($c === $nameCol && $iName === null) {
                        $iName = $i;
                    } elseif ($c === $priceCol && $iPrice === null) {
                        $iPrice = $i;
                    }
                }

                if ($iName !== null && $iPrice !== null) {
                    continue;
                }

                $iName = null;
                $iPrice = null;

                continue;
            }

            $name = trim((string) ($row[$iName] ?? ''));

            if ($name === '') {
                continue;
            }

            $rows++;

            $raw = trim((string) ($row[$iPrice] ?? ''));
            $raw = preg_replace('/[^0-9.\-]/', '', $raw);

            if ($raw === '' || ! is_numeric($raw)) {
                continue;
            }

            // First row wins: the sheet is ordered, and a later duplicate is a
            // duplicate, not a correction.
            $prices[ProductNameMatcher::key($name)] ??= (float) $raw;
        }

        fclose($handle);

        return [$prices, $rows];
    }
}
