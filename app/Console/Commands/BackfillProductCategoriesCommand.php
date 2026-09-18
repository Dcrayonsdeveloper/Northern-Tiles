<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Support\ProductNameMatcher;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Files a product under a category ONLY where it has none.
 *
 * Same contract as the price and SKU backfills: reads the catalogue not the
 * sheet, never creates a product, never touches one that is already filed,
 * writes nothing but the category.
 *
 * It will not create categories either. A sheet naming a category that does
 * not exist is reported, not acted on — the tree is a structure the client
 * specified deliberately, and inventing a branch to make a row fit would
 * quietly undo that.
 *
 * The sub-category is resolved under its stated root, not by name alone:
 * "Hybrid Flooring" exists under both Builder Range and Clearance/Specials,
 * and "Tiles" is both a root and a child of itself.
 */
class BackfillProductCategoriesCommand extends Command
{
    protected $signature = 'products:backfill-categories
                            {csv : CSV with Name, Root Category and Sub Category columns}
                            {--dry-run : Report what would change without writing}';

    protected $description = 'Set a category on products that have none, from a sheet export';

    public function handle(): int
    {
        $csv = (string) $this->argument('csv');

        if (! is_file($csv)) {
            $this->error("No such file: {$csv}");

            return self::FAILURE;
        }

        $sheet = $this->readSheet($csv);
        $this->info('sheet rows naming a category: ' . count($sheet));

        $unfiled = Product::query()
            ->whereNull('category_id')
            ->orderBy('id')
            ->get(['id', 'name', 'slug', 'category_id']);

        $this->line('');
        $this->info("products with no category: {$unfiled->count()}");

        [$roots, $children] = $this->categoryIndex();

        $toWrite    = [];
        $noRow      = [];
        $blank      = [];
        $unknownCat = [];

        foreach ($unfiled as $product) {
            $key  = ProductNameMatcher::key($product->name);
            $head = ProductNameMatcher::key(preg_split('/\s+[-–|]\s+/', $product->name)[0] ?? $product->name);

            $row = $sheet[$key] ?? $sheet[$head] ?? null;

            if ($row === null) {
                $noRow[] = $product;

                continue;
            }

            [$rootName, $subName] = $row;

            if ($rootName === '' && $subName === '') {
                $blank[] = $product;

                continue;
            }

            $rootId = $roots[ProductNameMatcher::key($rootName)] ?? null;

            if ($rootName !== '' && $rootId === null) {
                $unknownCat[] = "{$product->name}  → root \"{$rootName}\" does not exist";

                continue;
            }

            // A child is only valid under the root the sheet names for it.
            $categoryId = $rootId;
            $label = $rootName;

            if ($subName !== '') {
                $childId = $children[$rootId . '|' . ProductNameMatcher::key($subName)] ?? null;

                if ($childId === null) {
                    $unknownCat[] = "{$product->name}  → \"{$rootName} > {$subName}\" does not exist";

                    continue;
                }

                $categoryId = $childId;
                $label = "{$rootName} > {$subName}";
            }

            $toWrite[] = ['product' => $product, 'category_id' => $categoryId, 'label' => $label];
        }

        $this->line('');
        $this->info('would be filed        : ' . count($toWrite));
        $this->warn('no matching sheet row : ' . count($noRow));
        $this->warn('sheet row has no category : ' . count($blank));

        if ($unknownCat) {
            $this->error('category does not exist : ' . count($unknownCat) . '  — skipped, nothing created');

            foreach (array_slice($unknownCat, 0, 10) as $u) {
                $this->line("  ! {$u}");
            }
        }

        if ($toWrite) {
            $byLabel = [];

            foreach ($toWrite as $r) {
                $byLabel[$r['label']] = ($byLabel[$r['label']] ?? 0) + 1;
            }

            $this->line('');

            foreach ($byLabel as $label => $n) {
                $this->line(sprintf('  %-44s %d', $label, $n));
            }
        }

        foreach (array_slice($noRow, 0, 10) as $p) {
            $this->line('  ? not in sheet : ' . mb_strimwidth($p->name, 0, 60, '…'));
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

        DB::transaction(function () use ($toWrite) {
            foreach ($toWrite as $row) {
                DB::table('products')
                    ->where('id', $row['product']->id)
                    ->update(['category_id' => $row['category_id']]);

                // ShopController filters on either the belongsTo or the pivot,
                // so both are kept in step.
                DB::table('product_category')->updateOrInsert(
                    ['product_id' => $row['product']->id, 'category_id' => $row['category_id']],
                    [],
                );
            }
        });

        $this->line('');
        $this->info('Filed ' . count($toWrite) . ' product(s). Nothing else was modified.');

        return self::SUCCESS;
    }

    /**
     * @return array{0: array<string,int>, 1: array<string,int>}
     */
    private function categoryIndex(): array
    {
        $roots = [];
        $children = [];

        foreach (Category::all(['id', 'name', 'parent_id']) as $cat) {
            if ($cat->parent_id === null) {
                $roots[ProductNameMatcher::key($cat->name)] = $cat->id;
            }
        }

        foreach (Category::whereNotNull('parent_id')->get(['id', 'name', 'parent_id']) as $cat) {
            $children[$cat->parent_id . '|' . ProductNameMatcher::key($cat->name)] = $cat->id;
        }

        return [$roots, $children];
    }

    /**
     * @return array<string,array{0:string,1:string}> normalised name => [root, sub]
     */
    private function readSheet(string $path): array
    {
        $handle = fopen($path, 'r');
        $iName = $iRoot = $iSub = null;
        $out = [];

        while (($row = fgetcsv($handle)) !== false) {
            if ($iName === null) {
                foreach ($row as $i => $cell) {
                    $c = strtolower(trim((string) $cell));

                    if ($c === 'name' && $iName === null) $iName = $i;
                    if ($c === 'root category') $iRoot = $i;
                    if ($c === 'sub category') $iSub = $i;
                }

                if ($iName !== null && $iRoot !== null) {
                    continue;
                }

                $iName = $iRoot = $iSub = null;

                continue;
            }

            $name = trim((string) ($row[$iName] ?? ''));

            if ($name === '') {
                continue;
            }

            $out[ProductNameMatcher::key($name)] ??= [
                trim((string) ($row[$iRoot] ?? '')),
                $iSub === null ? '' : trim((string) ($row[$iSub] ?? '')),
            ];
        }

        fclose($handle);

        return $out;
    }
}
