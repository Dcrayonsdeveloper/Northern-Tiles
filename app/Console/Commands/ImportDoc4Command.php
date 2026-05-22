<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\Tag;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ImportDoc4Command extends Command
{
    protected $signature = 'ntd:import-doc4
                            {--sku=     : Only process a single SKU}
                            {--dry-run  : Preview changes without saving}
                            {--force    : Overwrite fields even if already set}';

    protected $description = 'Update 29 products with SEO content from products_doc4.json (Google Doc 4 batch).';

    private array $stats = [
        'total'   => 0,
        'updated' => 0,
        'skipped' => 0,
        'failed'  => 0,
    ];

    public function handle(): int
    {
        $dryRun  = (bool) $this->option('dry-run');
        $force   = (bool) $this->option('force');
        $onlySku = strtoupper(trim((string) $this->option('sku')));

        $jsonPath = storage_path('app/products_doc4.json');
        if (!file_exists($jsonPath)) {
            $this->error("File not found: {$jsonPath}");
            return self::FAILURE;
        }

        $docs = json_decode(file_get_contents($jsonPath), true);
        if (!$docs) {
            $this->error('Failed to parse products_doc4.json');
            return self::FAILURE;
        }

        $mode = $dryRun ? '[DRY RUN] ' : '';
        $this->info("{$mode}Processing " . count($docs) . " products from doc4...");
        $this->newLine();

        foreach ($docs as $sku => $doc) {
            $this->stats['total']++;

            if ($onlySku !== '' && $sku !== $onlySku) {
                continue;
            }

            $product = Product::where('sku', $sku)->with('productTags')->first();

            if (!$product) {
                $this->line("  <error>MISSING</error> {$sku} — not in DB, skipping");
                $this->stats['failed']++;
                continue;
            }

            $updates = [];
            $actions = [];
            $isShort = fn($v) => empty($v) || strlen(strip_tags((string) $v)) < 80;

            // Name
            $docName = trim($doc['name'] ?? '');
            if ($docName && (empty($product->name) || $force)) {
                $updates['name'] = $docName;
                $actions[] = 'name';
            }

            // Slug
            $docSlug = trim($doc['slug'] ?? '');
            if ($docSlug && ($product->slug !== $docSlug || $force)) {
                $resolved = $this->resolveSlug($docSlug, $product->id);
                if ($resolved !== $product->slug) {
                    $updates['slug'] = $resolved;
                    $actions[] = 'slug';
                }
            }

            // Meta title
            $metaTitle = substr($doc['meta_title'] ?? $doc['name'] ?? '', 0, 160);
            if ($metaTitle && ($isShort($product->meta_title) || $product->meta_title === $product->name || $force)) {
                $updates['meta_title'] = $metaTitle;
                $actions[] = 'meta_title';
            }

            // Meta description
            $metaDesc = substr($doc['meta_description'] ?? '', 0, 320);
            if ($metaDesc && ($isShort($product->meta_description) || $force)) {
                $updates['meta_description'] = $metaDesc;
                $actions[] = 'meta_desc';
            }

            // Short description
            $shortDesc = $this->buildShortDesc($doc);
            if ($shortDesc && ($isShort($product->short_description) || $force)) {
                $updates['short_description'] = $shortDesc;
                $actions[] = 'short_desc';
            }

            // Description
            $desc = $doc['description'] ?? '';
            if ($desc && ($isShort($product->description) || $force)) {
                $updates['description'] = $desc;
                $actions[] = 'description';
            }

            // Specifications
            $docSpecs = $doc['specifications'] ?? [];
            if (!empty($docSpecs)) {
                $normSpecs = $this->normalizeSpecs($docSpecs);
                $existing  = $product->specifications ?? [];
                if (empty($existing) || $force) {
                    $updates['specifications'] = $normSpecs;
                    $actions[] = 'specs';
                } elseif ($this->hasMissingKeys($existing, $normSpecs)) {
                    $updates['specifications'] = array_merge($normSpecs, $existing);
                    $actions[] = 'specs(merge)';
                }
            }

            // sqm_per_box
            if (!empty($doc['sqm_per_box']) && (empty($product->sqm_per_box) || $force)) {
                $updates['sqm_per_box'] = (float) $doc['sqm_per_box'];
                $actions[] = 'sqm';
            }

            // Category
            $docCatId = (int) ($doc['category_id'] ?? 0);
            if ($docCatId && ($product->category_id !== $docCatId || $force)) {
                $updates['category_id'] = $docCatId;
                $actions[] = 'category';
            }

            $tagsToSync = !empty($doc['tags']) && $product->productTags->isEmpty();
            if ($tagsToSync) {
                $actions[] = 'tags(' . count($doc['tags']) . ')';
            }

            if (empty($updates) && !$tagsToSync) {
                $this->line("  <comment>SKIP</comment>  {$sku} — already complete");
                $this->stats['skipped']++;
                continue;
            }

            $this->line("  <info>UPDATE</info> {$sku} — " . implode(', ', $actions));

            if (!$dryRun) {
                try {
                    if (!empty($updates)) {
                        $product->update($updates);
                    }

                    if (isset($updates['category_id'])) {
                        $product->categories()->sync([$updates['category_id']]);
                    }

                    if ($tagsToSync) {
                        $this->syncTags($product, $doc['tags']);
                    }

                    $this->stats['updated']++;
                } catch (\Throwable $e) {
                    $this->line("  <error>FAIL</error>   {$sku} — " . $e->getMessage());
                    $this->stats['failed']++;
                }
            } else {
                $this->stats['updated']++;
            }
        }

        $this->newLine();
        $this->info('Done.');
        $this->table(['Metric', 'Count'], [
            ['Total in doc',        $this->stats['total']],
            ['Updated',             $this->stats['updated']],
            ['Skipped (complete)',  $this->stats['skipped']],
            ['Failed',              $this->stats['failed']],
        ]);

        return self::SUCCESS;
    }

    private function buildShortDesc(array $doc): string
    {
        $meta = strip_tags($doc['meta_description'] ?? '');
        if (!$meta) {
            return '';
        }
        $dot = strpos($meta, '.', 40);
        if ($dot !== false && $dot < 200) {
            return substr($meta, 0, $dot + 1);
        }
        return substr($meta, 0, 160);
    }

    private function resolveSlug(string $slug, int $excludeId): string
    {
        $base    = $slug;
        $counter = 1;
        while (Product::where('slug', $slug)->where('id', '!=', $excludeId)->exists()) {
            $counter++;
            $slug = $base . '-' . $counter;
        }
        return $slug;
    }

    private function normalizeSpecs(array $specs): array
    {
        $map = [
            'Name'              => 'name',
            'Style'             => 'style',
            'Colour'            => 'colour',
            'Colours'           => 'colour',
            'Finish'            => 'finish',
            'Material'          => 'material',
            'Size'              => 'size_actual',
            'Size (Actual)'     => 'size_actual',
            'Thickness'         => 'thickness',
            'Variation'         => 'variation',
            'Application Space' => 'application_space',
            'Country of Origin' => 'country_of_origin',
            'Quantity Per Box'  => 'quantity_per_box',
            'Slip Rating'       => 'slip_rating',
        ];

        $out = [];
        foreach ($specs as $key => $val) {
            $out[$map[$key] ?? Str::snake($key)] = $val;
        }
        return $out;
    }

    private function hasMissingKeys(array $existing, array $normalized): bool
    {
        foreach ($normalized as $key => $_) {
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
            if (!$name) {
                continue;
            }
            $tag = Tag::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'type' => 'manual']
            );
            $tagIds[$tag->id] = ['source' => 'import', 'confidence' => 1.0];
        }
        if ($tagIds) {
            $product->productTags()->sync($tagIds);
        }
    }
}
