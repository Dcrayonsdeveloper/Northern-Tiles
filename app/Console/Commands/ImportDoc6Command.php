<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\Tag;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ImportDoc6Command extends Command
{
    protected $signature = 'ntd:import-doc6
                            {--sku=     : Only process a single slug}
                            {--dry-run  : Preview changes without saving}
                            {--force    : Overwrite fields even if already set}';

    protected $description = 'Import/update 43 products from products_doc6.json (Hybrid ranges, Smart Waste, Durotech, Levelling Clips).';

    private array $stats = ['total' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'failed' => 0];

    public function handle(): int
    {
        $dryRun  = (bool) $this->option('dry-run');
        $force   = (bool) $this->option('force');
        $onlySlug = strtolower(trim((string) $this->option('sku')));

        $jsonPath = storage_path('app/products_doc6.json');
        if (!file_exists($jsonPath)) {
            $this->error("File not found: {$jsonPath}");
            return self::FAILURE;
        }

        $docs = json_decode(file_get_contents($jsonPath), true);
        if (!$docs) {
            $this->error('Failed to parse products_doc6.json');
            return self::FAILURE;
        }

        $mode = $dryRun ? '[DRY RUN] ' : '';
        $this->info("{$mode}Processing " . count($docs) . " products from doc6...");
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
                $status  = $product ? 'UPDATE' : 'CREATE';
                $this->line("  <info>{$status}</info> {$slug}");
                $this->stats[$product ? 'updated' : 'created']++;
            }
        }

        $this->newLine();
        $this->info('Done.');
        $this->table(['Metric', 'Count'], [
            ['Total in doc',   $this->stats['total']],
            ['Created',        $this->stats['created']],
            ['Updated',        $this->stats['updated']],
            ['Skipped',        $this->stats['skipped']],
            ['Failed',         $this->stats['failed']],
        ]);

        return self::SUCCESS;
    }

    private function processProduct(array $doc, bool $force): void
    {
        $slug = $doc['slug'];
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

        if (!empty($doc['specifications'])) {
            $normSpecs = $doc['specifications'];
            $existing  = $product?->specifications ?? [];
            if (empty($existing) || $force) {
                $data['specifications'] = $normSpecs;
            } elseif ($this->hasMissingKeys($existing, $normSpecs)) {
                $data['specifications'] = array_merge($normSpecs, $existing);
            }
        }

        if (!empty($doc['sqm_per_box']) && (empty($product?->sqm_per_box) || $force)) {
            $data['sqm_per_box'] = (float) $doc['sqm_per_box'];
        }

        $catId = (int) ($doc['category_id'] ?? 0);

        if ($product) {
            // Existing product — update missing fields
            if (!empty($data) || ($catId && $product->category_id !== $catId && !$force === false)) {
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
            // New product — create
            $resolved = $this->resolveSlug($slug, 0);
            $product  = Product::create(array_merge([
                'name'               => $doc['name'],
                'slug'               => $resolved,
                'category_id'        => $catId ?: null,
                'status'             => $doc['status'] ?? 'published',
                'price'              => 0,
                'inventory_quantity' => $doc['inventory_quantity'] ?? 100,
                'inventory_policy'   => $doc['inventory_policy'] ?? 'deny',
            ], $data));

            if ($catId) {
                $product->categories()->sync([$catId]);
            }

            $this->line("  <info>CREATE</info> {$slug}");
            $this->stats['created']++;
        }
    }

    private function resolveSlug(string $slug, int $excludeId): string
    {
        $base = $slug; $counter = 1;
        while (Product::where('slug', $slug)->where('id', '!=', $excludeId)->exists()) {
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
