<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\ProductMedia;
use App\Models\Product;
use Illuminate\Console\Command;

/**
 * Deletes product_media rows whose file is no longer on disk.
 *
 * The webp conversion wrote new files and new media rows but left the original
 * jpg rows behind, and those files are gone. Because the rows survive, anything
 * that reaches for a product's *first* image — the variant-family thumbnails on
 * the product page, the gallery strip — asks the browser for a file that 404s,
 * and the shopper sees alt text where a tile should be.
 *
 * `products.image_url` is not affected: it was repointed at the webp and is
 * valid catalogue-wide. Only the media rows are stale.
 *
 * A row is deleted only when the product keeps a working image afterwards —
 * either another media row that resolves, or a valid image_url. A product whose
 * every image is missing keeps its rows, because an empty gallery hides the
 * problem instead of fixing it, and those rows are the only record of what the
 * file used to be called.
 */
class PruneMissingProductMediaCommand extends Command
{
    protected $signature = 'media:prune-missing
                            {--dry-run : List what would be deleted without touching anything}
                            {--product= : Limit to one product id, for spot checks}';

    protected $description = 'Delete product media rows whose file is missing from storage';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $root   = storage_path('app/public');

        $resolves = function (?string $url) use ($root): bool {
            if (! $url || ! str_starts_with($url, '/storage/')) {
                return false;
            }

            // '/storage' is 8 characters; the '/' that follows is part of the
            // relative path and must survive, or every check is a false miss.
            return is_file($root . substr($url, strlen('/storage')));
        };

        $deletable = [];
        $strandedProducts = [];
        $scanned = 0;

        Product::query()
            ->when($this->option('product'), fn ($q, $id) => $q->whereKey($id))
            ->with(['media' => fn ($q) => $q->orderBy('sort')->orderBy('id')])
            ->select(['id', 'name', 'slug', 'image_url'])
            ->chunkById(300, function ($products) use (&$deletable, &$strandedProducts, &$scanned, $resolves) {
                foreach ($products as $product) {
                    $scanned++;

                    if ($product->media->isEmpty()) {
                        continue;
                    }

                    $dead = $product->media->reject(fn ($m) => $resolves($m->url));

                    if ($dead->isEmpty()) {
                        continue;
                    }

                    $survives = $product->media->count() - $dead->count() > 0
                        || $resolves($product->image_url);

                    if (! $survives) {
                        $strandedProducts[] = $product;

                        continue;
                    }

                    foreach ($dead as $m) {
                        $deletable[] = ['id' => $m->id, 'product' => $product->slug, 'url' => $m->url];
                    }
                }
            });

        $this->info("Scanned {$scanned} product(s).");

        if (! $deletable && ! $strandedProducts) {
            $this->info('Nothing to prune — every media row resolves to a file.');

            return self::SUCCESS;
        }

        $this->line('');
        $this->info(count($deletable) . ' media row(s) point at a file that is gone.');

        foreach (array_slice($deletable, 0, 15) as $row) {
            $this->line("  <fg=red>-</> {$row['product']}  {$row['url']}");
        }

        if (count($deletable) > 15) {
            $this->line('  … ' . (count($deletable) - 15) . ' more');
        }

        if ($strandedProducts) {
            $this->line('');
            $this->warn(count($strandedProducts) . ' product(s) have NO working image at all — left untouched:');

            foreach (array_slice($strandedProducts, 0, 10) as $p) {
                $this->line("  ! {$p->id}  {$p->slug}");
            }

            $this->line('  These need the image files restored, not rows deleted.');
        }

        if ($dryRun) {
            $this->line('');
            $this->info('[dry run] Nothing was written. Re-run without --dry-run to apply.');

            return self::SUCCESS;
        }

        if (! $deletable) {
            return self::SUCCESS;
        }

        $deleted = ProductMedia::whereIn('id', array_column($deletable, 'id'))->delete();

        $this->line('');
        $this->info("Deleted {$deleted} media row(s).");

        return self::SUCCESS;
    }
}
