<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\Attribute;
use App\Domain\Catalog\Models\ProductVariant;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportSheetProductsCommand extends Command
{
    protected $signature = 'ntd:import-sheet
                            {--url=  : Single CSV export URL (omit to import all 4 default NTD tabs)}
                            {--category= : Force a category name for every row (overrides sheet value; used with --url)}
                            {--dry-run : Preview changes without saving to the database}';

    protected $description = 'Import products from NTD Google Sheets (all tabs, SKU dedup, attribute tagging, skip report).';

    /**
     * All four NTD sheet tabs with their authoritative category names.
     * Run without --url to process every tab in one pass.
     */
    private const SHEET_TABS = [
        [
            'url'      => 'https://docs.google.com/spreadsheets/d/10mKR0ut_h187rML95Qb1ujaJ8f6k9YRRGkNcvFTqo6M/export?format=csv&gid=0',
            'category' => 'Wall Tile',
        ],
        [
            'url'      => 'https://docs.google.com/spreadsheets/d/10mKR0ut_h187rML95Qb1ujaJ8f6k9YRRGkNcvFTqo6M/export?format=csv&gid=242175759',
            'category' => 'Floor & Wall Tile',
        ],
        [
            'url'      => 'https://docs.google.com/spreadsheets/d/10mKR0ut_h187rML95Qb1ujaJ8f6k9YRRGkNcvFTqo6M/export?format=csv&gid=1490763684',
            'category' => 'Outdoor Tile',
        ],
        [
            'url'      => 'https://docs.google.com/spreadsheets/d/10mKR0ut_h187rML95Qb1ujaJ8f6k9YRRGkNcvFTqo6M/export?format=csv&gid=170884512',
            'category' => 'Decorative Tile',
        ],
    ];

    /**
     * Maps lowercased, trimmed CSV header strings → internal field keys.
     */
    private const COL_ALIASES = [
        'code (sku)'             => 'sku',
        'code'                   => 'sku',
        'sku'                    => 'sku',
        'name'                   => 'name',
        'description'            => 'description',
        'decription'             => 'description', // typo in Outdoor Tiles tab
        'price'                  => 'price',
        'style'                  => 'style',
        'colours'                => 'colours',
        'colors'                 => 'colours',
        'finish'                 => 'finish',
        'space'                  => 'space',
        'size'                   => 'size',
        'material'               => 'material',
        'quantity per box (m2)'  => 'sqm_per_box',
        'quantity per box'       => 'sqm_per_box',
        'country of origin'      => 'origin',
        'variation'              => 'variation',
        'thickness (mm)'         => 'thickness',
        'face image'             => 'face_image',
        'lifestyle image'        => 'lifestyle_image',
        'category'               => 'sheet_category',
        'slip rating'            => 'slip_rating',
        'number of faces'        => 'num_faces',
    ];

    /** Maps field keys → attribute slugs for filter tagging. */
    private const ATTR_MAP = [
        'colours'  => 'color',
        'space'    => 'space',
        'size'     => 'size',
        'material' => 'material',
        'finish'   => 'finish',
        'style'    => 'style',
    ];

    private array $stats = [
        'rows'            => 0,
        'imported'        => 0,
        'skipped'         => 0,
        'image_warnings'  => 0,
        'new_attr_values' => 0,
    ];

    private array $skipLog    = [];
    private array $warnLog    = [];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        // Determine which tabs to process
        $urlOption = trim((string) $this->option('url'));
        if ($urlOption !== '') {
            $tabs = [[
                'url'      => $urlOption,
                'category' => trim((string) $this->option('category')),
            ]];
        } else {
            $tabs = self::SHEET_TABS;
        }

        $this->info($dryRun
            ? '[DRY RUN] Starting import of ' . count($tabs) . ' tab(s)…'
            : 'Starting import of ' . count($tabs) . ' tab(s)…'
        );

        // ── Load all 6 attributes once ────────────────────────────────────────
        $attributes = Attribute::whereIn('slug', array_values(self::ATTR_MAP))
            ->with('values')
            ->get()
            ->keyBy('slug');

        $missing = collect(array_values(self::ATTR_MAP))->unique()->diff($attributes->keys());
        if ($missing->isNotEmpty()) {
            $this->error('Missing attributes: ' . $missing->implode(', ') . '. Run: php artisan db:seed --class=AttributeSeeder');
            return self::FAILURE;
        }

        // ── Collect existing SKUs to avoid N+1 duplicate checks ───────────────
        $existingSkus  = ProductVariant::pluck('sku')->flip()->toArray();
        $categoryCache = [];

        DB::beginTransaction();
        try {
            foreach ($tabs as $tab) {
                $this->processTab(
                    $tab['url'],
                    $tab['category'],
                    $attributes,
                    $existingSkus,
                    $categoryCache,
                    $dryRun
                );
            }

            if ($dryRun) {
                DB::rollBack();
            } else {
                DB::commit();
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Import failed: ' . $e->getMessage());
            $this->line($e->getTraceAsString());
            return self::FAILURE;
        }

        // ── Summary table ─────────────────────────────────────────────────────
        $this->newLine();
        $this->table(
            ['Metric', 'Count'],
            [
                ['Rows parsed',           $this->stats['rows']],
                ['Imported',              $dryRun ? "{$this->stats['imported']} (dry run)" : $this->stats['imported']],
                ['Skipped (hard)',        $this->stats['skipped']],
                ['Image warnings',        $this->stats['image_warnings']],
                ['New attribute values',  $this->stats['new_attr_values']],
            ]
        );

        $this->writeSkipReport($dryRun);

        if ($dryRun) {
            $this->warn('DRY RUN — no changes were saved.');
        } else {
            $this->info('Import complete.');
        }

        return self::SUCCESS;
    }

    // ── Tab processor ─────────────────────────────────────────────────────────

    private function processTab(
        string  $url,
        string  $forcedCategory,
        object  $attributes,
        array   &$existingSkus,
        array   &$categoryCache,
        bool    $dryRun
    ): void {
        $this->line("  Fetching: {$url}");

        $csv = @file_get_contents($url);
        if ($csv === false) {
            $this->error("  Failed to fetch CSV from: {$url}");
            return;
        }

        $lines  = str_getcsv($csv, "\n");
        $colMap = [];

        foreach ($lines as $lineNum => $rawLine) {
            $rawLine = trim($rawLine);
            if ($rawLine === '') {
                continue;
            }

            $row = str_getcsv($rawLine);

            // ── Detect header row ─────────────────────────────────────────────
            $firstCell = strtolower(trim($row[0] ?? ''));
            if ($firstCell === 'code (sku)' || $firstCell === 'code') {
                $colMap = $this->buildColMap($row);
                continue;
            }

            if (empty($colMap)) {
                continue;
            }

            $this->stats['rows']++;

            // ── Extract fields ────────────────────────────────────────────────
            $f = $this->extractFields($row, $colMap);

            $sku          = trim($f['sku'] ?? '');
            $name         = trim($f['name'] ?? '');
            $description  = trim($f['description'] ?? '');
            $priceRaw     = trim($f['price'] ?? '');
            $size         = trim($f['size'] ?? '');
            $sqmPerBox    = is_numeric(trim($f['sqm_per_box'] ?? ''))
                            ? (float) trim($f['sqm_per_box']) : null;
            $faceImage    = trim($f['face_image'] ?? '');
            $lifestyleImg = trim($f['lifestyle_image'] ?? '');

            // Determine category: forced (per-tab config) takes priority
            $catName = $this->resolveCategory(
                trim($f['sheet_category'] ?? ''),
                $forcedCategory
            );

            // ── Hard validation (skip row) ────────────────────────────────────
            if ($sku === '') {
                $this->addSkip('Missing SKU', '', $name, $lineNum + 1, $url);
                continue;
            }
            if ($name === '') {
                $this->addSkip('Missing Name', $sku, '', $lineNum + 1, $url);
                continue;
            }
            if ($priceRaw === '' || !is_numeric($priceRaw)) {
                $this->addSkip('Missing/Invalid Price', $sku, $name, $lineNum + 1, $url);
                continue;
            }
            if ($size === '') {
                $this->addSkip('Missing Size', $sku, $name, $lineNum + 1, $url);
                continue;
            }
            if (isset($existingSkus[$sku])) {
                $this->addSkip('Duplicate SKU', $sku, $name, $lineNum + 1, $url);
                continue;
            }

            // ── Soft image warnings (import proceeds regardless) ──────────────
            if ($faceImage === '') {
                $this->addWarn('Missing Face Image', $sku, $name, $lineNum + 1);
            }
            if ($lifestyleImg === '') {
                $this->addWarn('Missing Lifestyle Image', $sku, $name, $lineNum + 1);
            }

            $price = (float) $priceRaw;

            // ── Import ────────────────────────────────────────────────────────
            if (!$dryRun) {
                if (!isset($categoryCache[$catName])) {
                    $categoryCache[$catName] = Category::updateOrCreate(
                        ['slug' => Str::slug($catName)],
                        ['name' => $catName, 'is_active' => true]
                    );
                }
                $category = $categoryCache[$catName];

                $slug    = $this->uniqueSlug(Str::slug($name));
                $product = Product::create([
                    'name'               => $name,
                    'slug'               => $slug,
                    'sku'                => $sku,
                    'short_description'  => $description,
                    'price'              => $price,
                    'image_url'          => $faceImage !== '' ? $faceImage : null,
                    'lifestyle_image_url'=> $lifestyleImg !== '' ? $lifestyleImg : null,
                    'category_id'        => $category->id,
                    'status'             => 'published',
                    'is_active'          => true,
                    'product_type'       => $catName,
                    'sqm_per_box'        => $sqmPerBox,
                    'published_at'       => now(),
                ]);

                ProductVariant::create([
                    'product_id' => $product->id,
                    'sku'        => $sku,
                    'name'       => $name,
                    'price'      => $price,
                    'is_default' => true,
                    'is_active'  => true,
                ]);

                // Attribute tagging
                $valueIds = [];
                foreach (self::ATTR_MAP as $fieldKey => $attrSlug) {
                    $cell = trim($f[$fieldKey] ?? '');
                    if ($cell === '') {
                        continue;
                    }
                    $attribute = $attributes[$attrSlug];
                    foreach (array_filter(array_map('trim', explode(',', $cell))) as $rawValue) {
                        $valueSlug = Str::slug($rawValue);
                        $existing  = $attribute->values->firstWhere('slug', $valueSlug);
                        if ($existing) {
                            $valueIds[] = $existing->id;
                        } else {
                            $newVal = $attribute->addValue($rawValue, $valueSlug);
                            $attribute->values->push($newVal);
                            $valueIds[] = $newVal->id;
                            $this->stats['new_attr_values']++;
                        }
                    }
                }
                if (!empty($valueIds)) {
                    $product->attributeValues()->syncWithoutDetaching(array_unique($valueIds));
                }
            }

            // Mark SKU as seen so subsequent rows with the same SKU are caught
            $existingSkus[$sku] = true;
            $this->stats['imported']++;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildColMap(array $headerRow): array
    {
        $map = [];
        foreach ($headerRow as $i => $header) {
            $h = strtolower(trim((string) $header));
            if (isset(self::COL_ALIASES[$h]) && !isset($map[self::COL_ALIASES[$h]])) {
                $map[self::COL_ALIASES[$h]] = $i;
            }
        }
        return $map;
    }

    private function extractFields(array $row, array $colMap): array
    {
        $out = [];
        foreach ($colMap as $key => $index) {
            $out[$key] = isset($row[$index]) ? (string) $row[$index] : '';
        }
        return $out;
    }

    /**
     * Determine the product category.
     * $forced (from per-tab config) wins over the sheet's own Category column.
     * If forced is empty, falls back to normalising the sheet category value.
     */
    private function resolveCategory(string $sheetCat, string $forced): string
    {
        if ($forced !== '') {
            return $forced;
        }
        if ($sheetCat === '') {
            return 'Wall Tile';
        }
        $lower = strtolower($sheetCat);
        if (str_contains($lower, 'floor')) {
            return 'Floor & Wall Tile';
        }
        if (str_contains($lower, 'outdoor')) {
            return 'Outdoor Tile';
        }
        if (str_contains($lower, 'decorative')) {
            return 'Decorative Tile';
        }
        if (str_contains($lower, 'wall')) {
            return 'Wall Tile';
        }
        return 'Wall Tile';
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base;
        $i    = 1;
        while (Product::where('slug', $slug)->exists()) {
            $i++;
            $slug = "{$base}-{$i}";
        }
        return $slug;
    }

    private function addSkip(string $reason, string $sku, string $name, int $line, string $url = ''): void
    {
        $this->stats['skipped']++;
        $label         = $sku ?: '(no sku)';
        $nameStr       = $name ? " — {$name}" : '';
        $this->skipLog[] = "[{$reason}]  {$label}{$nameStr}  (row {$line})";
    }

    private function addWarn(string $reason, string $sku, string $name, int $line): void
    {
        $this->stats['image_warnings']++;
        $nameStr       = $name ? " — {$name}" : '';
        $this->warnLog[] = "[{$reason}]  {$sku}{$nameStr}  (row {$line})";
    }

    private function writeSkipReport(bool $dryRun): void
    {
        $date     = now()->format('Y-m-d');
        $path     = storage_path("logs/import-skip-{$date}.txt");
        $tag      = $dryRun ? ' [DRY RUN]' : '';
        $imported = $this->stats['imported'];
        $skipped  = $this->stats['skipped'];
        $rows     = $this->stats['rows'];
        $imgWarn  = $this->stats['image_warnings'];

        $lines   = [];
        $lines[] = "NTD IMPORT SKIP REPORT — {$date}{$tag}";
        $lines[] = str_repeat('=', 56);
        $lines[] = "Total rows processed  : {$rows}";
        $lines[] = "Successfully imported : {$imported}";
        $lines[] = "Hard-skipped          : {$skipped}";
        $lines[] = "Image warnings        : {$imgWarn} (products still imported)";
        $lines[] = '';

        $lines[] = '── SKIPPED (not imported) ───────────────────────────────';
        if (empty($this->skipLog)) {
            $lines[] = '  No rows were hard-skipped.';
        } else {
            foreach ($this->skipLog as $entry) {
                $lines[] = '  ' . $entry;
            }
        }

        $lines[] = '';
        $lines[] = '── IMAGE WARNINGS (imported without image) ──────────────';
        if (empty($this->warnLog)) {
            $lines[] = '  No image warnings.';
        } else {
            $preview = array_slice($this->warnLog, 0, 50);
            foreach ($preview as $entry) {
                $lines[] = '  ' . $entry;
            }
            if ($imgWarn > 50) {
                $lines[] = "  … and " . ($imgWarn - 50) . " more image warnings.";
            }
        }

        file_put_contents($path, implode(PHP_EOL, $lines) . PHP_EOL);

        if ($skipped > 0) {
            $this->warn("Skip report saved: {$path}");
            $preview = array_slice($this->skipLog, 0, 15);
            $this->line('');
            foreach ($preview as $entry) {
                $this->line('  ' . $entry);
            }
            if ($skipped > 15) {
                $this->line("  … and " . ($skipped - 15) . " more (see skip report)");
            }
        } else {
            $this->info("Skip report saved: {$path} (no hard skips)");
        }

        if ($imgWarn > 0) {
            $this->warn("{$imgWarn} products imported without images (Face/Lifestyle Image columns are empty in the sheet). Add image URLs to the sheet and re-run to update.");
        }
    }
}
