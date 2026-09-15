<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

/**
 * Fills empty product descriptions with the product's own name.
 *
 * A stopgap, not copywriting: a description that only repeats the name adds
 * no information for a shopper and nothing for search. It exists so pages
 * stop rendering an empty description block until the real copy arrives with
 * the product sheet. Because of that, this only ever writes to rows that are
 * empty — it will not overwrite a real description without --force.
 */
class BackfillProductDescriptionsCommand extends Command
{
    protected $signature = 'products:backfill-descriptions
                            {--field=description : Which column to fill (description, short_description, meta_description)}
                            {--force : Also overwrite rows that already have a value}
                            {--dry-run : Report what would change without writing}';

    protected $description = "Fill empty product descriptions with the product's name";

    private const ALLOWED = ['description', 'short_description', 'meta_description'];

    public function handle(): int
    {
        $field = (string) $this->option('field');

        if (! in_array($field, self::ALLOWED, true)) {
            $this->error("--field must be one of: " . implode(', ', self::ALLOWED));

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $force  = (bool) $this->option('force');

        $query = Product::query()->whereNotNull('name')->where('name', '!=', '');

        if (! $force) {
            $query->where(fn ($q) => $q->whereNull($field)->orWhere($field, ''));
        }

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info("Nothing to do — no products with an empty {$field}.");

            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[dry run] ' : '') . "Filling {$field} on {$total} product(s) with their name.");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $updated = 0;

        // chunkById, not chunk: the where() clause stops matching as rows are
        // written, which makes an offset-based chunk skip half the set.
        $query->select(['id', 'name', $field])->chunkById(200, function ($products) use ($field, $dryRun, &$updated, $bar) {
            foreach ($products as $product) {
                $name = trim((string) $product->name);

                if ($name === '' || trim((string) $product->{$field}) === $name) {
                    $bar->advance();

                    continue;
                }

                if (! $dryRun) {
                    // Not save(): touching updated_at on 571 rows would erase
                    // any real "recently changed" signal for no benefit.
                    Product::query()->whereKey($product->id)->update([$field => $name]);
                }

                $updated++;
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->info($dryRun
            ? "[dry run] {$updated} product(s) would be updated. Re-run without --dry-run to apply."
            : "Updated {$updated} product(s).");

        return self::SUCCESS;
    }
}
