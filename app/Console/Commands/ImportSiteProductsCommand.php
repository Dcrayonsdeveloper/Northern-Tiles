<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\ProductVariant;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Imports the ntiled.com.au (Shopify) products that are absent from the local
 * catalogue — ranges the NTD Google Sheet never covered (mosaics, basins,
 * stack stone, engineered timber, the Lodge/Wavy subways and friends).
 *
 * Products are addressed by their Shopify handle, which is stable, so the
 * command is safe to re-run: anything already present by SKU or slug is
 * skipped rather than duplicated.
 */
class ImportSiteProductsCommand extends Command
{
    protected $signature = 'ntd:import-site
                            {--dry-run : Preview changes without saving to the database}';

    protected $description = 'Import ntiled.com.au products that are missing from the local catalogue.';

    private const PRODUCTS_JSON = 'https://ntiled.com.au/products.json?limit=250&page=';

    /** Shopify handles to import, grouped by the range they belong to. */
    private const HANDLES = [
        // Mosaics
        'round-fingers-23x98mm', 'small-kit-kats', 'large-kit-kats',
        'arrow-shape-rippled-surface-glazed-gloss-porcelain-range', 'cube-48x48mm',
        'fishscale-range', 'carrara-kit-kats-marble',
        // Basins
        'copy-classic-terrazzo-basin', 'copy-carrera-fluted-basin', 'carrera-fluted-basin',
        // Stack stone / split face
        'grey-stacked-stone', 'pure-white-stacked-stone', 'grey-split-face',
        'pure-white-split-face',
        // Engineered timber
        'aria-opal-oak-1900x190-14-3', 'ordel-opal-oak-1900x190-15-3mm',
        'dota-opal-origins-1900x190-14-2mm', 'naturaloakherringbone',
        'naturaloak-engineeredtimber',
        // Nordik
        'nordik-grey', 'nordik-silver', 'nordik-white', 'nordik-antracita',
        // Lodge / wavy subways
        'lodge-wavy-matt-white-wall-150x150mm-15uaw1m',
        'lodge-subway-wavy-edge-matt-white-wall-75x150mm-07waw1m',
        'lodge-subway-gloss-dark-grey-wavy-75x300-b753153-d',
        'wavy-gloss-white-wall-200x300mm-wg23n1w', 'lodge-matt-white-subway-tiles-wavy',
        // Sample packs
        'sample-quad-pack', '7mm-hybrid-sample-pack',
        // Hybrid / herringbone oak
        'smoked-oak', 'dark-oak', 'herringbone-dark-oak', '16001-1', 'carrara-herringbone',
        // Remaining tiles
        'subway-matt-white-100x200-wm12n1', 'subway-black-gloss-wall-100x300-wg13d6',
        'white-gloss-wall-100x100-wg11n1-b101-loose', 'rockfacewhite',
        'calacutta-matt-600x600', 'matte-white-600x300ceramic', 'urban-antique-matt-75x300mm',
        'urban-antique-gloss-75x300mm', 'silky-white-600x600mm-20mm',
        'gala-antracita-80x330mm', 'fragments-range-subway-tiles', 'carrara-hex',
        'concrete-charcoal',
    ];

    /** Shopify product_type → existing category slug. */
    private const TYPE_TO_CATEGORY = [
        'engineered timber'       => 'engineered-timber',
        'subway'                  => 'subway',
        'subways'                 => 'subways',
        'wall tiles'              => 'wall-tiles',
        'quad'                    => 'quad',
        'marble'                  => 'marble',
        'hybrid'                  => 'hybrid',
        'hybrid timber oak range' => 'hybrid-timber-oak-range',
        'mosaics'                 => 'mosaics',
        'tile'                    => 'tile',
        'pool'                    => 'pool',
    ];

    /** Fallback for products Shopify leaves untyped, keyed by handle. */
    private const HANDLE_TO_CATEGORY = [
        'smoked-oak'                  => 'hybrid',
        'dark-oak'                    => 'hybrid',
        'copy-classic-terrazzo-basin' => 'basins', // Green Terrazzo Basin
        'copy-carrera-fluted-basin'   => 'basins', // Classic Terrazzo Basin
        'carrera-fluted-basin'        => 'basins',
        'calacutta-matt-600x600'      => 'tile',
        'matte-white-600x300ceramic'  => 'ceramic',
        'fishscale-range'             => 'mosaics',
    ];

    private array $stats = ['fetched' => 0, 'imported' => 0, 'variants' => 0, 'skipped' => 0, 'notfound' => 0];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info($dryRun ? '[DRY RUN] Importing ntiled.com.au products…' : 'Importing ntiled.com.au products…');

        $catalogue = $this->fetchCatalogue();
        if ($catalogue === null) {
            return self::FAILURE;
        }

        $wanted = array_flip(self::HANDLES);
        $selected = array_values(array_filter($catalogue, fn ($p) => isset($wanted[$p['handle'] ?? ''])));
        $this->stats['fetched'] = count($selected);

        foreach (array_diff(self::HANDLES, array_column($selected, 'handle')) as $missing) {
            $this->warn("  Handle no longer on the site: {$missing}");
            $this->stats['notfound']++;
        }

        // Dedup guards: both tables carry a unique SKU, and slugs must be unique.
        $existingSkus = ProductVariant::pluck('sku')
            ->merge(Product::pluck('sku'))
            ->filter()
            ->map(fn ($s) => strtoupper(trim($s)))
            ->flip()
            ->toArray();

        DB::beginTransaction();
        try {
            foreach ($selected as $sp) {
                $this->importProduct($sp, $existingSkus, $dryRun);
            }

            $dryRun ? DB::rollBack() : DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Import failed: ' . $e->getMessage());
            $this->line($e->getTraceAsString());

            return self::FAILURE;
        }

        $this->newLine();
        $this->table(['Metric', 'Count'], [
            ['Matched on site', $this->stats['fetched']],
            ['Products imported', $dryRun ? "{$this->stats['imported']} (dry run)" : $this->stats['imported']],
            ['Variants created', $dryRun ? "{$this->stats['variants']} (dry run)" : $this->stats['variants']],
            ['Skipped (already present)', $this->stats['skipped']],
            ['Handles not found', $this->stats['notfound']],
        ]);

        if ($dryRun) {
            $this->warn('DRY RUN — no changes were saved.');
        } else {
            $this->info('Import complete.');
        }

        return self::SUCCESS;
    }

    /** Pulls every page of the Shopify catalogue feed. */
    private function fetchCatalogue(): ?array
    {
        $all = [];

        for ($page = 1; $page <= 20; $page++) {
            $body = @file_get_contents(self::PRODUCTS_JSON . $page, false, stream_context_create([
                'http' => ['header' => "User-Agent: Mozilla/5.0\r\n", 'timeout' => 30],
            ]));

            if ($body === false) {
                $this->error('  Failed to fetch the Shopify catalogue feed.');

                return null;
            }

            $products = json_decode($body, true)['products'] ?? [];
            if (empty($products)) {
                break;
            }

            $all = array_merge($all, $products);
        }

        $this->line('  Fetched ' . count($all) . ' products from ntiled.com.au');

        return $all;
    }

    private function importProduct(array $sp, array &$existingSkus, bool $dryRun): void
    {
        $title = trim($sp['title'] ?? '');
        $variants = $sp['variants'] ?? [];

        // Skip when any variant SKU is already known, or the slug is taken.
        foreach ($variants as $v) {
            $sku = strtoupper(trim((string) ($v['sku'] ?? '')));
            if ($sku !== '' && isset($existingSkus[$sku])) {
                $this->warn("  Skipped (SKU {$sku} exists): {$title}");
                $this->stats['skipped']++;

                return;
            }
        }

        if (Product::where('slug', Str::slug($title))->exists()) {
            $this->warn("  Skipped (slug exists): {$title}");
            $this->stats['skipped']++;

            return;
        }

        $prices = array_filter(array_map(fn ($v) => (float) ($v['price'] ?? 0), $variants));
        $price = $prices ? min($prices) : 0.0;
        $images = array_column($sp['images'] ?? [], 'src');
        $body = $sp['body_html'] ?? '';

        $this->line(sprintf('  + %-52s $%s (%d variant%s)%s',
            Str::limit($title, 52), number_format($price, 2), count($variants), count($variants) === 1 ? '' : 's',
            $price > 0 ? '' : '  ← no price on site, importing as draft'));

        if ($dryRun) {
            $this->stats['imported']++;
            $this->stats['variants'] += count($variants);
            $this->markSeen($variants, $existingSkus);

            return;
        }

        $category = $this->resolveCategory($sp);
        $defaultSku = $this->firstSku($variants);

        // A zero price is a data error on the source site; import the product so
        // the catalogue is complete, but keep it out of the storefront until
        // someone sets a real price.
        $priced = $price > 0;

        $product = Product::create([
            'name'                => $title,
            'slug'                => $this->uniqueSlug(Str::slug($title)),
            'sku'                 => $defaultSku,
            // short_description is varchar(255); the full copy lives in description.
            'short_description'   => Str::limit($this->plainText($body), 250),
            'description'         => $body,
            'price'               => $price,
            'default_currency'    => 'AUD',
            'image_url'           => $images[0] ?? null,
            'lifestyle_image_url' => $images[1] ?? null,
            'category_id'         => $category->id,
            'product_type'        => $category->name,
            'status'              => $priced ? 'published' : 'draft',
            'is_active'           => $priced,
            'published_at'        => $priced ? ($sp['published_at'] ?? now()) : null,
        ]);

        foreach (array_values($variants) as $i => $v) {
            $sku = trim((string) ($v['sku'] ?? ''));
            $label = trim((string) ($v['title'] ?? ''));

            ProductVariant::create([
                'product_id' => $product->id,
                'sku'        => $sku !== '' ? $sku : null,
                'name'       => ($label === '' || $label === 'Default Title') ? $title : $label,
                'price'      => (float) ($v['price'] ?? $price),
                'currency'   => 'AUD',
                'is_default' => $i === 0,
                'is_active'  => true,
                'sort_order' => $i,
            ]);
            $this->stats['variants']++;
        }

        $this->markSeen($variants, $existingSkus);
        $this->stats['imported']++;
    }

    private function markSeen(array $variants, array &$existingSkus): void
    {
        foreach ($variants as $v) {
            $sku = strtoupper(trim((string) ($v['sku'] ?? '')));
            if ($sku !== '') {
                $existingSkus[$sku] = true;
            }
        }
    }

    /** Flattens Shopify's body_html into a single line of readable text. */
    private function plainText(string $html): string
    {
        $text = html_entity_decode(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</li>'], ' ', $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim(preg_replace('/\s+/u', ' ', $text));
    }

    private function firstSku(array $variants): ?string
    {
        foreach ($variants as $v) {
            $sku = trim((string) ($v['sku'] ?? ''));
            if ($sku !== '') {
                return $sku;
            }
        }

        return null;
    }

    private function resolveCategory(array $sp): Category
    {
        $handle = $sp['handle'] ?? '';
        $type = strtolower(trim((string) ($sp['product_type'] ?? '')));

        $slug = self::HANDLE_TO_CATEGORY[$handle]
            ?? self::TYPE_TO_CATEGORY[$type]
            ?? 'tile';

        return Category::firstOrCreate(
            ['slug' => $slug],
            ['name' => Str::title(str_replace('-', ' ', $slug)), 'is_active' => true]
        );
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base ?: 'product';
        $i = 2;

        while (Product::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}
