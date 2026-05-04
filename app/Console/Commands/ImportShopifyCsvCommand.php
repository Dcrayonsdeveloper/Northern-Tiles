<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\Collection;
use App\Domain\Catalog\Models\ProductMedia;
use App\Domain\Catalog\Models\ProductOption;
use App\Domain\Catalog\Models\ProductOptionValue;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Catalog\Models\Tag;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportShopifyCsvCommand extends Command
{
    protected $signature = 'shopify:import
                            {file : Path to the Shopify products CSV file}
                            {--truncate : Truncate existing catalog before importing}
                            {--dry-run : Show summary without importing}';

    protected $description = 'Import products from a Shopify CSV export';

    private array $categoryMap = [];
    private array $tagMap = [];
    private int $productCount = 0;
    private int $variantCount = 0;
    private int $imageCount = 0;
    private int $skipped = 0;

    public function handle(): int
    {
        $filePath = $this->argument('file');
        if (!file_exists($filePath)) {
            $filePath = base_path($filePath);
        }
        if (!file_exists($filePath)) {
            $this->error("File not found: {$this->argument('file')}");
            return 1;
        }

        $grouped = $this->parseCsv($filePath);
        $this->info("Parsed " . count($grouped) . " unique products from CSV.");

        if ($this->option('dry-run')) {
            $this->showDryRun($grouped);
            return 0;
        }

        if ($this->option('truncate')) {
            $this->truncateTables();
        }

        try {
            DB::beginTransaction();

            $this->buildTaxonomy($grouped);
            $this->importProducts($grouped);

            DB::commit();

            $this->newLine();
            $this->info('Import completed!');
            $this->table(
                ['Entity', 'Count'],
                [
                    ['Categories', count($this->categoryMap)],
                    ['Tags', count($this->tagMap)],
                    ['Products', $this->productCount],
                    ['Variants', $this->variantCount],
                    ['Images', $this->imageCount],
                    ['Skipped (draft)', $this->skipped],
                ]
            );

            return 0;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Import failed: ' . $e->getMessage());
            $this->line($e->getTraceAsString());
            return 1;
        }
    }

    /**
     * Parse the Shopify CSV and group rows by Handle (product).
     */
    private function parseCsv(string $filePath): array
    {
        $f = fopen($filePath, 'r');
        $headers = fgetcsv($f, 0, ',', '"', '');

        $grouped = [];
        while (($row = fgetcsv($f, 0, ',', '"', '')) !== false) {
            if (count($row) < count($headers)) {
                continue;
            }
            $data = array_combine($headers, $row);

            $handle = $data['Handle'] ?? '';
            if (!$handle) {
                continue;
            }

            $grouped[$handle][] = $data;
        }
        fclose($f);

        return $grouped;
    }

    /**
     * Extract categories and tags from the product data.
     */
    private function buildTaxonomy(array $grouped): void
    {
        $this->info('Building taxonomy...');

        $allTypes = [];
        $allTags = [];

        foreach ($grouped as $rows) {
            $first = $rows[0];
            $type = trim($first['Type'] ?? '');
            if ($type) {
                $allTypes[$type] = true;
            }

            $tags = $this->parseTags($first['Tags'] ?? '');
            foreach ($tags as $tag) {
                $allTags[$tag] = true;
            }
        }

        // Create categories from product types
        foreach (array_keys($allTypes) as $type) {
            $slug = Str::slug($type);
            $existing = Category::where('slug', $slug)->first();
            if ($existing) {
                $this->categoryMap[$type] = $existing->id;
            } else {
                $category = Category::create([
                    'name' => $type,
                    'slug' => $slug,
                    'is_active' => true,
                ]);
                $this->categoryMap[$type] = $category->id;
            }
        }
        $this->line("  Categories: " . count($this->categoryMap));

        // Create tags
        foreach (array_keys($allTags) as $tagName) {
            $slug = Str::slug($tagName);
            $existing = Tag::where('slug', $slug)->first();
            if ($existing) {
                $this->tagMap[$tagName] = $existing->id;
            } else {
                $tag = Tag::create([
                    'name' => $tagName,
                    'slug' => $slug,
                    'type' => 'manual',
                ]);
                $this->tagMap[$tagName] = $tag->id;
            }
        }
        $this->line("  Tags: " . count($this->tagMap));
    }

    /**
     * Import all products.
     */
    private function importProducts(array $grouped): void
    {
        $this->info('Importing products...');
        $bar = $this->output->createProgressBar(count($grouped));

        foreach ($grouped as $handle => $rows) {
            $this->importProduct($handle, $rows);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Import a single product from its grouped CSV rows.
     */
    private function importProduct(string $handle, array $rows): void
    {
        $first = $rows[0];
        $status = strtolower(trim($first['Status'] ?? 'active'));

        // Skip drafts
        if ($status === 'draft') {
            $this->skipped++;
            return;
        }

        // Skip if product already exists
        if (Product::where('slug', $handle)->exists()) {
            $this->skipped++;
            return;
        }

        $title = $first['Title'] ?? $handle;
        $description = $first['Body (HTML)'] ?? '';
        $vendor = $first['Vendor'] ?? '';
        $type = trim($first['Type'] ?? '');
        $tags = $this->parseTags($first['Tags'] ?? '');
        $published = strtolower(trim($first['Published'] ?? '')) === 'true';
        $seoTitle = $first['SEO Title'] ?? null;
        $seoDesc = $first['SEO Description'] ?? null;

        // Get first variant price
        $price = $this->parsePrice($first['Variant Price'] ?? '0');
        $compareAt = $this->parsePrice($first['Variant Compare At Price'] ?? '');
        $firstImage = $first['Image Src'] ?? null;

        $categoryId = $this->categoryMap[$type] ?? null;

        // Create product
        $product = Product::create([
            'name' => $title,
            'slug' => $handle,
            'description' => $description,
            'brand' => $vendor ?: null,
            'product_type' => $type ? Str::limit($type, 50, '') : null,
            'category_id' => $categoryId,
            'price' => $price,
            'compare_at_price' => $compareAt ?: null,
            'image_url' => $firstImage ?: null,
            'status' => $published ? 'published' : 'draft',
            'is_active' => $published,
            'published_at' => $published ? now() : null,
            'meta_title' => $seoTitle ?: null,
            'meta_description' => $seoDesc ?: null,
            'inventory_quantity' => 100,
            'inventory_policy' => 'deny',
            'requires_shipping' => true,
        ]);

        $this->productCount++;

        // Attach category
        if ($categoryId) {
            $product->categories()->syncWithoutDetaching([$categoryId]);
        }

        // Attach tags
        if (!empty($tags)) {
            $tagInserts = [];
            foreach ($tags as $tagName) {
                if (isset($this->tagMap[$tagName])) {
                    $tagInserts[] = [
                        'tag_id' => $this->tagMap[$tagName],
                        'taggable_id' => $product->id,
                        'taggable_type' => Product::class,
                    ];
                }
            }
            if ($tagInserts) {
                DB::table('taggables')->insert($tagInserts);
            }
        }

        // Collect images, options, and variants from all rows
        $images = [];
        $variants = [];
        $optionNames = [];

        foreach ($rows as $row) {
            // Collect images
            $imgSrc = $row['Image Src'] ?? '';
            if ($imgSrc && !in_array($imgSrc, $images)) {
                $images[] = $imgSrc;
            }

            $variantImg = $row['Variant Image'] ?? '';
            if ($variantImg && !in_array($variantImg, $images)) {
                $images[] = $variantImg;
            }

            // Collect variant data (only rows with a SKU or price)
            $variantSku = trim($row['Variant SKU'] ?? '');
            $variantPrice = $row['Variant Price'] ?? '';
            if ($variantSku || $variantPrice) {
                $options = [];
                for ($i = 1; $i <= 3; $i++) {
                    $optName = trim($row["Option{$i} Name"] ?? '');
                    $optVal = trim($row["Option{$i} Value"] ?? '');
                    if ($optName && $optVal && strtolower($optName) !== 'title') {
                        $options[$optName] = $optVal;
                        if (!in_array($optName, $optionNames)) {
                            $optionNames[] = $optName;
                        }
                    }
                }

                $variants[] = [
                    'sku' => $variantSku,
                    'price' => $this->parsePrice($variantPrice),
                    'compare_at_price' => $this->parsePrice($row['Variant Compare At Price'] ?? ''),
                    'weight_grams' => (int) ($row['Variant Grams'] ?? 0),
                    'barcode' => $row['Variant Barcode'] ?? null,
                    'requires_shipping' => strtolower(trim($row['Variant Requires Shipping'] ?? 'true')) === 'true',
                    'taxable' => strtolower(trim($row['Variant Taxable'] ?? 'true')) === 'true',
                    'image' => $row['Variant Image'] ?? null,
                    'options' => $options,
                ];
            }
        }

        // Create product images
        $sort = 0;
        foreach ($images as $imgUrl) {
            ProductMedia::create([
                'product_id' => $product->id,
                'type' => 'image',
                'path' => $imgUrl,
                'mime' => 'image/jpeg',
                'alt_key' => $title,
                'sort' => $sort,
                'is_primary' => $sort === 0,
            ]);
            $sort++;
            $this->imageCount++;
        }

        // Create product options
        $optionModelMap = [];
        foreach ($optionNames as $position => $optName) {
            $option = ProductOption::create([
                'product_id' => $product->id,
                'name' => $optName,
                'position' => $position,
            ]);
            $optionModelMap[$optName] = $option;
        }

        // Deduplicate variants by SKU
        $seenSkus = [];
        $sortOrder = 0;

        foreach ($variants as $vData) {
            $sku = $vData['sku'];
            if ($sku && isset($seenSkus[$sku])) {
                continue;
            }
            if ($sku) {
                $seenSkus[$sku] = true;
            }

            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $sku ?: $handle . '-' . $sortOrder,
                'name' => !empty($vData['options']) ? implode(' / ', array_values($vData['options'])) : 'Default',
                'attributes_json' => !empty($vData['options']) ? $vData['options'] : null,
                'price' => $vData['price'],
                'compare_at_price' => $vData['compare_at_price'] ?: null,
                'weight_grams' => $vData['weight_grams'],
                'barcode' => $vData['barcode'] ?: null,
                'requires_shipping' => $vData['requires_shipping'],
                'inventory_quantity' => 100,
                'inventory_policy' => 'deny',
                'track_inventory' => true,
                'is_active' => true,
                'is_default' => $sortOrder === 0,
                'sort_order' => $sortOrder,
            ]);

            // Create option values and link to variant
            foreach ($vData['options'] as $optName => $optValue) {
                if (isset($optionModelMap[$optName])) {
                    $optionValue = ProductOptionValue::firstOrCreate(
                        [
                            'product_option_id' => $optionModelMap[$optName]->id,
                            'value' => $optValue,
                        ],
                        ['position' => 0]
                    );

                    DB::table('variant_option_value')->insertOrIgnore([
                        'variant_id' => $variant->id,
                        'product_option_value_id' => $optionValue->id,
                    ]);
                }
            }

            $sortOrder++;
            $this->variantCount++;
        }
    }

    private function parseTags(string $tagString): array
    {
        if (!$tagString) {
            return [];
        }
        return array_filter(array_map('trim', explode(',', $tagString)));
    }

    private function parsePrice(string $price): float
    {
        $cleaned = preg_replace('/[^0-9.]/', '', $price);
        return (float) ($cleaned ?: 0);
    }

    private function truncateTables(): void
    {
        $this->warn('Truncating catalog tables...');

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tables = [
            'collection_products', 'collections',
            'product_tag', 'taggables',
            'product_media', 'product_options', 'product_option_values',
            'variant_option_value', 'variant_media',
            'product_variants', 'product_category',
            'products', 'categories', 'tags',
        ];

        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                DB::table($table)->truncate();
                $this->line("  Truncated: {$table}");
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function showDryRun(array $grouped): void
    {
        $types = [];
        $tags = [];
        $totalVariants = 0;
        $totalImages = 0;
        $active = 0;
        $draft = 0;

        foreach ($grouped as $rows) {
            $first = $rows[0];
            $status = strtolower(trim($first['Status'] ?? 'active'));
            if ($status === 'draft') {
                $draft++;
            } else {
                $active++;
            }

            $type = trim($first['Type'] ?? '');
            if ($type) {
                $types[$type] = ($types[$type] ?? 0) + 1;
            }

            foreach ($this->parseTags($first['Tags'] ?? '') as $tag) {
                $tags[$tag] = ($tags[$tag] ?? 0) + 1;
            }

            foreach ($rows as $row) {
                if ($row['Variant SKU'] ?? '') {
                    $totalVariants++;
                }
                if ($row['Image Src'] ?? '') {
                    $totalImages++;
                }
            }
        }

        arsort($types);

        $this->info('DRY RUN — Summary:');
        $this->table(['Metric', 'Count'], [
            ['Active products', $active],
            ['Draft products (skipped)', $draft],
            ['Total variants', $totalVariants],
            ['Total images', $totalImages],
            ['Unique types/categories', count($types)],
            ['Unique tags', count($tags)],
        ]);

        $this->newLine();
        $this->info('Product types:');
        $typeRows = [];
        foreach (array_slice($types, 0, 25) as $t => $c) {
            $typeRows[] = [$t, $c];
        }
        $this->table(['Type', 'Products'], $typeRows);
    }
}
