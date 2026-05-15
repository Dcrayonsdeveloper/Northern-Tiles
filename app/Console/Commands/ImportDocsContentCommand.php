<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\ProductVariant;
use Illuminate\Console\Command;

class ImportDocsContentCommand extends Command
{
    protected $signature = 'ntd:import-docs-content
                            {--sku=    : Only update a single SKU (e.g. NTD3060)}
                            {--dry-run : Preview changes without saving to the database}';

    protected $description = 'Import product name, meta description, and description from the parsed NTD Google Doc JSON (storage/app/ntd-docs-content.json).';

    private array $stats = [
        'total'     => 0,
        'updated'   => 0,
        'skipped'   => 0,
        'no_change' => 0,
    ];

    public function handle(): int
    {
        $dryRun  = (bool) $this->option('dry-run');
        $onlySku = strtoupper(trim((string) $this->option('sku')));

        $jsonPath = storage_path('app/ntd-docs-content.json');
        if (!file_exists($jsonPath)) {
            $this->error("Source file not found: {$jsonPath}");
            return self::FAILURE;
        }

        $products = json_decode(file_get_contents($jsonPath), true);
        if (!$products) {
            $this->error('Failed to parse ntd-docs-content.json');
            return self::FAILURE;
        }

        $this->info($dryRun
            ? '[DRY RUN] Importing content for ' . count($products) . ' products...'
            : 'Importing content for ' . count($products) . ' products...'
        );
        $this->newLine();

        foreach ($products as $item) {
            $this->stats['total']++;
            $sku = strtoupper(trim($item['sku'] ?? ''));

            if ($onlySku !== '' && $sku !== $onlySku) {
                continue;
            }

            if (!$sku || !$item['name']) {
                $this->stats['skipped']++;
                $this->line("  <comment>SKIP</comment> {$sku} - missing name");
                continue;
            }

            $variant = ProductVariant::where('sku', $sku)->with('product')->first();
            if (!$variant || !$variant->product) {
                $this->stats['skipped']++;
                $this->line("  <comment>SKIP</comment> {$sku} - not found in database");
                continue;
            }

            $product     = $variant->product;
            $description = $item['description_html'] ?? null;

            $changes = array_filter([
                'name'             => $item['name'],
                'meta_title'       => $item['name'],
                'meta_description' => $item['meta_description'] ?? null,
                'description'      => $description,
            ], fn ($v) => $v !== null);

            $dirty = collect($changes)->filter(fn ($v, $k) => $product->$k !== $v)->isNotEmpty();

            if (!$dirty) {
                $this->stats['no_change']++;
                $this->line("  <info>-</info>       {$sku} - no changes");
                continue;
            }

            if (!$dryRun) {
                $product->update($changes);
            }

            $this->stats['updated']++;
            $flag = $dryRun ? ' (dry run)' : '';
            $this->line("  <info>UPDATED</info> {$sku} - {$item['name']}{$flag}");
        }

        $this->newLine();
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total in file',               $this->stats['total']],
                ['Updated',                     $dryRun ? $this->stats['updated'] . ' (dry run)' : $this->stats['updated']],
                ['No change',                   $this->stats['no_change']],
                ['Skipped (not in DB / error)', $this->stats['skipped']],
            ]
        );

        if ($dryRun) {
            $this->warn('DRY RUN - no changes were saved.');
        } else {
            $this->info('Import complete.');
        }

        return self::SUCCESS;
    }

    /**
     * Convert the markdown-like content from the Google Doc into clean HTML.
     */
    private function markdownToHtml(string $markdown): string
    {
        $lines  = explode("\n", $markdown);
        $html   = '';
        $inList = false;

        foreach ($lines as $line) {
            // Strip bold markers and trim
            $clean = trim(str_replace(['**', '*'], '', $line));

            if ($clean === '') {
                if ($inList) {
                    $html  .= '</ul>';
                    $inList = false;
                }
                continue;
            }

            // Headings
            if (preg_match('/^(#{1,3})\s+(.+)$/', $clean, $m)) {
                if ($inList) { $html .= '</ul>'; $inList = false; }
                $level = strlen($m[1]) + 1; // ## → h3, ### → h4
                $level = min($level, 4);
                $text  = htmlspecialchars(trim($m[2]), ENT_QUOTES | ENT_HTML5);
                $html .= "<h{$level}>{$text}</h{$level}>";
                continue;
            }

            // Bullet list items (lines starting with - or *)
            if (preg_match('/^[-*]\s+(.+)$/', $clean, $m)) {
                if (!$inList) { $html .= '<ul>'; $inList = true; }
                // Handle bold label: **Label:** text
                $text = preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', htmlspecialchars($m[1], ENT_QUOTES | ENT_HTML5));
                $html .= "<li>{$text}</li>";
                continue;
            }

            // Normal paragraph
            if ($inList) { $html .= '</ul>'; $inList = false; }
            $text  = htmlspecialchars($clean, ENT_QUOTES | ENT_HTML5);
            $html .= "<p>{$text}</p>";
        }

        if ($inList) {
            $html .= '</ul>';
        }

        return $html;
    }
}
