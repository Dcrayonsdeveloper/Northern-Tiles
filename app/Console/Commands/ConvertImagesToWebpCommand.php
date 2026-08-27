<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Convert product images to WebP and repoint the database at them.
 *
 * Written as a command rather than a one-off script because the conversion has
 * to run wherever the images live — locally and on production — and the two
 * halves must not drift apart: converting files without updating the rows shows
 * "No Image", and updating rows without the files does the same.
 *
 * Safe by construction:
 *   - Originals are never renamed or deleted. A .webp is written alongside.
 *   - A row is only repointed when its .webp is confirmed on disk, so a
 *     reference can never outrun the file.
 *   - Re-running is a no-op; already-converted files are skipped.
 *   - If WebP comes out larger than the original, it is discarded and the row
 *     keeps pointing at the smaller file.
 *   - Interrupting it leaves the site working, on the originals.
 */
class ConvertImagesToWebpCommand extends Command
{
    protected $signature = 'images:webp
        {--dry-run : Report what would change without writing anything}
        {--quality=82 : WebP quality for photographs (1-100)}
        {--dir=products : Directory under storage/app/public to walk}';

    protected $description = 'Convert product images to WebP and point the database at them';

    /** Files that must not be touched, matched as substrings of the path. */
    private const EXCLUDE = ['images/builder/hero-banner'];

    public function handle(): int
    {
        if (! function_exists('imagewebp')) {
            $this->error('PHP GD has no WebP support on this machine — cannot convert.');

            return self::FAILURE;
        }

        $dry = (bool) $this->option('dry-run');
        $quality = max(1, min(100, (int) $this->option('quality')));
        $root = storage_path('app/public/' . trim((string) $this->option('dir'), '/'));

        if (! is_dir($root)) {
            $this->error("Not a directory: {$root}");

            return self::FAILURE;
        }

        $this->info($dry ? 'DRY RUN — nothing will be written.' : 'Converting…');

        [$map, $stats] = $this->convert($root, $quality, $dry);

        $this->newLine();
        $this->line(sprintf(
            $dry ? '  to convert: up to %d' : '  converted : %d',
            $stats['converted']
        ));
        $this->line(sprintf('  skipped   : %d  (already done, excluded, or WebP was not smaller)', $stats['skipped']));
        $this->line(sprintf('  failed    : %d', $stats['failed']));

        if ($stats['before'] > 0 && ! $dry) {
            $saved = $stats['before'] - $stats['after'];
            $this->line(sprintf(
                '  size      : %.1f MB → %.1f MB   saved %.1f MB (%d%%)',
                $stats['before'] / 1048576,
                $stats['after'] / 1048576,
                $saved / 1048576,
                (int) round(100 * $saved / $stats['before'])
            ));
        } elseif ($stats['before'] > 0) {
            // Deliberately no saving figure here. Nothing has been encoded, so
            // the output size is unknown — quoting one would be a made-up number.
            $this->line(sprintf('  source    : %.1f MB to be re-encoded (result size unknown until it runs)', $stats['before'] / 1048576));
        }

        if ($dry) {
            $this->newLine();
            $this->comment(sprintf(
                'Up to %d database rows would change. Re-run without --dry-run to apply.',
                $this->countPendingRows($map)
            ));
            $this->comment('Upper bound: a file whose WebP is not smaller than the original is discarded, and its row left alone. Those cannot be identified without encoding, which a dry run does not do.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->info('Updating database…');
        $db = $this->repoint($map);

        $this->line(sprintf('  product_media updated      : %d', $db['media']));
        $this->line(sprintf('  products.image_url updated : %d', $db['products']));

        $this->newLine();
        $this->comment('Originals were kept. Remove them only once the site has been checked.');

        return self::SUCCESS;
    }

    /**
     * Walk the tree and write a .webp beside every convertible image.
     *
     * @return array{0: array<string,string>, 1: array<string,int>}
     */
    private function convert(string $root, int $quality, bool $dry): array
    {
        $map = [];
        $stats = ['converted' => 0, 'skipped' => 0, 'failed' => 0, 'before' => 0, 'after' => 0];

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($files as $file) {
            if (! $file->isFile()) {
                continue;
            }

            $src = str_replace('\\', '/', $file->getPathname());
            $ext = strtolower($file->getExtension());

            if (! in_array($ext, ['jpg', 'jpeg', 'png'], true)) {
                continue;
            }

            foreach (self::EXCLUDE as $skip) {
                if (str_contains($src, $skip)) {
                    $stats['skipped']++;

                    continue 2;
                }
            }

            $dst = preg_replace('/\.(jpe?g|png)$/i', '.webp', $src);

            // Already converted and still current.
            if (is_file($dst) && filemtime($dst) >= filemtime($src)) {
                $map[$src] = $dst;
                $stats['skipped']++;

                continue;
            }

            if ($dry) {
                $map[$src] = $dst;
                $stats['converted']++;
                $stats['before'] += filesize($src);

                continue;
            }

            try {
                $image = $ext === 'png' ? @imagecreatefrompng($src) : @imagecreatefromjpeg($src);
                if (! $image) {
                    throw new \RuntimeException('unreadable');
                }

                if ($ext === 'png') {
                    imagepalettetotruecolor($image);
                    imagealphablending($image, false);
                    imagesavealpha($image, true);
                }

                if (! imagewebp($image, $dst, $quality)) {
                    throw new \RuntimeException('encode failed');
                }
                imagedestroy($image);

                $before = filesize($src);
                $after = filesize($dst);

                // Keep whichever file is actually smaller.
                if ($after >= $before) {
                    @unlink($dst);
                    $stats['skipped']++;

                    continue;
                }

                $map[$src] = $dst;
                $stats['converted']++;
                $stats['before'] += $before;
                $stats['after'] += $after;
            } catch (\Throwable $e) {
                $stats['failed']++;
                $this->warn("  ! {$src} — {$e->getMessage()}");
            }
        }

        return [$map, $stats];
    }

    /**
     * How many rows still point at a non-WebP file. Rows repointed by an earlier
     * run are excluded, so re-running reports 0 rather than restating the total.
     *
     * @param  array<string,string>  $map
     */
    private function countPendingRows(array $map): int
    {
        $base = str_replace(DIRECTORY_SEPARATOR, '/', storage_path('app/public/'));
        $rel = [];
        foreach ($map as $src => $dst) {
            $rel[str_replace($base, '', $src)] = true;
        }

        $n = 0;

        foreach (DB::table('product_media')->select('path')->cursor() as $row) {
            if (isset($rel[ltrim((string) $row->path, '/')])) {
                $n++;
            }
        }

        $urls = DB::table('products')
            ->whereNotNull('image_url')
            ->where('image_url', 'not like', 'http%')
            ->pluck('image_url');

        foreach ($urls as $url) {
            if (isset($rel[ltrim(str_replace('/storage/', '', (string) $url), '/')])) {
                $n++;
            }
        }

        return $n;
    }

    /**
     * Repoint product_media and products.image_url at the WebP files.
     *
     * @param  array<string,string>  $map  absolute source path => absolute webp path
     * @return array{media:int, products:int}
     */
    private function repoint(array $map): array
    {
        $base = str_replace('\\', '/', storage_path('app/public/')); // strip to disk-relative
        $rel = [];
        foreach ($map as $src => $dst) {
            $rel[str_replace($base, '', $src)] = str_replace($base, '', $dst);
        }

        $media = 0;
        $products = 0;

        DB::transaction(function () use ($rel, &$media, &$products) {
            foreach (DB::table('product_media')->select('id', 'path')->cursor() as $row) {
                $path = ltrim((string) $row->path, '/');
                if (! isset($rel[$path])) {
                    continue;
                }

                $abs = storage_path('app/public/' . $rel[$path]);
                if (! is_file($abs)) {
                    continue;
                }

                DB::table('product_media')->where('id', $row->id)->update([
                    'path' => $rel[$path],
                    'mime' => 'image/webp',
                    'file_size_bytes' => filesize($abs),
                    'updated_at' => now(),
                ]);
                $media++;
            }

            // Local paths only — an external CDN url is not ours to rewrite.
            $rows = DB::table('products')
                ->select('id', 'image_url')
                ->whereNotNull('image_url')
                ->where('image_url', 'not like', 'http%')
                ->get();

            foreach ($rows as $row) {
                $path = ltrim(str_replace('/storage/', '', (string) $row->image_url), '/');
                if (! isset($rel[$path])) {
                    continue;
                }

                if (! is_file(storage_path('app/public/' . $rel[$path]))) {
                    continue;
                }

                DB::table('products')->where('id', $row->id)->update([
                    'image_url' => '/storage/' . $rel[$path],
                    'updated_at' => now(),
                ]);
                $products++;
            }
        });

        return ['media' => $media, 'products' => $products];
    }
}
