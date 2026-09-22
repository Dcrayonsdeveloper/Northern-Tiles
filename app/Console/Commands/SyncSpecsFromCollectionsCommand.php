<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Makes a product's detail specs agree with the collections it is filed under.
 *
 * The storefront filters are collections (colour-white, space-bathroom, …)
 * while the product page prints specifications.colour / application_space /
 * finish and so on. The two were maintained separately and drifted, so a tile
 * could sit under the White swatch while its own page said something else.
 *
 * Collections win here — they are what the customer filtered on. A JSON backup
 * of every value this replaces is written first, because the spec values came
 * from the range sheets and are in places richer than the collection set.
 */
class SyncSpecsFromCollectionsCommand extends Command
{
    protected $signature = 'catalog:sync-specs-from-collections
                            {--dry-run : Show what would change, write nothing}
                            {--only= : Limit to one dimension (colour, space, size, material, finish, style)}';

    protected $description = 'Set product specification values from the collections the product belongs to';

    /** dimension => [collection handle prefix, specifications key] */
    private const DIMENSIONS = [
        'colour' => ['colour-', 'colour'],
        'space' => ['space-', 'application_space'],
        'size' => ['size-', 'size_nominal'],
        'material' => ['material-', 'material'],
        'finish' => ['finish-', 'finish'],
        'style' => ['style-', 'style'],
    ];

    public function handle(): int
    {
        $only = $this->option('only');
        $dimensions = $only
            ? array_intersect_key(self::DIMENSIONS, [$only => true])
            : self::DIMENSIONS;

        if (! $dimensions) {
            $this->error("Unknown dimension: {$only}");

            return self::FAILURE;
        }

        $changes = [];
        $backup = [];

        Product::has('collections')
            ->with('collections:id,title,handle')
            ->chunkById(200, function ($chunk) use ($dimensions, &$changes, &$backup) {
                foreach ($chunk as $product) {
                    $specs = is_array($product->specifications) ? $product->specifications : [];
                    $before = $specs;
                    $touched = false;

                    foreach ($dimensions as $dimension => [$prefix, $specKey]) {
                        $titles = $product->collections
                            ->filter(fn ($c) => str_starts_with((string) $c->handle, $prefix))
                            ->pluck('title')
                            ->sort()
                            ->values();

                        // No collection for this dimension means "not filed",
                        // not "clear it" — an untouched spec is left alone.
                        if ($titles->isEmpty()) {
                            continue;
                        }

                        $value = $titles->implode(' + ');

                        if (trim((string) ($specs[$specKey] ?? '')) === $value) {
                            continue;
                        }

                        $changes[] = [
                            'id' => $product->id,
                            'name' => $product->name,
                            'dimension' => $dimension,
                            'from' => (string) ($specs[$specKey] ?? ''),
                            'to' => $value,
                        ];

                        $specs[$specKey] = $value;
                        $touched = true;
                    }

                    if ($touched) {
                        $backup[$product->id] = $before;
                        $product->forceFill(['specifications' => $specs])->saveQuietly();
                    }
                }
            });

        $this->info('Products with collections: ' . Product::has('collections')->count());
        $this->info('Spec values changed:       ' . count($changes));

        foreach (array_slice($changes, 0, 15) as $c) {
            $this->line(sprintf('   %-32s %-9s "%s" -> "%s"',
                mb_substr($c['name'], 0, 32), $c['dimension'],
                mb_substr($c['from'], 0, 26), mb_substr($c['to'], 0, 34)));
        }

        if (count($changes) > 15) {
            $this->line('   … and ' . (count($changes) - 15) . ' more');
        }

        if ($this->option('dry-run')) {
            $this->warn('Dry run — nothing written.');

            return self::SUCCESS;
        }

        if ($backup) {
            $path = 'backups/product-specs-' . now()->format('Ymd-His') . '.json';
            Storage::disk('local')->put($path, json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            $this->info('Previous values backed up to: ' . Storage::disk('local')->path($path));
        }

        return self::SUCCESS;
    }
}
