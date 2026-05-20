<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

class StripSpecsFromDescriptionsCommand extends Command
{
    protected $signature = 'products:strip-specs-from-descriptions
                            {--dry-run : Show what would change without saving}';

    protected $description = 'Remove the "Product Specifications" block from product description HTML (data now lives in specifications column)';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $products = Product::whereNotNull('description')
            ->where('description', '!=', '')
            ->get(['id', 'name', 'description']);

        $this->info("Scanning {$products->count()} products...");

        $updated = 0;
        $unchanged = 0;

        foreach ($products as $product) {
            $cleaned = $this->stripSpecBlock($product->description);

            if ($cleaned === $product->description) {
                $unchanged++;
                continue;
            }

            $this->line("  <info>STRIP</info> [{$product->id}] {$product->name}");

            if (!$dryRun) {
                $product->description = $cleaned;
                $product->save();
            }

            $updated++;
        }

        $this->newLine();

        if ($dryRun) {
            $this->warn("DRY RUN — no changes saved. Would strip {$updated} product(s). {$unchanged} unchanged.");
        } else {
            $this->info("Done. Stripped: {$updated}, Unchanged: {$unchanged}.");
        }

        return 0;
    }

    /**
     * Remove the "Product Specifications" block from description HTML.
     *
     * Handles two formats:
     *  A) <h2>Product Specifications</h2><ul>...spec items...</ul>
     *  B) A bare <ul> whose every <li> starts with a known spec label (no heading)
     */
    public static function stripSpecBlock(string $html): string
    {
        // ── Format A: heading + list ──────────────────────────────────────────
        // Matches <h2> or <h3> containing "Product Specifications", then the
        // immediately following <ul>...</ul> block.
        $cleaned = preg_replace(
            '/<h[23][^>]*>\s*Product Specifications\s*<\/h[23]>\s*<ul>.*?<\/ul>/is',
            '',
            $html
        );

        // ── Format B: bare spec <ul> (no heading) ────────────────────────────
        // Matches a <ul> where EVERY <li> begins with one of the known spec
        // labels inside <strong>. We only strip it if all items look like specs.
        $specLabels = 'Name|Style|Colours?|Colors?|Finish|Material|Size(?: \(Nominal\))?|Thickness|Variation|Application Space|Country of Origin|Quantity Per Box|Qty Per Box';
        $cleaned = preg_replace_callback(
            '/<ul>(.*?)<\/ul>/is',
            function (array $m) use ($specLabels): string {
                $inner = $m[1];
                // Extract all <li> items
                preg_match_all('/<li>(.*?)<\/li>/is', $inner, $items);
                if (empty($items[1])) {
                    return $m[0]; // no items — leave untouched
                }
                // Every item must start with <strong>SpecLabel:?</strong>
                foreach ($items[1] as $item) {
                    if (!preg_match('/^\s*<strong>\s*(?:' . $specLabels . ')\s*:?\s*<\/strong>/i', trim($item))) {
                        return $m[0]; // non-spec item — leave the whole list
                    }
                }
                return ''; // all items are specs — strip the list
            },
            $cleaned
        );

        // Clean up orphaned whitespace/newlines left behind
        $cleaned = preg_replace('/(\s*\n){3,}/', "\n\n", $cleaned);
        $cleaned = trim($cleaned);

        return $cleaned;
    }
}
