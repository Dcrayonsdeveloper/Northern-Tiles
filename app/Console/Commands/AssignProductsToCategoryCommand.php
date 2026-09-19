<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Files the products named in a list under one category.
 *
 * The client supplies these lists as plain product names from their range
 * sheets, which never match the catalogue byte for byte: the database carries
 * marketing suffixes ("ARGILE ICE MATT 60X246MM - Premium Spanish Porcelain
 * Subway Tile - Handmade Texture Matt Finish"), the sheets write sizes as
 * 600*600 where the catalogue writes 600X600, and trailing "Rec." appears on
 * one side only.
 *
 * So matching is done on a normalised key — uppercase, separators stripped,
 * '*' folded to 'X' — against both the full name and the part before the first
 * " - ". Anything that does not match exactly is reported rather than guessed
 * at: a wrong category is worse than an unfiled product, and the unmatched list
 * is short enough to eyeball.
 *
 * Writes both products.category_id and the product_category pivot, because
 * ShopController filters on either.
 */
class AssignProductsToCategoryCommand extends Command
{
    protected $signature = 'products:assign-category
                            {file : File of product names, one per line}
                            {slug : Slug of the category to file them under}
                            {--dry-run : Report matches without writing}
                            {--show-unmatched : List every unmatched name, not just the first 15}';

    protected $description = 'Assign the products named in a file to a category';

    public function handle(): int
    {
        $file = (string) $this->argument('file');
        $slug = (string) $this->argument('slug');

        if (! is_file($file)) {
            $this->error("No such file: {$file}");

            return self::FAILURE;
        }

        $category = Category::where('slug', $slug)->first();

        if (! $category) {
            $this->error("No category with slug '{$slug}'.");

            return self::FAILURE;
        }

        $parent = $category->parent_id ? Category::find($category->parent_id) : null;
        $this->info("Target: " . ($parent ? "{$parent->name} > " : '') . "{$category->name}  (id {$category->id})");

        $names = collect(preg_split('/\R/', (string) file_get_contents($file)))
            ->map(fn ($n) => trim($n))
            ->filter()
            ->values();

        $this->line("names in list: {$names->count()}");

        // The catalogue appends its marketing copy in two different shapes —
        // "COCO WHITE GLOSS 50X150MM Subway Tile - Spanish Porcelain" and
        // "ALBA WHITE SATIN 600X600MM Marble Look Porcelain Tile" — so the
        // separator cannot be relied on. Every product is held by exact key,
        // by prefix, and by token set, and matching falls through those in
        // order of how much it has to assume.
        $exact = [];
        $all   = [];

        Product::query()->select(['id', 'name'])->chunkById(500, function ($chunk) use (&$exact, &$all) {
            foreach ($chunk as $p) {
                $key = $this->key($p->name);
                $exact[$key] ??= $p->id;
                $exact[$this->key(preg_split('/\s+[-–|]\s+/', $p->name)[0] ?? $p->name)] ??= $p->id;

                $all[] = ['id' => $p->id, 'key' => $key, 'tokens' => $this->tokens($p->name)];
            }
        });

        $matchedIds = [];
        $unmatched  = [];
        $ambiguous  = [];
        $byTier     = ['exact' => 0, 'prefix' => 0, 'tokens' => 0];

        foreach ($names as $name) {
            $key = $this->key($name);
            // Trailing "REC" is a finish note the catalogue does not always
            // carry.
            $bare = preg_replace('/REC$/', '', $key);

            $id = $exact[$key] ?? $exact[$bare] ?? null;

            if ($id) {
                $matchedIds[$id] = true;
                $byTier['exact']++;

                continue;
            }

            // The list name is the start of the catalogue name, the rest being
            // appended copy. Only accept it when exactly one product matches.
            $hits = array_values(array_filter($all, fn ($p) => str_starts_with($p['key'], $bare)));

            if (count($hits) === 1) {
                $matchedIds[$hits[0]['id']] = true;
                $byTier['prefix']++;

                continue;
            }

            if (count($hits) > 1) {
                $ambiguous[] = $name . '  (' . count($hits) . ' candidates)';

                continue;
            }

            // Last resort: every word of the list name appears in the product
            // name, with something extra in between — "TRAVERPRO EARTH 3D
            // CHISEL 600X1200X10MM" against "…3D CHISEL TR02C-D 600X1200X10MM",
            // where the catalogue carries a supplier code mid-name.
            $want = $this->tokens($name);
            $hits = array_values(array_filter($all, fn ($p) => ! array_diff($want, $p['tokens'])));

            if (count($hits) === 1) {
                $matchedIds[$hits[0]['id']] = true;
                $byTier['tokens']++;
            } elseif (count($hits) > 1) {
                $ambiguous[] = $name . '  (' . count($hits) . ' candidates)';
            } else {
                $unmatched[] = $name;
            }
        }

        $matchedIds = array_keys($matchedIds);

        $this->line('');
        $this->info('matched   : ' . count($matchedIds)
            . "  (exact {$byTier['exact']}, prefix {$byTier['prefix']}, tokens {$byTier['tokens']})");

        if ($ambiguous) {
            $this->warn('ambiguous : ' . count($ambiguous) . '  — skipped, more than one candidate');

            foreach (array_slice($ambiguous, 0, 10) as $a) {
                $this->line("  ~ {$a}");
            }
        }

        $this->warn('unmatched : ' . count($unmatched) . '  — no such product in the catalogue');

        if ($unmatched) {
            $limit = $this->option('show-unmatched') ? count($unmatched) : 15;

            foreach (array_slice($unmatched, 0, $limit) as $u) {
                $this->line("  ? {$u}");
            }

            if (count($unmatched) > $limit) {
                $this->line('  … ' . (count($unmatched) - $limit) . ' more (--show-unmatched for all)');
            }
        }

        if ($this->option('dry-run')) {
            $this->line('');
            $this->info('[dry run] Nothing was written.');

            return self::SUCCESS;
        }

        if (! $matchedIds) {
            return self::SUCCESS;
        }

        DB::transaction(function () use ($matchedIds, $category) {
            Product::whereIn('id', $matchedIds)->update(['category_id' => $category->id]);

            // Pivot rows are additive, so clear this category's existing links
            // for these products before inserting to avoid duplicates on a
            // re-run.
            DB::table('product_category')
                ->whereIn('product_id', $matchedIds)
                ->where('category_id', $category->id)
                ->delete();

            DB::table('product_category')->insert(
                array_map(fn ($id) => ['product_id' => $id, 'category_id' => $category->id], $matchedIds)
            );
        });

        $this->line('');
        $this->info('Filed ' . count($matchedIds) . " product(s) under {$category->name}.");

        return self::SUCCESS;
    }

    /**
     * Comparison key: case, spacing, punctuation and the '*'/'X' size separator
     * all differ between the client's sheets and the catalogue, and none of
     * them carry meaning.
     */
    private function key(string $s): string
    {
        $s = strtoupper($s);
        $s = str_replace('*', 'X', $s);

        return preg_replace('/[^A-Z0-9]/', '', $s);
    }

    /**
     * Word set for the last-resort match. Size tokens are kept — they are the
     * only thing separating one variant of a range from another.
     */
    private function tokens(string $s): array
    {
        $s = str_replace('*', 'X', strtoupper($s));
        $parts = preg_split('/[^A-Z0-9.]+/', $s, -1, PREG_SPLIT_NO_EMPTY);

        return array_values(array_unique($parts));
    }
}
