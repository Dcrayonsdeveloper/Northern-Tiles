<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

class BackfillProductSpecificationsCommand extends Command
{
    protected $signature = 'products:backfill-specifications
                            {--force : Also overwrite products that already have specifications}
                            {--dry-run : Show what would be updated without saving}';

    protected $description = 'Parse product description HTML and backfill the specifications JSON column';

    /**
     * Maps every known label variant (lower-cased, trimmed) to a JSON key.
     * Handles both the short format ("Size:") and the long SEO format ("Size (Nominal):").
     */
    private const LABEL_MAP = [
        'name'                 => 'name',
        'style'                => 'style',
        'colours'              => 'colours',
        'colors'               => 'colours',
        'colour'               => 'colours',
        'color'                => 'colours',
        'finish'               => 'finish',
        'material'             => 'material',
        'size (nominal)'       => 'size_nominal',
        'size'                 => 'size_nominal',
        'thickness'            => 'thickness',
        'variation'            => 'variation',
        'application space'    => 'application_space',
        'country of origin'    => 'country_of_origin',
        'quantity per box'     => 'quantity_per_box',
        'quantity per box (m²)' => 'quantity_per_box',
        'qty per box'          => 'quantity_per_box',
    ];

    public function handle(): int
    {
        $force  = $this->option('force');
        $dryRun = $this->option('dry-run');

        $query = Product::query()->whereNotNull('description')->where('description', '!=', '');

        if (!$force) {
            $query->where(function ($q) {
                $q->whereNull('specifications')
                  ->orWhereRaw("CAST(specifications AS CHAR) IN ('[]', '{}', 'null', '\"\"')");
            });
        }

        $products = $query->get(['id', 'name', 'description', 'specifications']);

        if ($products->isEmpty()) {
            $this->info('No products need backfilling.');
            return 0;
        }

        $this->info("Found {$products->count()} product(s) to process.");

        $updated = 0;
        $skipped = 0;

        foreach ($products as $product) {
            $specs = $this->extractSpecs($product->description);

            if (empty($specs)) {
                $this->line("  <comment>SKIP</comment>  [{$product->id}] {$product->name} — no specs found");
                $skipped++;
                continue;
            }

            $preview = collect($specs)->map(fn($v, $k) => "{$k}={$v}")->implode(', ');
            $this->line("  <info>UPDATE</info> [{$product->id}] {$product->name}");
            $this->line("         " . substr($preview, 0, 120));

            if (!$dryRun) {
                $product->specifications = $specs;
                $product->save();
            }

            $updated++;
        }

        $this->newLine();

        if ($dryRun) {
            $this->warn("DRY RUN — no changes saved. Would update {$updated} product(s), skip {$skipped}.");
        } else {
            $this->info("Done. Updated: {$updated}, Skipped: {$skipped}.");
        }

        return 0;
    }

    private function extractSpecs(string $html): array
    {
        // Extract all <strong>Label</strong>:? value pairs from the HTML.
        // Handles: <strong>Label:</strong> value  and  <strong>Label</strong>: value
        $pairs = $this->extractStrongPairs($html);

        $specs = [];

        foreach ($pairs as $rawLabel => $value) {
            // Normalise label: lower-case, collapse whitespace, strip trailing colon
            $normalized = rtrim(strtolower(preg_replace('/\s+/', ' ', trim($rawLabel))), ':');

            if (isset(self::LABEL_MAP[$normalized])) {
                $key = self::LABEL_MAP[$normalized];
                // Only take the first match for each key
                if (!isset($specs[$key])) {
                    $specs[$key] = $value;
                }
            }
        }

        return $specs;
    }

    private function extractStrongPairs(string $html): array
    {
        $pairs = [];

        // Pattern: <strong>Label:?</strong>:? text-until-next-tag
        // The value is the text content immediately after the closing </strong> (and optional colon)
        $pattern = '/<strong>(.*?)<\/strong>\s*:?\s*([^<]*)/is';

        if (!preg_match_all($pattern, $html, $matches, PREG_SET_ORDER)) {
            return $pairs;
        }

        foreach ($matches as $m) {
            $label = trim(strip_tags(html_entity_decode($m[1])));
            $value = trim(strip_tags(html_entity_decode($m[2])));

            $label = rtrim($label, ':');

            // First occurrence wins — descriptions sometimes embed a linked product's
            // spec table at the end, which would overwrite the correct values.
            if ($label !== '' && $value !== '' && !array_key_exists($label, $pairs)) {
                $pairs[$label] = $value;
            }
        }

        return $pairs;
    }
}
