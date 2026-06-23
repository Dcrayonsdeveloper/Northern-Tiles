<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

class ImportDoc12Command extends Command
{
    protected $signature = 'ntd:import-doc12
                            {--sku=     : Only process a single slug}
                            {--dry-run  : Preview changes without saving}
                            {--force    : Overwrite fields even if already set}';

    protected $description = 'Import/update 24 subway tile products from products_doc12.json (Wadi, Vibrant, Coco, Classic).';

    private array $stats = ['total' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'failed' => 0];

    public function handle(): int
    {
        $dryRun   = (bool) $this->option('dry-run');
        $force    = (bool) $this->option('force');
        $onlySlug = strtolower(trim((string) $this->option('sku')));

        $jsonPath = storage_path('app/products_doc12.json');
        if (!file_exists($jsonPath)) {
            $this->error("File not found: {$jsonPath}");
            return self::FAILURE;
        }

        $docs = json_decode(file_get_contents($jsonPath), true);
        if (!$docs) {
            $this->error('Failed to parse products_doc12.json');
            return self::FAILURE;
        }

        $mode = $dryRun ? '[DRY RUN] ' : '';
        $this->info("{$mode}Processing " . count($docs) . " products from doc12...");
        $this->newLine();

        foreach ($docs as $doc) {
            $this->stats['total']++;

            $slug = $doc['slug'] ?? '';
            if ($onlySlug !== '' && $slug !== $onlySlug) continue;

            if (!$dryRun) {
                try {
                    $this->processProduct($doc, $force);
                } catch (\Throwable $e) {
                    $this->line("  <error>FAIL</error>   {$slug} — " . $e->getMessage());
                    $this->stats['failed']++;
                }
            } else {
                $product = Product::where('slug', $slug)->first();
                $action  = $product ? 'UPDATE' : 'CREATE';
                $price   = number_format((float) ($doc['price'] ?? 0), 2);
                $this->line("  <info>{$action}</info> {$slug} (price=\${$price})");
                $this->stats[$product ? 'updated' : 'created']++;
            }
        }

        $this->newLine();
        $this->info('Done.');
        $this->table(['Metric', 'Count'], [
            ['Total in doc', $this->stats['total']],
            ['Created',      $this->stats['created']],
            ['Updated',      $this->stats['updated']],
            ['Skipped',      $this->stats['skipped']],
            ['Failed',       $this->stats['failed']],
        ]);

        return self::SUCCESS;
    }

    private function processProduct(array $doc, bool $force): void
    {
        $slug    = $doc['slug'];
        $product = Product::where('slug', $slug)->first();

        $isShort = fn($v) => empty($v) || strlen(strip_tags((string) $v)) < 80;

        $data = [];

        if (!empty($doc['name']) && (empty($product?->name) || $force)) {
            $data['name'] = $doc['name'];
        }

        if (!empty($doc['meta_title']) && ($isShort($product?->meta_title) || $force)) {
            $data['meta_title'] = substr($doc['meta_title'], 0, 160);
        }

        if (!empty($doc['meta_description']) && ($isShort($product?->meta_description) || $force)) {
            $data['meta_description'] = substr($doc['meta_description'], 0, 320);
        }

        if (!empty($doc['description']) && ($isShort($product?->description) || $force)) {
            $data['description'] = $doc['description'];
        }

        if (!empty($doc['short_description']) && ($isShort($product?->short_description) || $force)) {
            $data['short_description'] = $doc['short_description'];
        }

        if (!empty($doc['specifications'])) {
            $existing = $product?->specifications ?? [];
            if (empty($existing) || $force) {
                $data['specifications'] = $doc['specifications'];
            } elseif ($this->hasMissingKeys($existing, $doc['specifications'])) {
                $data['specifications'] = array_merge($doc['specifications'], $existing);
            }
        }

        if (isset($doc['price']) && $doc['price'] > 0 && (empty($product?->price) || $force)) {
            $data['price'] = (float) $doc['price'];
        }

        $catId = (int) ($doc['category_id'] ?? 0);

        if ($product) {
            if (!empty($data) || ($catId && empty($product->category_id))) {
                if ($catId && (empty($product->category_id) || $force)) {
                    $data['category_id'] = $catId;
                }
                $product->update($data);
                if ($catId) {
                    $product->categories()->syncWithoutDetaching([$catId]);
                }
                $this->line("  <info>UPDATE</info> {$slug}");
                $this->stats['updated']++;
            } else {
                $this->line("  <comment>SKIP</comment>  {$slug} — already complete");
                $this->stats['skipped']++;
            }
        } else {
            $resolved = $this->resolveSlug($slug);
            $product  = Product::create(array_merge([
                'name'               => $doc['name'],
                'slug'               => $resolved,
                'category_id'        => $catId ?: null,
                'status'             => $doc['status'] ?? 'published',
                'price'              => (float) ($doc['price'] ?? 0),
                'inventory_quantity' => 100,
                'inventory_policy'   => 'deny',
            ], $data));

            if ($catId) {
                $product->categories()->sync([$catId]);
            }

            $this->line("  <info>CREATE</info> {$slug}");
            $this->stats['created']++;
        }
    }

    private function resolveSlug(string $slug): string
    {
        $base = $slug; $counter = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $base . '-' . (++$counter);
        }
        return $slug;
    }

    private function hasMissingKeys(array $existing, array $normalized): bool
    {
        foreach ($normalized as $key => $_) {
            if (!array_key_exists($key, $existing)) return true;
        }
        return false;
    }
}
