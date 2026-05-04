<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\Attribute;
use App\Domain\Catalog\Models\AttributeValue;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportProductAttributes extends Command
{
    protected $signature = 'products:import-attributes
                            {csv : Path to the CSV file (relative to storage/app or absolute)}
                            {--dry-run : Show planned changes without persisting}';

    protected $description = 'Tag products with colour/space/size/material/finish/style attributes from a CSV file (matched by SKU).';

    /**
     * Maps CSV column headers (lowercased, trimmed) to attribute slugs.
     * Add aliases here when the spreadsheet uses different wording.
     */
    private const COLUMN_MAP = [
        'colour'  => 'color',
        'colours' => 'color',
        'color'   => 'color',
        'colors'  => 'color',
        'space'   => 'space',
        'spaces'  => 'space',
        'size'    => 'size',
        'sizes'   => 'size',
        'material' => 'material',
        'materials' => 'material',
        'finish'  => 'finish',
        'finishes' => 'finish',
        'style'   => 'style',
        'styles'  => 'style',
    ];

    public function handle(): int
    {
        $path = $this->argument('csv');
        if (! is_file($path)) {
            $candidate = storage_path('app/' . ltrim($path, '/'));
            if (is_file($candidate)) {
                $path = $candidate;
            } else {
                $this->error("CSV not found: {$path}");
                return self::FAILURE;
            }
        }

        $dryRun = (bool) $this->option('dry-run');
        $handle = fopen($path, 'r');
        if (! $handle) {
            $this->error("Could not open {$path}");
            return self::FAILURE;
        }

        $headers = fgetcsv($handle);
        if (! $headers) {
            $this->error('CSV is empty.');
            fclose($handle);
            return self::FAILURE;
        }
        $headers = array_map(fn ($h) => Str::lower(trim((string) $h)), $headers);

        $skuCol = $this->findColumn($headers, ['code (sku)', 'code', 'sku']);
        if ($skuCol === null) {
            $this->error('CSV must include a "Code (sku)" / "Code" / "SKU" column.');
            fclose($handle);
            return self::FAILURE;
        }

        $attrColumns = [];
        foreach ($headers as $i => $h) {
            if (isset(self::COLUMN_MAP[$h])) {
                $attrColumns[$i] = self::COLUMN_MAP[$h];
            }
        }
        if (empty($attrColumns)) {
            $this->error('No attribute columns recognised. Expected one of: ' . implode(', ', array_keys(self::COLUMN_MAP)));
            fclose($handle);
            return self::FAILURE;
        }

        $attributes = Attribute::whereIn('slug', array_unique(array_values($attrColumns)))
            ->with('values')
            ->get()
            ->keyBy('slug');

        $missingAttrs = collect($attrColumns)->unique()->diff($attributes->keys());
        if ($missingAttrs->isNotEmpty()) {
            $this->error('Run AttributeSeeder first — missing attributes: ' . $missingAttrs->implode(', '));
            fclose($handle);
            return self::FAILURE;
        }

        $stats = ['rows' => 0, 'matched' => 0, 'skipped' => 0, 'tagged' => 0, 'created_values' => 0];
        $newValueWarnings = [];

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                $stats['rows']++;
                $sku = trim((string) ($row[$skuCol] ?? ''));
                if ($sku === '') {
                    $stats['skipped']++;
                    continue;
                }

                // SKUs live on product_variants; resolve to the parent product.
                $product = Product::whereHas('variants', fn ($q) => $q->where('sku', $sku))->first();

                if (! $product) {
                    $this->warn("  skipped: SKU {$sku} not found");
                    $stats['skipped']++;
                    continue;
                }

                $stats['matched']++;
                $valueIds = [];

                foreach ($attrColumns as $colIndex => $attrSlug) {
                    $cell = trim((string) ($row[$colIndex] ?? ''));
                    if ($cell === '') {
                        continue;
                    }
                    $attribute = $attributes[$attrSlug];

                    foreach (array_filter(array_map('trim', explode(',', $cell))) as $rawValue) {
                        $valueSlug = Str::slug($rawValue);
                        $value = $attribute->values->firstWhere('slug', $valueSlug);

                        if (! $value) {
                            $value = AttributeValue::create([
                                'attribute_id' => $attribute->id,
                                'value' => $rawValue,
                                'slug' => $valueSlug,
                                'is_active' => true,
                            ]);
                            $attribute->values->push($value);
                            $stats['created_values']++;
                            $newValueWarnings[] = "{$attribute->slug}/{$valueSlug} ({$rawValue})";
                        }

                        $valueIds[] = $value->id;
                    }
                }

                if (! empty($valueIds)) {
                    if (! $dryRun) {
                        $product->attributeValues()->syncWithoutDetaching(array_unique($valueIds));
                    }
                    $stats['tagged'] += count(array_unique($valueIds));
                }
            }

            if ($dryRun) {
                DB::rollBack();
                $this->warn('DRY RUN — no changes persisted.');
            } else {
                DB::commit();
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);
            $this->error('Import failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        fclose($handle);

        $this->info(sprintf(
            'Rows: %d | matched: %d | skipped: %d | tag-links: %d | new values created: %d',
            $stats['rows'], $stats['matched'], $stats['skipped'], $stats['tagged'], $stats['created_values'],
        ));

        if (! empty($newValueWarnings)) {
            $this->warn('Auto-created attribute values (review for typos):');
            foreach (array_unique($newValueWarnings) as $w) {
                $this->line('  - ' . $w);
            }
        }

        return self::SUCCESS;
    }

    private function findColumn(array $headers, array $candidates): ?int
    {
        foreach ($candidates as $name) {
            $idx = array_search(Str::lower(trim($name)), $headers, true);
            if ($idx !== false) {
                return $idx;
            }
        }
        return null;
    }
}
