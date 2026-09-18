<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\ProductMedia;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Attaches images from a folder of supplier photos to the products they belong to.
 *
 * The folders are named for a category ("Hybrid 7mm") and the files for a
 * product code plus a colour ("4404 Teak Oak.jpg"), which is enough to place
 * each one exactly — but only if the code is read within its folder's category.
 * The same code appears twice across the catalogue: "Hybrid 4404" is the plank
 * and "Quads 4404" is the matching trim, and a code-only match would put a
 * plank photo on a trim half the time.
 *
 * A product that already has an image is skipped and reported, never replaced.
 * Where the code finds nothing, the colour words in the filename are tried
 * against the names in that category, and accepted only when exactly one
 * product matches — the supplier's codes and the catalogue's disagree in
 * places, and a silent mismatch here puts the wrong tile on a product page.
 */
class ImportLocalProductImagesCommand extends Command
{
    protected $signature = 'products:import-local-images
                            {dir : Folder of sub-folders named for categories}
                            {--map=* : folder=category-slug, repeatable}
                            {--dry-run : Report the mapping without copying anything}';

    protected $description = 'Attach local image files to products, matching by code within a category';

    public function handle(): int
    {
        $dir = rtrim((string) $this->argument('dir'), '/');

        if (! is_dir($dir)) {
            $this->error("No such folder: {$dir}");

            return self::FAILURE;
        }

        $map = [];

        foreach ((array) $this->option('map') as $pair) {
            [$folder, $slug] = array_pad(explode('=', $pair, 2), 2, null);

            if ($folder && $slug) {
                $map[$folder] = $slug;
            }
        }

        $storage = storage_path('app/public');
        $resolves = fn (?string $u) => $u && str_starts_with($u, '/storage/')
            && is_file($storage . substr($u, strlen('/storage')));

        $planned = [];
        $already = [];
        $noMatch = [];
        $noCat   = [];

        foreach (glob($dir . '/*', GLOB_ONLYDIR) as $folderPath) {
            $folder = basename($folderPath);
            $slug = $map[$folder] ?? null;

            if (! $slug) {
                $noCat[] = $folder . '  (' . count(glob($folderPath . '/*.*')) . ' file(s)) — no --map given';

                continue;
            }

            $category = Category::where('slug', $slug)->first();

            if (! $category) {
                $noCat[] = "{$folder} → category '{$slug}' does not exist";

                continue;
            }

            $products = Product::with('media')
                ->where('category_id', $category->id)
                ->get(['id', 'name', 'sku', 'image_url']);

            foreach (glob($folderPath . '/*.*') as $file) {
                $base = pathinfo($file, PATHINFO_FILENAME);
                [$code, $words] = array_pad(preg_split('/\s+/', trim($base), 2), 2, '');

                $product = $products->first(
                    fn ($p) => strcasecmp(trim((string) Str::afterLast($p->sku ?? '', ' ')), $code) === 0
                );

                $how = 'code';

                if (! $product && $words !== '') {
                    // The colour words, against this category only.
                    $hits = $products->filter(
                        fn ($p) => str_contains(Str::upper($p->name), Str::upper(trim($words)))
                    );

                    if ($hits->count() === 1) {
                        $product = $hits->first();
                        $how = 'name (code ' . $code . ' not found)';
                    }
                }

                if (! $product) {
                    $noMatch[] = "{$folder}/" . basename($file);

                    continue;
                }

                $hasImage = $resolves($product->image_url)
                    || $product->media->contains(fn ($m) => $resolves($m->url));

                if ($hasImage) {
                    $already[] = "{$product->sku}  {$product->name}";

                    continue;
                }

                $planned[] = ['file' => $file, 'product' => $product, 'how' => $how];
            }
        }

        $this->info('to attach     : ' . count($planned));
        $this->warn('already imaged: ' . count($already));
        $this->warn('no product    : ' . count($noMatch));

        foreach ($planned as $p) {
            $this->line(sprintf('  + %-28s → %-34s [%s]',
                basename($p['file']), mb_strimwidth($p['product']->name, 0, 34, '…'), $p['how']));
        }

        foreach ($already as $a) {
            $this->line("  = already has an image: {$a}");
        }

        foreach ($noMatch as $n) {
            $this->line("  ? no product for: {$n}");
        }

        foreach ($noCat as $c) {
            $this->line("  ! {$c}");
        }

        if ($this->option('dry-run')) {
            $this->line('');
            $this->info('[dry run] Nothing was copied.');

            return self::SUCCESS;
        }

        $done = 0;

        foreach ($planned as $row) {
            $product = $row['product'];
            $ext = strtolower(pathinfo($row['file'], PATHINFO_EXTENSION));
            $rel = "products/{$product->id}/images/" . Str::uuid() . '.' . $ext;
            $dest = $storage . '/' . $rel;

            if (! is_dir(dirname($dest))) {
                mkdir(dirname($dest), 0775, true);
            }

            if (! copy($row['file'], $dest)) {
                $this->error('  failed to copy ' . basename($row['file']));

                continue;
            }

            $size = @getimagesize($dest) ?: [null, null];

            ProductMedia::create([
                'product_id'      => $product->id,
                'type'            => 'image',
                'path'            => $rel,
                'mime'            => $ext === 'png' ? 'image/png' : ($ext === 'webp' ? 'image/webp' : 'image/jpeg'),
                'file_size_bytes' => filesize($dest),
                'width'           => $size[0],
                'height'          => $size[1],
                'sort'            => 0,
                'is_primary'      => true,
            ]);

            // image_url is what the listings and the family selector read.
            DB::table('products')->where('id', $product->id)->update(['image_url' => '/storage/' . $rel]);

            $done++;
        }

        $this->line('');
        $this->info("Attached {$done} image(s).");

        return self::SUCCESS;
    }
}
