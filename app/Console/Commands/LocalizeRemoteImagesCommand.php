<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\ProductMedia;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Pull the product images that are still hotlinked from an external CDN onto
 * our own disk, as WebP, and repoint the database at the local copies.
 *
 * Hotlinking works right up until the remote store re-uploads or disappears,
 * at which point every affected product loses its image at once. This walks
 * products.image_url / lifestyle_image_url, downloads anything starting with
 * http, converts it, and stores it the same way ntd:import-ntiled-images does
 * — products/{id}/images/{uuid}.webp, with a matching product_media row.
 *
 * Safe by construction, following images:webp:
 *   - A column is only repointed once its file is confirmed on disk, so a
 *     reference can never outrun the file.
 *   - If WebP comes out larger than the source, the source is stored instead
 *     and the row points at that.
 *   - Re-running is a no-op: localised rows no longer match the http filter.
 *   - Interrupting it leaves every un-migrated product on its working URL.
 */
class LocalizeRemoteImagesCommand extends Command
{
    protected $signature = 'ntd:localize-images
                            {--dry-run : Report what would change without writing anything}
                            {--quality=82 : WebP quality (1-100)}
                            {--limit=0 : Only process this many products (0 = all)}';

    protected $description = 'Download externally hosted product images, convert to WebP and repoint the database.';

    /** Columns to migrate, in the order they become media rows. */
    private const COLUMNS = ['image_url', 'lifestyle_image_url'];

    /** Downloaded bytes keyed by URL — the same CDN file backs several products. */
    private array $cache = [];

    private array $stats = ['products' => 0, 'downloaded' => 0, 'converted' => 0, 'kept_original' => 0, 'failed' => 0, 'bytes_before' => 0, 'bytes_after' => 0];

    private array $failures = [];

    public function handle(): int
    {
        if (! function_exists('imagewebp')) {
            $this->error('PHP GD has no WebP support on this machine — cannot convert.');

            return self::FAILURE;
        }

        $dry = (bool) $this->option('dry-run');
        $quality = max(1, min(100, (int) $this->option('quality')));
        $limit = max(0, (int) $this->option('limit'));

        $query = Product::where(function ($q) {
            foreach (self::COLUMNS as $col) {
                $q->orWhere($col, 'like', 'http%');
            }
        })->orderBy('id');

        if ($limit > 0) {
            $query->limit($limit);
        }

        $products = $query->get(['id', 'name', ...self::COLUMNS]);

        if ($products->isEmpty()) {
            $this->info('Nothing to do — no product still points at an external image.');

            return self::SUCCESS;
        }

        $this->info($dry
            ? "DRY RUN — {$products->count()} product(s) would be migrated, nothing will be written."
            : "Localising images for {$products->count()} product(s)…");

        foreach ($products as $product) {
            $this->migrate($product, $quality, $dry);
        }

        $this->report($dry);

        return self::SUCCESS;
    }

    private function migrate(Product $product, int $quality, bool $dry): void
    {
        $touched = false;

        foreach (self::COLUMNS as $col) {
            $url = (string) ($product->{$col} ?? '');
            if (! Str::startsWith($url, 'http')) {
                continue;
            }

            $source = $this->download($url);
            if ($source === null) {
                $this->stats['failed']++;
                $this->failures[] = "#{$product->id} {$product->name} — download failed: {$url}";
                $this->line("  <error>FAIL</error>  #{$product->id} {$col} — could not download");

                continue;
            }

            $this->stats['downloaded']++;

            [$bytes, $ext, $mime] = $this->toWebp($source, $url, $quality);

            if ($bytes === null) {
                $this->stats['failed']++;
                $this->failures[] = "#{$product->id} {$product->name} — undecodable image ({$this->extensionOf($url)}): {$url}";
                $this->line("  <error>FAIL</error>  #{$product->id} {$col} — GD cannot decode " . strtoupper($this->extensionOf($url)));

                continue;
            }

            $this->stats['bytes_before'] += strlen($source);
            $this->stats['bytes_after'] += strlen($bytes);
            $ext === 'webp' ? $this->stats['converted']++ : $this->stats['kept_original']++;

            $path = "products/{$product->id}/images/" . Str::uuid() . '.' . $ext;

            $this->line(sprintf('  %s #%-5d %-19s %7s → %7s  %s',
                $ext === 'webp' ? '<info>WEBP</info>' : '<comment>KEPT</comment>',
                $product->id, $col,
                $this->human(strlen($source)), $this->human(strlen($bytes)),
                Str::limit($product->name, 34)));

            if ($dry) {
                $touched = true;

                continue;
            }

            Storage::disk('public')->put($path, $bytes);

            // Never repoint at a file we cannot confirm is on disk.
            if (! Storage::disk('public')->exists($path)) {
                $this->stats['failed']++;
                $this->failures[] = "#{$product->id} {$product->name} — write failed: {$path}";

                continue;
            }

            $this->recordMedia($product, $path, $bytes, $mime, $col);
            $product->{$col} = '/storage/' . $path;
            $touched = true;
        }

        if ($touched) {
            $this->stats['products']++;

            if (! $dry) {
                $product->save();
            }
        }
    }

    /** Fetches the URL, reusing bytes when several products share one image. */
    private function download(string $url): ?string
    {
        if (array_key_exists($url, $this->cache)) {
            return $this->cache[$url];
        }

        $body = @file_get_contents($url, false, stream_context_create([
            'http' => ['header' => "User-Agent: Mozilla/5.0\r\n", 'timeout' => 60],
        ]));

        return $this->cache[$url] = ($body === false || $body === '') ? null : $body;
    }

    /**
     * Converts to WebP, falling back to the source bytes when that would be
     * larger. Returns [bytes, extension, mime] or [null, …] if undecodable.
     */
    private function toWebp(string $source, string $url, int $quality): array
    {
        $image = @imagecreatefromstring($source);
        if ($image === false) {
            return [null, null, null];
        }

        // Palette images and alpha channels both need explicit handling or the
        // WebP comes out flattened onto black.
        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);

        ob_start();
        $ok = imagewebp($image, null, $quality);
        $webp = (string) ob_get_clean();
        imagedestroy($image);

        if (! $ok || $webp === '' || strlen($webp) >= strlen($source)) {
            $ext = $this->extensionOf($url);

            return [$source, $ext, $this->mimeOf($ext)];
        }

        return [$webp, 'webp', 'image/webp'];
    }

    private function recordMedia(Product $product, string $path, string $bytes, string $mime, string $col): void
    {
        $dims = @getimagesizefromstring($bytes);

        // Older imports left primary rows pointing at files that were never
        // synced. A dead row must not stop this one becoming primary, or the
        // product keeps rendering "No Image" despite having a real file now.
        $livePrimary = ProductMedia::where('product_id', $product->id)
            ->where('type', 'image')
            ->where('is_primary', true)
            ->get()
            ->contains(fn (ProductMedia $m) => Storage::disk('public')->exists($m->path));

        $isPrimary = $col === 'image_url' && ! $livePrimary;

        ProductMedia::create([
            'product_id'      => $product->id,
            'type'            => 'image',
            'path'            => $path,
            'mime'            => $mime,
            'file_size_bytes' => strlen($bytes),
            'width'           => $dims ? $dims[0] : null,
            'height'          => $dims ? $dims[1] : null,
            'alt_key'         => $col,
            'sort'            => (int) ProductMedia::where('product_id', $product->id)
                ->where('type', 'image')->max('sort') + 1,
            'is_primary'      => $isPrimary,
        ]);
    }

    private function extensionOf(string $url): string
    {
        $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));

        return $ext !== '' ? $ext : 'jpg';
    }

    private function mimeOf(string $ext): string
    {
        return match ($ext) {
            'png'         => 'image/png',
            'gif'         => 'image/gif',
            'webp'        => 'image/webp',
            'heic', 'heif' => 'image/heic',
            default       => 'image/jpeg',
        };
    }

    private function human(int $bytes): string
    {
        return $bytes >= 1048576
            ? round($bytes / 1048576, 1) . 'MB'
            : max(1, (int) round($bytes / 1024)) . 'KB';
    }

    private function report(bool $dry): void
    {
        $before = $this->stats['bytes_before'];
        $after = $this->stats['bytes_after'];
        $saved = $before > 0 ? round(100 - ($after / $before * 100)) : 0;

        $this->newLine();
        $this->table(['Metric', 'Value'], [
            ['Products migrated', $dry ? "{$this->stats['products']} (dry run)" : $this->stats['products']],
            ['Images downloaded', $this->stats['downloaded']],
            ['Converted to WebP', $this->stats['converted']],
            ['Kept original (WebP was larger)', $this->stats['kept_original']],
            ['Failed', $this->stats['failed']],
            ['Size before', $this->human($before)],
            ['Size after', $this->human($after) . " ({$saved}% smaller)"],
        ]);

        foreach ($this->failures as $failure) {
            $this->warn('  ' . $failure);
        }

        if ($dry) {
            $this->warn('DRY RUN — no files written, no rows changed.');
        } else {
            $this->info('Done.');
        }
    }
}
