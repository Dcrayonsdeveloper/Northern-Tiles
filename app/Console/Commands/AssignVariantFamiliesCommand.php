<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\VariantFamily;
use App\Domain\Catalog\Support\ProductNameMatcher;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Files products into variant families from the range sheets.
 *
 * Touches nothing but variant_family_id and variant_family_position. No
 * product is created, deleted or otherwise edited, and no family is created:
 * a family named in the sheet that does not exist is reported, not invented,
 * because inventing one silently would hide a typo in the sheet.
 *
 * Products are resolved by SKU first — it is unique and unambiguous — falling
 * back to the same three-tier name matching the rest of the import uses, so a
 * row whose SKU was never loaded can still be placed by name.
 */
class AssignVariantFamiliesCommand extends Command
{
    protected $signature = 'catalog:assign-variant-families
                            {file : JSON array of {sku, name, family} rows}
                            {--dry-run : Report what would change without writing}';

    protected $description = 'Assign products to variant families from a sheet export';

    public function handle(): int
    {
        $path = $this->argument('file');

        if (! is_file($path)) {
            $this->error("No such file: {$path}");

            return self::FAILURE;
        }

        $rows = json_decode(file_get_contents($path), true);

        if (! is_array($rows)) {
            $this->error('File is not a JSON array.');

            return self::FAILURE;
        }

        // ── Family lookup, normalised so "Origin " and "origin" both land ──
        $families = [];
        foreach (VariantFamily::get(['id', 'name']) as $family) {
            $families[$this->norm($family->name)] = $family->id;
        }

        // ── SKU lookup ──
        $bySku = [];
        Product::query()->select(['id', 'sku'])->chunkById(500, function ($chunk) use (&$bySku) {
            foreach ($chunk as $product) {
                if ($product->sku) {
                    $bySku[$this->norm($product->sku)] ??= $product->id;
                }
            }
        });

        // ── Name lookup, same tiers as ProductNameMatcher ──
        $exact = [];
        $all = [];
        Product::query()->select(['id', 'name'])->chunkById(500, function ($chunk) use (&$exact, &$all) {
            foreach ($chunk as $product) {
                $key = ProductNameMatcher::key($product->name);
                $exact[$key] ??= $product->id;
                $head = preg_split('/\s+[-–|]\s+/', $product->name)[0] ?? $product->name;
                $exact[ProductNameMatcher::key($head)] ??= $product->id;
                $all[] = [
                    'id' => $product->id,
                    'key' => $key,
                    'tokens' => ProductNameMatcher::tokens($product->name),
                ];
            }
        });

        $plan = [];              // product_id => family_id
        $viaSku = 0;
        $viaName = 0;
        $missingFamilies = [];
        $unmatched = [];
        $ambiguous = [];
        $conflicts = [];

        foreach ($rows as $row) {
            $familyName = trim((string) ($row['family'] ?? ''));

            if ($familyName === '') {
                continue;   // blank column means "leave this product alone"
            }

            $familyId = $families[$this->norm($familyName)] ?? null;

            if (! $familyId) {
                $missingFamilies[$familyName][] = $row['name'] ?? $row['sku'] ?? '?';

                continue;
            }

            $productId = null;
            $sku = trim((string) ($row['sku'] ?? ''));

            if ($sku !== '' && isset($bySku[$this->norm($sku)])) {
                $productId = $bySku[$this->norm($sku)];
                $viaSku++;
            } else {
                $name = trim((string) ($row['name'] ?? ''));

                if ($name === '') {
                    $unmatched[] = $sku !== '' ? "(sku {$sku}, no name)" : '(blank row)';

                    continue;
                }

                $key = ProductNameMatcher::key($name);
                $bare = preg_replace('/REC$/', '', $key);

                if ($id = $exact[$key] ?? $exact[$bare] ?? null) {
                    $productId = $id;
                } else {
                    $hits = array_values(array_filter($all, fn ($p) => str_starts_with($p['key'], $bare)));

                    if (count($hits) === 1) {
                        $productId = $hits[0]['id'];
                    } elseif (count($hits) > 1) {
                        $ambiguous[] = $name . '  (' . count($hits) . ' candidates)';

                        continue;
                    } else {
                        $want = ProductNameMatcher::tokens($name);
                        $hits = array_values(array_filter($all, fn ($p) => ! array_diff($want, $p['tokens'])));

                        if (count($hits) === 1) {
                            $productId = $hits[0]['id'];
                        } elseif (count($hits) > 1) {
                            $ambiguous[] = $name . '  (' . count($hits) . ' candidates)';

                            continue;
                        } else {
                            $unmatched[] = $name . ($sku !== '' ? "  (sku {$sku})" : '');

                            continue;
                        }
                    }
                }

                $viaName++;
            }

            // The same product named twice under different families is a sheet
            // error; keep the first and say so rather than letting row order decide.
            if (isset($plan[$productId]) && $plan[$productId] !== $familyId) {
                $conflicts[] = ($row['name'] ?? $sku) . " — already filed under another family";

                continue;
            }

            $plan[$productId] = $familyId;
        }

        $this->info('Rows with a family named: ' . count(array_filter($rows, fn ($r) => trim((string) ($r['family'] ?? '')) !== '')));
        $this->info("Resolved by SKU:          {$viaSku}");
        $this->info("Resolved by name:         {$viaName}");
        $this->info('Products to assign:       ' . count($plan));

        $this->report('Families named in the sheet but not in the database', array_map(
            fn ($name, $items) => $name . ' (' . count($items) . ' products)',
            array_keys($missingFamilies),
            $missingFamilies,
        ));
        $this->report('Products in the sheet but not in the catalogue', $unmatched);
        $this->report('Ambiguous names (left alone)', $ambiguous);
        $this->report('Conflicting rows (left alone)', $conflicts);

        if ($this->option('dry-run')) {
            $this->warn('Dry run — nothing written.');

            return self::SUCCESS;
        }

        $productsBefore = Product::count();

        DB::transaction(function () use ($plan) {
            // Position within a family follows the sheet order, so the
            // storefront selector reads the way the range is listed.
            $seen = [];

            foreach ($plan as $productId => $familyId) {
                $position = $seen[$familyId] = ($seen[$familyId] ?? -1) + 1;

                Product::whereKey($productId)->update([
                    'variant_family_id' => $familyId,
                    'variant_family_position' => $position,
                ]);
            }
        });

        $productsAfter = Product::count();

        $this->newLine();
        $this->info('Products now in a family: ' . Product::whereNotNull('variant_family_id')->count());
        $this->info("Products in catalogue:    {$productsAfter}");

        if ($productsAfter !== $productsBefore) {
            $this->error("PRODUCT COUNT CHANGED ({$productsBefore} -> {$productsAfter}) — investigate.");

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function norm(string $value): string
    {
        return preg_replace('/[^A-Z0-9]/', '', strtoupper($value));
    }

    /** @param list<string> $items */
    private function report(string $title, array $items): void
    {
        if (! $items) {
            return;
        }

        $this->newLine();
        $this->warn("{$title}: " . count($items));

        foreach (array_slice($items, 0, 40) as $item) {
            $this->line('   - ' . $item);
        }

        if (count($items) > 40) {
            $this->line('   … and ' . (count($items) - 40) . ' more');
        }
    }
}
