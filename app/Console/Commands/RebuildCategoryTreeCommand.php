<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Replaces the whole category tree with the client's specified structure.
 *
 * The catalogue had grown 71 categories, 57 of them top-level, with
 * near-duplicates ("Tile" / "Tiles" / "wall tiles" / "Wall Tile") and only one
 * child category that held any products. This resets it to the seven roots the
 * client asked for and the children under each.
 *
 * Products are detached first, on purpose: every product's category_id is
 * cleared and the product_category pivot emptied, so the catalogue starts
 * uncategorised and can be re-assigned against the new tree. Nothing about the
 * products themselves changes.
 *
 * Slugs are preserved from the old tree wherever the name survives
 * (builders-range, external-porcelain, hybrid-8-5mm…) so existing links and
 * the /shop?category= URLs keep resolving.
 *
 * Everything removed is written to JSON first. products.category_id is
 * SET NULL on delete at the database level, so without that file the old
 * assignment of 1,024 products cannot be reconstructed.
 */
class RebuildCategoryTreeCommand extends Command
{
    protected $signature = 'catalog:rebuild-categories
                            {--dry-run : Report what would change without writing}
                            {--backup=/tmp : Directory for the pre-change JSON backup}';

    protected $description = 'Wipe the category tree and rebuild it to the specified structure';

    /**
     * The tree, in display order: root => [name, slug, children[name => slug]].
     *
     * Two names are corrected from the brief, which carried obvious typos and
     * disagreed with the live navigation: "Hybrid 95mm" -> "Hybrid 9.5mm" and
     * "Hybrid Tille Look" -> "Hybrid Tile Look".
     *
     * "Timber Oak Range" is deliberately absent — the brief marked it remove.
     */
    private const TREE = [
        ['Hybrid', 'hybrid', [
            'Herringbone 7mm'     => 'herringbone-7mm',
            'Hybrid Tiles'        => 'hybrid-tiles',
            'Hybrid 7mm'          => 'hybrid-7mm',
            'Hybrid 8.5mm'        => 'hybrid-8-5mm',
            'Hybrid 9.5mm'        => 'hybrid-9-5mm',
            'Hybrid Tile Look'    => 'hybrid-tile-look',
            'Hybrid Herringbone'  => 'hybrid-herringbone',
            'Quads/Scotia'        => 'quads-scotia',
        ]],
        ['Timber', 'timber', [
            'Engineered Timber' => 'engineered-timber',
        ]],
        ['Stone', 'stone', []],
        ['Builder Range', 'builders-range', [
            'Hybrid Flooring'     => 'builders-hybrid-flooring',
            'Subway Tiles'        => 'builders-subway-tiles',
            'Indoor Tiles'        => 'builders-indoor-tiles',
            'Outdoor Tiles'       => 'builders-outdoor-tiles',
            'Engineered Flooring' => 'builders-engineered-flooring',
        ]],
        ['Clearance/Specials', 'clearance-specials', [
            'Hybrid Flooring'     => 'clearance-hybrid-flooring',
            'Subway Tiles'        => 'clearance-subway-tiles',
            'Indoor Tiles'        => 'clearance-indoor-tiles',
            'Outdoor Tiles'       => 'clearance-outdoor-tiles',
            'Engineered Flooring' => 'clearance-engineered-flooring',
        ]],
        ['Tiles', 'tiles', [
            'Subway'                     => 'subway',
            '20mm & 10mm External Tiles' => 'external-porcelain',
            'Decorative Tiles'           => 'decorative-tiles',
            'Mosaic'                     => 'mosaic',
            // The root is 'tiles'; slugs are unique, so the child that repeats
            // the name needs its own.
            'Tiles'                      => 'tiles-general',
        ]],
        ['Trade', 'trade', [
            'Grout & Supplies'  => 'grout-supplies',
            'Silicone'          => 'silicone',
            'Waterproofing'     => 'waterproofing',
            'Trims'             => 'trims',
            'Adhesives'         => 'adhesives',
            'Levelling Systems' => 'levelling-systems',
            'Drains'            => 'drains',
            'Other'             => 'trade-other',
        ]],
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $existing   = DB::table('categories')->count();
        $assigned   = DB::table('products')->whereNotNull('category_id')->count();
        $pivotRows  = DB::table('product_category')->count();

        $roots = count(self::TREE);
        $children = array_sum(array_map(fn ($r) => count($r[2]), self::TREE));

        $this->info('Current:');
        $this->line("  categories                 : {$existing}");
        $this->line("  products with a category   : {$assigned}");
        $this->line("  product_category pivot rows: {$pivotRows}");
        $this->line('');
        $this->info('After:');
        $this->line("  categories                 : " . ($roots + $children) . " ({$roots} roots, {$children} children)");
        $this->line('  products with a category   : 0   <- every product detached');
        $this->line('  product_category pivot rows: 0');

        $this->line('');
        foreach (self::TREE as [$name, $slug, $kids]) {
            $this->line("  <fg=cyan>{$name}</> ({$slug})");
            foreach ($kids as $kidName => $kidSlug) {
                $this->line("      {$kidName}  ({$kidSlug})");
            }
        }

        if ($dryRun) {
            $this->line('');
            $this->info('[dry run] Nothing was written. Re-run without --dry-run to apply.');

            return self::SUCCESS;
        }

        $backupDir  = rtrim((string) $this->option('backup'), '/');
        $backupFile = $backupDir . '/categories-rebuild-' . date('Ymd-His') . '.json';

        file_put_contents($backupFile, json_encode([
            'taken_at'           => now()->toIso8601String(),
            'categories'         => DB::table('categories')->get(),
            'product_category'   => DB::table('product_category')->get(),
            // The only record of which product sat in which category, since the
            // FK clears it on delete.
            'product_assignment' => DB::table('products')
                ->whereNotNull('category_id')
                ->get(['id', 'slug', 'category_id']),
        ], JSON_PRETTY_PRINT));

        $this->info("backup written: {$backupFile}");

        DB::transaction(function () {
            // Detach first. Relying on the FK's SET NULL would work, but doing
            // it explicitly keeps the intent visible and the pivot cleared.
            DB::table('products')->whereNotNull('category_id')->update(['category_id' => null]);
            DB::table('product_category')->delete();

            // Children before parents: parent_id has no cascade.
            DB::table('categories')->whereNotNull('parent_id')->delete();
            DB::table('categories')->delete();

            $rootSort = 0;

            foreach (self::TREE as [$name, $slug, $kids]) {
                $rootSort += 10;

                $parentId = DB::table('categories')->insertGetId([
                    'name'       => $name,
                    'slug'       => $slug,
                    'parent_id'  => null,
                    'sort'       => $rootSort,
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $kidSort = 0;

                foreach ($kids as $kidName => $kidSlug) {
                    $kidSort += 10;

                    DB::table('categories')->insert([
                        'name'       => $kidName,
                        'slug'       => $kidSlug,
                        'parent_id'  => $parentId,
                        'sort'       => $kidSort,
                        'is_active'  => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });

        $this->line('');
        $this->info('Rebuilt: ' . DB::table('categories')->count() . ' categories, '
            . DB::table('categories')->whereNull('parent_id')->count() . ' of them roots.');
        $this->warn('Every product is now uncategorised. Assign them against the new tree before the category pages will show anything.');

        return self::SUCCESS;
    }
}
