<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\ProductMedia;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Attaches the product photography that lives inside the NTD Google Sheet.
 *
 * The Face Image / Lifestyle Image columns hold in-cell images, which CSV
 * export drops entirely — that is why every sheet-imported product landed
 * without a picture. Exporting the workbook as .xlsx keeps them as anchored
 * drawings, so they can be lifted out and matched back to their row's SKU.
 *
 * This command consumes a staging directory of files named
 * `<SKU>__<face|life>__<n>.<ext>` and, for each one:
 *   - converts to WebP (falling back to the source when that is larger),
 *   - stores it as products/{id}/images/{uuid}.webp,
 *   - records a product_media row,
 *   - points image_url / lifestyle_image_url at it.
 *
 * Empty slots are filled by default; --overwrite is required to replace a
 * picture a product already has. Re-running without --overwrite is a no-op.
 */
class ImportSheetImagesCommand extends Command
{
    protected $signature = 'ntd:import-sheet-images
                            {--dir= : Directory of <SKU>__<slot>__<n>.<ext> files}
                            {--by-id : Treat the filename key as a product id rather than a SKU}
                            {--dry-run : Report what would change without writing anything}
                            {--overwrite : Replace images products already have}
                            {--quality=82 : WebP quality (1-100)}
                            {--limit=0 : Only process this many products (0 = all)}';

    protected $description = 'Attach Face/Lifestyle images extracted from the NTD sheet workbook to their products.';

    private const SLOTS = ['face' => 'image_url', 'life' => 'lifestyle_image_url'];

    private array $stats = ['files' => 0, 'products' => 0, 'attached' => 0, 'skipped_has_image' => 0,
                            'no_product' => 0, 'failed' => 0, 'bytes_before' => 0, 'bytes_after' => 0];

    private array $unmatched = [];

    public function handle(): int
    {
        if (! function_exists('imagewebp')) {
            $this->error('PHP GD has no WebP support on this machine — cannot convert.');

            return self::FAILURE;
        }

        $dir = rtrim((string) $this->option('dir'), '/\\');
        if ($dir === '' || ! is_dir($dir)) {
            $this->error('Pass --dir=<staging directory>.');

            return self::FAILURE;
        }

        $dry = (bool) $this->option('dry-run');
        $overwrite = (bool) $this->option('overwrite');
        $quality = max(1, min(100, (int) $this->option('quality')));
        $limit = max(0, (int) $this->option('limit'));

        // Group the staging files by SKU so each product is handled once.
        $bySku = [];
        foreach (glob($dir . '/*') as $path) {
            if (! is_file($path)) {
                continue;
            }
            if (! preg_match('/^(.+?)__(face|life)__(\d+)\.[A-Za-z0-9]+$/', basename($path), $m)) {
                continue;
            }
            $bySku[strtoupper($m[1])][$m[2]][(int) $m[3]] = $path;
            $this->stats['files']++;
        }
        ksort($bySku);

        $this->info(sprintf('%s%d image file(s) across %d SKU(s) in %s',
            $dry ? '[DRY RUN] ' : '', $this->stats['files'], count($bySku), $dir));

        // Hybrid and accessory lines carry no SKU at all, so those runs address
        // products by id instead; the file naming is otherwise identical.
        $products = $this->option('by-id')
            ? Product::get(['id', 'name', 'sku', 'image_url', 'lifestyle_image_url'])
                ->keyBy(fn ($p) => (string) $p->id)
            : Product::whereNotNull('sku')->where('sku', '!=', '')
                ->get(['id', 'name', 'sku', 'image_url', 'lifestyle_image_url'])
                ->keyBy(fn ($p) => strtoupper(trim($p->sku)));

        $done = 0;
        foreach ($bySku as $sku => $slots) {
            if ($limit > 0 && $done >= $limit) {
                break;
            }

            $product = $products->get($sku);
            if (! $product) {
                $this->stats['no_product']++;
                $this->unmatched[] = $sku;

                continue;
            }

            if ($this->attach($product, $slots, $quality, $overwrite, $dry)) {
                $this->stats['products']++;
                $done++;
            }
        }

        $this->report($dry);

        return self::SUCCESS;
    }

    private function attach(Product $product, array $slots, int $quality, bool $overwrite, bool $dry): bool
    {
        $touched = false;

        foreach (self::SLOTS as $slot => $column) {
            if (empty($slots[$slot])) {
                continue;
            }

            $existing = trim((string) $product->{$column});
            if ($existing !== '' && ! $overwrite) {
                $this->stats['skipped_has_image']++;

                continue;
            }

            ksort($slots[$slot]);
            $path = reset($slots[$slot]);          // first image wins the column
            $source = @file_get_contents($path);

            if ($source === false || $source === '') {
                $this->stats['failed']++;

                continue;
            }

            [$bytes, $ext, $mime] = $this->toWebp($source, $path, $quality);
            if ($bytes === null) {
                $this->stats['failed']++;
                $this->warn(sprintf('  cannot decode %s (%s)', basename($path), $product->sku));

                continue;
            }

            $this->stats['bytes_before'] += strlen($source);
            $this->stats['bytes_after'] += strlen($bytes);

            $this->line(sprintf('  %-10s %-4s %7s → %7s  %s',
                $product->sku, $slot, $this->human(strlen($source)), $this->human(strlen($bytes)),
                Str::limit($product->name, 38)));

            if ($dry) {
                $touched = true;

                continue;
            }

            $stored = sprintf('products/%d/images/%s.%s', $product->id, Str::uuid(), $ext);
            Storage::disk('public')->put($stored, $bytes);

            // Never point a row at a file that is not confirmed on disk.
            if (! Storage::disk('public')->exists($stored)) {
                $this->stats['failed']++;

                continue;
            }

            $this->recordMedia($product, $stored, $bytes, $mime, $slot);
            $product->{$column} = '/storage/' . $stored;
            $touched = true;
            $this->stats['attached']++;
        }

        if ($touched && ! $dry) {
            $product->save();
        }

        return $touched;
    }

    /** Converts to WebP, keeping the source when WebP would be larger. */
    private function toWebp(string $source, string $path, int $quality): array
    {
        $image = @imagecreatefromstring($source);
        if ($image === false) {
            return [null, null, null];
        }

        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);

        ob_start();
        $ok = imagewebp($image, null, $quality);
        $webp = (string) ob_get_clean();
        imagedestroy($image);

        if (! $ok || $webp === '' || strlen($webp) >= strlen($source)) {
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION)) ?: 'jpg';

            return [$source, $ext, $ext === 'png' ? 'image/png' : 'image/jpeg'];
        }

        return [$webp, 'webp', 'image/webp'];
    }

    private function recordMedia(Product $product, string $path, string $bytes, string $mime, string $slot): void
    {
        $dims = @getimagesizefromstring($bytes);

        // A primary row pointing at a file that was never synced must not stop
        // this one taking over, or the product keeps rendering "No Image".
        $livePrimary = ProductMedia::where('product_id', $product->id)
            ->where('type', 'image')->where('is_primary', true)->get()
            ->contains(fn (ProductMedia $m) => Storage::disk('public')->exists($m->path));

        ProductMedia::create([
            'product_id'      => $product->id,
            'type'            => 'image',
            'path'            => $path,
            'mime'            => $mime,
            'file_size_bytes' => strlen($bytes),
            'width'           => $dims ? $dims[0] : null,
            'height'          => $dims ? $dims[1] : null,
            'alt_key'         => 'sheet:' . $slot,
            'sort'            => (int) ProductMedia::where('product_id', $product->id)
                ->where('type', 'image')->max('sort') + 1,
            'is_primary'      => $slot === 'face' && ! $livePrimary,
        ]);
    }

    private function human(int $bytes): string
    {
        return $bytes >= 1048576 ? round($bytes / 1048576, 1) . 'MB'
                                 : max(1, (int) round($bytes / 1024)) . 'KB';
    }

    private function report(bool $dry): void
    {
        $before = $this->stats['bytes_before'];
        $after = $this->stats['bytes_after'];
        $saved = $before > 0 ? round(100 - ($after / $before * 100)) : 0;

        $this->newLine();
        $this->table(['Metric', 'Value'], [
            ['Staged files', $this->stats['files']],
            ['Products updated', $dry ? "{$this->stats['products']} (dry run)" : $this->stats['products']],
            ['Images attached', $dry ? '—' : $this->stats['attached']],
            ['Skipped (already had an image)', $this->stats['skipped_has_image']],
            ['SKU not in catalogue', $this->stats['no_product']],
            ['Failed', $this->stats['failed']],
            ['Size before', $this->human($before)],
            ['Size after', $this->human($after) . " ({$saved}% smaller)"],
        ]);

        if ($this->unmatched) {
            $this->warn('  SKUs with images but no product: ' . implode(', ', array_slice($this->unmatched, 0, 15))
                . (count($this->unmatched) > 15 ? ' … +' . (count($this->unmatched) - 15) . ' more' : ''));
        }

        $dry ? $this->warn('DRY RUN — nothing written.') : $this->info('Done.');
    }
}
