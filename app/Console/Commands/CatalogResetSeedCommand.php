<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\Collection;
use App\Domain\Catalog\Models\ProductMedia;
use App\Domain\Catalog\Models\ProductOption;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Catalog\Models\Tag;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CatalogResetSeedCommand extends Command
{
    protected $signature = 'catalog:reset-seed
                            {--force : Force run in production}
                            {--dry-run : Show what would be done without executing}';

    protected $description = 'TRUNCATE catalog tables and seed taxonomy + products from JSON';

    private array $categoryMap = [];
    private array $tagMap = [];
    private int $productCount = 0;
    private int $variantCount = 0;

    public function handle(): int
    {
        // Safety checks
        if (!$this->option('force')) {
            $this->error('This command requires --force flag');
            return 1;
        }

        if (env('CATALOG_RESET') !== 'YES') {
            $this->error('Environment variable CATALOG_RESET must be set to YES');
            $this->line('Add CATALOG_RESET=YES to your .env file');
            return 1;
        }

        $jsonPath = database_path('seeders/data/ntd_catalog_seed.json');
        if (!file_exists($jsonPath)) {
            $this->error("Seed file not found: {$jsonPath}");
            return 1;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error('Invalid JSON: ' . json_last_error_msg());
            return 1;
        }

        if ($this->option('dry-run')) {
            $this->info('DRY RUN - No changes will be made');
            $this->showSummary($data);
            return 0;
        }

        $this->warn('This will TRUNCATE all catalog tables!');
        if (!$this->confirm('Are you sure you want to continue?')) {
            return 0;
        }

        try {
            $this->truncateTables();
            $this->seedTaxonomy($data['taxonomy']);
            $this->seedProducts($data['products']);

            $this->newLine();
            $this->info('Catalog seeded successfully!');
            $this->table(
                ['Entity', 'Count'],
                [
                    ['Categories', count($this->categoryMap)],
                    ['Tags', count($this->tagMap)],
                    ['Collections', Collection::count()],
                    ['Products', $this->productCount],
                    ['Variants', $this->variantCount],
                ]
            );

            return 0;
        } catch (\Throwable $e) {
            $this->error('Failed: ' . $e->getMessage());
            $this->line($e->getTraceAsString());
            return 1;
        }
    }

    private function truncateTables(): void
    {
        $this->info('Truncating catalog tables...');

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tables = [
            'collection_products',
            'collections',
            'product_tag',
            'taggables',
            'product_media',
            'product_options',
            'product_option_values',
            'variant_option_value',
            'product_variants',
            'product_category',
            'products',
            'categories',
            'tags',
        ];

        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                DB::table($table)->truncate();
                $this->line("  Truncated: {$table}");
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function seedTaxonomy(array $taxonomy): void
    {
        $this->info('Seeding taxonomy...');

        // Categories
        $this->line('  Creating categories...');
        foreach ($taxonomy['categories'] as $cat) {
            $parentId = null;
            if ($cat['parent']) {
                $parentId = $this->categoryMap[$cat['parent']] ?? null;
            }

            $category = Category::create([
                'name' => $cat['name'],
                'slug' => $cat['slug'],
                'parent_id' => $parentId,
                'is_active' => true,
            ]);

            $this->categoryMap[$cat['slug']] = $category->id;
        }

        // Tags
        $this->line('  Creating tags...');
        foreach ($taxonomy['tags'] as $tagName) {
            $tag = Tag::create([
                'name' => $tagName,
                'slug' => Str::slug($tagName),
                'type' => 'manual',
            ]);
            $this->tagMap[$tagName] = $tag->id;
        }

        // Collections
        $this->line('  Creating collections...');
        foreach ($taxonomy['collections'] as $col) {
            Collection::create([
                'title' => $col['name'],
                'handle' => $col['slug'],
                'type' => $col['type'] === 'smart' ? Collection::TYPE_AUTOMATED : Collection::TYPE_MANUAL,
                'rules_json' => $col['rules'] ?? null,
                'is_active' => true,
                'sort_mode' => Collection::SORT_NEWEST,
            ]);
        }
    }

    private function seedProducts(array $products): void
    {
        $this->info('Seeding products...');
        $bar = $this->output->createProgressBar(count($products));

        foreach ($products as $productData) {
            $this->createProduct($productData);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    private function createProduct(array $data): void
    {
        // Find category from path
        $categoryId = null;
        if (!empty($data['category_path'])) {
            $lastCategorySlug = Str::slug(end($data['category_path']));
            $categoryId = $this->categoryMap[$lastCategorySlug] ?? null;
        }

        // Create product
        $product = Product::create([
            'name' => $data['name'],
            'slug' => $data['handle'],
            'brand' => $data['brand'] ?? null,
            'category_id' => $categoryId,
            'description' => $this->buildDescription($data['content']),
            'short_description' => Str::limit($data['content']['intro'] ?? '', 250),
            'meta_title' => $data['seo']['meta_title'] ?? null,
            'meta_description' => $data['seo']['meta_description'] ?? null,
            'status' => 'published',
            'is_active' => true,
            'published_at' => $data['published_at'] ?? now(),
            'price' => $data['variants'][0]['price'] ?? 0,
            'compare_at_price' => $data['variants'][0]['compare_at_price'] ?? null,
            'inventory_quantity' => 100,
        ]);

        $this->productCount++;

        // Attach to categories (many-to-many)
        if (!empty($data['category_path'])) {
            $categoryIds = [];
            foreach ($data['category_path'] as $catName) {
                $slug = Str::slug($catName);
                if (isset($this->categoryMap[$slug])) {
                    $categoryIds[] = $this->categoryMap[$slug];
                }
            }
            if ($categoryIds) {
                $product->categories()->attach($categoryIds);
            }
        }

        // Attach tags (use raw insert since taggables may not have timestamps)
        if (!empty($data['tags'])) {
            $tagInserts = [];
            foreach ($data['tags'] as $tagName) {
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

        // Create options from variant options
        $optionNames = $this->extractOptionNames($data['variants']);
        $optionMap = [];
        foreach ($optionNames as $position => $optionName) {
            $option = ProductOption::create([
                'product_id' => $product->id,
                'name' => $optionName,
                'position' => $position,
            ]);
            $optionMap[$optionName] = $option->id;
        }

        // Create variants
        $sortOrder = 0;
        foreach ($data['variants'] as $variantData) {
            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $variantData['sku'],
                'name' => $this->buildVariantName($variantData['options']),
                'attributes_json' => $variantData['options'],
                'price' => $variantData['price'],
                'compare_at_price' => $variantData['compare_at_price'] ?? null,
                'inventory_quantity' => $variantData['stock_qty'] ?? 100,
                'inventory_policy' => 'deny',
                'track_inventory' => true,
                'is_active' => $variantData['is_active'] ?? true,
                'is_default' => $sortOrder === 0,
                'sort_order' => $sortOrder++,
            ]);

            $this->variantCount++;
        }
    }

    private function extractOptionNames(array $variants): array
    {
        $names = [];
        foreach ($variants as $variant) {
            if (!empty($variant['options'])) {
                foreach (array_keys($variant['options']) as $key) {
                    if (!in_array($key, $names)) {
                        $names[] = $key;
                    }
                }
            }
        }
        return $names;
    }

    private function buildVariantName(array $options): string
    {
        return implode(' / ', array_values($options));
    }

    private function buildDescription(array $content): string
    {
        $parts = [];

        if (!empty($content['intro'])) {
            $parts[] = $content['intro'];
        }

        if (!empty($content['benefits'])) {
            $parts[] = "\n\n**Features:**\n- " . implode("\n- ", $content['benefits']);
        }

        if (!empty($content['specs'])) {
            $parts[] = "\n\n**Specifications:**\n- " . implode("\n- ", $content['specs']);
        }

        return implode('', $parts);
    }

    private function showSummary(array $data): void
    {
        $this->table(
            ['Entity', 'Count'],
            [
                ['Categories', count($data['taxonomy']['categories'] ?? [])],
                ['Tags', count($data['taxonomy']['tags'] ?? [])],
                ['Collections', count($data['taxonomy']['collections'] ?? [])],
                ['Products', count($data['products'] ?? [])],
                ['Variants', array_sum(array_map(fn($p) => count($p['variants'] ?? []), $data['products'] ?? []))],
            ]
        );
    }
}
