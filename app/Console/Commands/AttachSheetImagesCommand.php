<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\ProductMedia;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Attaches images the client pasted into their audit sheet.
 *
 * Google Sheets keeps in-cell images as drawings anchored to a cell, which a
 * CSV export drops entirely — the column still reads "Yes"/"No". They survive
 * an xlsx export, where the anchor's column says which image it is: K is the
 * face photo, L the lifestyle shot. The manifest this consumes is built from
 * those anchors, so each file arrives already tied to a product id and a kind.
 *
 * Only fills gaps. A product that already has an image of that kind is
 * reported and skipped, never replaced — the sheet cannot say which of the two
 * is better, and overwriting a real photograph is not recoverable from here.
 *
 * The product's name is checked against the sheet row before anything is
 * written: an id column that has drifted by one row would otherwise put every
 * photograph on the wrong tile, silently.
 */
class AttachSheetImagesCommand extends Command
{
    protected $signature = 'products:attach-sheet-images
                            {manifest : JSON of {product_id, name, kind, file} entries}
                            {dir : Folder holding the extracted image files}
                            {--dry-run : Report what would happen without writing}';

    protected $description = 'Attach face and lifestyle images exported from the audit sheet';

    public function handle(): int
    {
        $manifestPath = (string) $this->argument('manifest');
        $dir = rtrim((string) $this->argument('dir'), '/');

        if (! is_file($manifestPath) || ! is_dir($dir)) {
            $this->error('manifest or image folder not found');

            return self::FAILURE;
        }

        $entries = json_decode((string) file_get_contents($manifestPath), true) ?: [];
        $this->info('manifest entries: ' . count($entries));

        $storage = storage_path('app/public');
        $resolves = fn (?string $u) => $u && str_starts_with($u, '/storage/')
            && is_file($storage . substr($u, strlen('/storage')));

        $planned = [];
        $alreadyHave = [];
        $nameMismatch = [];
        $missingProduct = [];
        $missingFile = [];

        foreach ($entries as $e) {
            $product = Product::with('media')->find($e['product_id']);

            if (! $product) {
                $missingProduct[] = "id {$e['product_id']}  {$e['name']}";

                continue;
            }

            // Guard against a shifted id column: compare the sheet's name with
            // the catalogue's, ignoring case and punctuation.
            $key = fn (string $s) => preg_replace('/[^a-z0-9]/', '', strtolower($s));

            if ($key($product->name) !== $key((string) $e['name'])) {
                $nameMismatch[] = "id {$e['product_id']}: sheet \"{$e['name']}\" vs catalogue \"{$product->name}\"";

                continue;
            }

            $path = $dir . '/' . $e['file'];

            if (! is_file($path)) {
                $missingFile[] = $e['file'];

                continue;
            }

            $has = $e['kind'] === 'face'
                ? ($resolves($product->image_url) || $product->media->contains(fn ($m) => $resolves($m->url)))
                : $resolves($product->lifestyle_image_url);

            if ($has) {
                $alreadyHave[] = "{$product->name}  ({$e['kind']})";

                continue;
            }

            $planned[] = ['product' => $product, 'kind' => $e['kind'], 'path' => $path];
        }

        $faces = count(array_filter($planned, fn ($p) => $p['kind'] === 'face'));
        $lifes = count($planned) - $faces;

        $this->line('');
        $this->info("to attach        : " . count($planned) . "  ({$faces} face, {$lifes} lifestyle)");
        $this->warn('already has one  : ' . count($alreadyHave));
        $this->warn('name mismatch    : ' . count($nameMismatch));
        $this->warn('product not found: ' . count($missingProduct));
        $this->warn('file not found   : ' . count($missingFile));

        foreach ($alreadyHave as $a) {
            $this->line("  = already has an image: {$a}");
        }

        foreach ($nameMismatch as $n) {
            $this->line("  ! {$n}");
        }

        foreach ($missingProduct as $m) {
            $this->line("  ? no such product: {$m}");
        }

        if ($this->option('dry-run')) {
            $this->line('');
            $this->info('[dry run] Nothing was written.');

            return self::SUCCESS;
        }

        $done = 0;

        foreach ($planned as $row) {
            $product = $row['product'];
            $ext = strtolower(pathinfo($row['path'], PATHINFO_EXTENSION)) ?: 'jpg';
            $rel = "products/{$product->id}/images/" . Str::uuid() . '.' . $ext;
            $dest = $storage . '/' . $rel;

            if (! is_dir(dirname($dest))) {
                mkdir(dirname($dest), 0775, true);
            }

            if (! copy($row['path'], $dest)) {
                $this->error('  copy failed: ' . basename($row['path']));

                continue;
            }

            $url = '/storage/' . $rel;

            if ($row['kind'] === 'face') {
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

                DB::table('products')->where('id', $product->id)->update(['image_url' => $url]);
            } else {
                DB::table('products')->where('id', $product->id)->update(['lifestyle_image_url' => $url]);
            }

            $done++;
        }

        $this->line('');
        $this->info("Attached {$done} image(s). Nothing else was modified.");

        return self::SUCCESS;
    }
}
