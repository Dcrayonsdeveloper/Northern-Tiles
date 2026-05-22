<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\Tag;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class UpdateProductsFromDocCommand extends Command
{
    protected $signature = 'ntd:update-from-doc
                            {--sku=     : Only update a single SKU}
                            {--dry-run  : Preview changes without saving}
                            {--force    : Overwrite fields even if already set}';

    protected $description = 'Update products with content from the Google Doc parsed JSON (storage/app/doc_products_v2.json).';

    private array $stats = [
        'total'   => 0,
        'updated' => 0,
        'skipped' => 0,
        'missing' => 0,
    ];

    private array $fieldReport = [];

    public function handle(): int
    {
        $dryRun  = (bool) $this->option('dry-run');
        $force   = (bool) $this->option('force');
        $onlySku = strtoupper(trim((string) $this->option('sku')));

        $jsonPath = storage_path('app/doc_products_v2.json');
        if (!file_exists($jsonPath)) {
            $this->error("Source file not found: {$jsonPath}");
            return self::FAILURE;
        }

        $docProducts = json_decode(file_get_contents($jsonPath), true);
        if (!$docProducts) {
            $this->error('Failed to parse doc_products_v2.json');
            return self::FAILURE;
        }

        $mode = $dryRun ? '[DRY RUN] ' : '';
        $this->info("{$mode}Processing " . count($docProducts) . " products from Google Doc...");
        $this->newLine();

        foreach ($docProducts as $sku => $docData) {
            $this->stats['total']++;

            if ($onlySku !== '' && $sku !== $onlySku) {
                continue;
            }

            $product = Product::where('sku', $sku)->with(['productTags'])->first();

            if (!$product) {
                $this->line("  <error>MISSING</error> {$sku} — not found in database");
                $this->stats['missing']++;
                continue;
            }

            $updates = [];
            $tagNames = $docData['tags'] ?? [];
            $docSpecs = $docData['specifications'] ?? [];

            // --- FIELDS TO UPDATE ONLY IF EMPTY OR PLACEHOLDER ---

            // Short description: update if it's empty or same as bare product name (placeholder)
            $isPlaceholder = fn($val) => empty($val) || strlen(strip_tags((string) $val)) < 80;

            if ($isPlaceholder($product->short_description) || $force) {
                $shortDesc = $this->buildShortDescription($docData);
                if ($shortDesc) {
                    $updates['short_description'] = $shortDesc;
                }
            }

            // Full description: update if placeholder or empty
            if ($isPlaceholder($product->description) || $force) {
                $desc = $docData['description'] ?? '';
                if ($desc) {
                    $updates['description'] = $desc;
                }
            }

            // Meta title: update if missing or matches bare name only
            $bareMetaTitle = empty($product->meta_title) || $product->meta_title === $product->name;
            if ($bareMetaTitle || $force) {
                $metaTitle = $docData['meta_title'] ?? $docData['name'] ?? '';
                if ($metaTitle) {
                    $updates['meta_title'] = substr($metaTitle, 0, 160);
                }
            }

            // Meta description: update if placeholder or empty
            if ($isPlaceholder($product->meta_description) || $force) {
                $metaDesc = $docData['meta_description'] ?? '';
                if ($metaDesc) {
                    $updates['meta_description'] = substr($metaDesc, 0, 320);
                }
            }

            // sqm_per_box: update if null
            if (empty($product->sqm_per_box) || $force) {
                if (!empty($docData['sqm_per_box'])) {
                    $updates['sqm_per_box'] = (float) $docData['sqm_per_box'];
                }
            }

            // Specifications: update if empty, or merge new keys from doc
            $existingSpecs = $product->specifications ?? [];
            if (empty($existingSpecs) && !empty($docSpecs)) {
                $updates['specifications'] = $this->normalizeSpecs($docSpecs);
            } elseif (!empty($docSpecs) && ($force || $this->hasMissingSpecKeys($existingSpecs, $docSpecs))) {
                $merged = array_merge($this->normalizeSpecs($docSpecs), $existingSpecs);
                $updates['specifications'] = $merged;
            }

            // Width/length from doc if DB fields are empty
            if (empty($product->width_mm) && !empty($docData['width_mm'])) {
                $updates['width_mm'] = $docData['width_mm'];
            }
            if (empty($product->length_mm) && !empty($docData['length_mm'])) {
                $updates['length_mm'] = $docData['length_mm'];
            }
            if (empty($product->height_mm) && !empty($docData['height_mm'])) {
                $updates['height_mm'] = $docData['height_mm'];
            }

            $fieldsUpdated = array_keys($updates);
            $tagsToSync = !empty($tagNames) && $product->productTags->isEmpty();

            if (empty($updates) && !$tagsToSync) {
                $this->line("  <comment>SKIP</comment>  {$sku} — all fields complete");
                $this->stats['skipped']++;
                continue;
            }

            // Report what we're updating
            $changedFields = $fieldsUpdated;
            if ($tagsToSync) {
                $changedFields[] = 'tags(' . count($tagNames) . ')';
            }
            $this->line("  <info>UPDATE</info> {$sku} — " . implode(', ', $changedFields));

            if (!$dryRun) {
                if (!empty($updates)) {
                    $product->update($updates);
                }

                // Sync tags
                if ($tagsToSync) {
                    $this->syncTags($product, $tagNames);
                }
            }

            $this->stats['updated']++;
            $this->fieldReport[$sku] = $changedFields;
        }

        $this->newLine();
        $this->info('Done.');
        $this->table(['Metric', 'Count'], [
            ['Total in doc',    $this->stats['total']],
            ['Updated',         $this->stats['updated']],
            ['Skipped (complete)', $this->stats['skipped']],
            ['Missing from DB', $this->stats['missing']],
        ]);

        if (!empty($this->fieldReport)) {
            $this->newLine();
            $this->info('Fields updated per SKU:');
            foreach ($this->fieldReport as $sku => $fields) {
                $this->line("  {$sku}: " . implode(', ', $fields));
            }
        }

        return self::SUCCESS;
    }

    private function buildShortDescription(array $docData): string
    {
        // Use first sentence of meta description as short description
        $meta = strip_tags($docData['meta_description'] ?? '');
        if (!$meta) {
            return '';
        }
        // Truncate at first period or 160 chars
        $dot = strpos($meta, '.', 40);
        if ($dot !== false && $dot < 200) {
            return substr($meta, 0, $dot + 1);
        }
        return substr($meta, 0, 160);
    }

    private function normalizeSpecs(array $docSpecs): array
    {
        // Convert human-readable doc spec keys to snake_case DB format
        $normalized = [];
        $keyMap = [
            'Name'              => 'name',
            'Style'             => 'style',
            'Colour'            => 'colour',
            'Colours'           => 'colour',
            'Finish'            => 'finish',
            'Material'          => 'material',
            'Size (Actual)'     => 'size_actual',
            'Thickness'         => 'thickness',
            'Variation'         => 'variation',
            'Application Space' => 'application_space',
            'Country of Origin' => 'country_of_origin',
            'Quantity Per Box'  => 'quantity_per_box',
        ];

        foreach ($docSpecs as $rawKey => $val) {
            $snakeKey = $keyMap[$rawKey] ?? Str::snake($rawKey);
            $normalized[$snakeKey] = $val;
        }

        return $normalized;
    }

    private function hasMissingSpecKeys(array $existing, array $docSpecs): bool
    {
        $normalized = $this->normalizeSpecs($docSpecs);
        foreach ($normalized as $key => $val) {
            if (!array_key_exists($key, $existing)) {
                return true;
            }
        }
        return false;
    }

    private function syncTags(Product $product, array $tagNames): void
    {
        $tagIds = [];
        foreach ($tagNames as $name) {
            $name = trim($name);
            if (empty($name)) {
                continue;
            }
            $slug = Str::slug($name);
            $tag = Tag::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'type' => 'manual']
            );
            $tagIds[$tag->id] = ['source' => 'import', 'confidence' => 1.0];
        }

        if (!empty($tagIds)) {
            $product->productTags()->sync($tagIds);
        }
    }
}
