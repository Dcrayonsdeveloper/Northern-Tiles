<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Support\ProductNameMatcher;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Updates product specifications from the client's range sheets.
 *
 * Deliberately narrow, in both directions:
 *
 *   - Only the twelve spec columns below are read. Everything else in the
 *     sheet — images above all — is ignored.
 *   - Only products named in the sheet are touched. A name with no product is
 *     skipped, never created.
 *   - A sheet cell with a value replaces whatever the product had. A blank
 *     cell leaves the existing value alone, so a half-filled row cannot wipe
 *     specs that are already correct.
 *   - Spec keys outside the twelve — name, core, underlay, pricing — are
 *     carried through untouched.
 *
 * Colours and finishes are stored " + " separated rather than comma
 * separated, because the storefront renders each as a picker and the client
 * reads "Pink + Grey + Black" as three swatches where a comma list reads as
 * one sentence.
 */
class SyncProductSpecsCommand extends Command
{
    protected $signature = 'products:sync-specs
                            {csv* : One or more CSV exports of the range sheets}
                            {--dry-run : Report what would change without writing}
                            {--show-unmatched : List every unmatched name}';

    protected $description = 'Update product specifications from the range sheets';

    /** Sheet header (lowercased) => specifications key. */
    private const COLUMNS = [
        'style'                    => 'style',
        'colours'                  => 'colour',
        'colors'                   => 'colour',
        'colour'                   => 'colour',
        'finish'                   => 'finish',
        'space'                    => 'application_space',
        'application space'        => 'application_space',
        'size'                     => 'size_nominal',
        'material'                 => 'material',
        'quantity per box'         => 'quantity_per_box',
        'quantity per box (m2)'    => 'quantity_per_box',
        'country of origin'        => 'country_of_origin',
        'variation'                => 'variation',
        'slip rating'              => 'slip_rating',
        'thickness'                => 'thickness',
        'thickness (mm)'           => 'thickness',
        'number of faces'          => 'number_of_faces',
    ];

    /** Stored " + " separated so the storefront reads them as separate chips. */
    private const PLUS_JOINED = ['colour', 'finish'];

    public function handle(): int
    {
        $matcher = new ProductNameMatcher();

        $updated = 0;
        $unchanged = 0;
        $unmatched = [];
        $ambiguous = [];
        $fieldCounts = [];
        $rowsRead = 0;

        foreach ((array) $this->argument('csv') as $path) {
            if (! is_file($path)) {
                $this->error("No such file: {$path}");

                continue;
            }

            [$rows, $tabFields] = $this->readSheet($path);
            $rowsRead += count($rows);

            $this->line('');
            $this->info(basename($path) . ': ' . count($rows) . ' row(s), spec columns: '
                . (implode(', ', $tabFields) ?: 'none'));

            foreach ($rows as $row) {
                $resolved = $matcher->resolve([$row['name']]);

                if ($resolved['ambiguous']) {
                    $ambiguous[] = $row['name'];

                    continue;
                }

                if (! $resolved['ids']) {
                    $unmatched[] = $row['name'];

                    continue;
                }

                $product = Product::find($resolved['ids'][0]);

                if (! $product) {
                    $unmatched[] = $row['name'];

                    continue;
                }

                $specs = $product->specifications;
                $specs = is_array($specs) ? $specs : [];
                $before = $specs;

                foreach ($row['specs'] as $key => $value) {
                    $specs[$key] = $value;
                    $fieldCounts[$key] = ($fieldCounts[$key] ?? 0) + 1;
                }

                if ($specs === $before) {
                    $unchanged++;

                    continue;
                }

                if (! $this->option('dry-run')) {
                    // Bare update: specifications is the only column that should
                    // move, and touching updated_at across a thousand rows
                    // erases any real "recently changed" signal.
                    DB::table('products')->where('id', $product->id)->update([
                        'specifications' => json_encode($specs),
                    ]);
                }

                $updated++;
            }
        }

        $this->line('');
        $this->info("rows read           : {$rowsRead}");
        $this->info("products updated    : {$updated}");
        $this->line("already correct     : {$unchanged}");
        $this->warn('name not in catalogue: ' . count($unmatched));
        $this->warn('ambiguous name       : ' . count($ambiguous));

        if ($fieldCounts) {
            $this->line('');
            $this->line('values written per field:');
            ksort($fieldCounts);

            foreach ($fieldCounts as $field => $n) {
                $this->line(sprintf('   %-20s %d', $field, $n));
            }
        }

        $limit = $this->option('show-unmatched') ? count($unmatched) : 12;

        foreach (array_slice($unmatched, 0, $limit) as $u) {
            $this->line("  ? {$u}");
        }

        if (count($unmatched) > $limit) {
            $this->line('  … ' . (count($unmatched) - $limit) . ' more');
        }

        foreach (array_slice($ambiguous, 0, 8) as $a) {
            $this->line("  ~ {$a}");
        }

        if ($this->option('dry-run')) {
            $this->line('');
            $this->info('[dry run] Nothing was written.');
        }

        return self::SUCCESS;
    }

    /**
     * @return array{0: list<array{name:string, specs:array<string,string>}>, 1: list<string>}
     */
    private function readSheet(string $path): array
    {
        $handle = fopen($path, 'r');
        $map = null;
        $iName = null;
        $rows = [];
        $fields = [];

        while (($raw = fgetcsv($handle)) !== false) {
            if ($map === null) {
                // Header detection scans every cell: one tab opens with an
                // unlabelled thickness column, which pushes the real headers
                // one to the right.
                $candidate = [];
                $nameAt = null;

                foreach ($raw as $i => $cell) {
                    $h = strtolower(trim((string) $cell));

                    if ($h === 'name' && $nameAt === null) {
                        $nameAt = $i;
                    }

                    if (isset(self::COLUMNS[$h]) && ! in_array(self::COLUMNS[$h], $candidate, true)) {
                        $candidate[$i] = self::COLUMNS[$h];
                    }
                }

                if ($nameAt !== null && $candidate) {
                    $map = $candidate;
                    $iName = $nameAt;
                    $fields = array_values(array_unique($candidate));
                }

                continue;
            }

            $name = trim((string) ($raw[$iName] ?? ''));

            if ($name === '') {
                continue;
            }

            $specs = [];

            foreach ($map as $i => $key) {
                $value = trim((string) ($raw[$i] ?? ''));

                if ($value === '') {
                    // Blank means "no new information", not "clear it".
                    continue;
                }

                $specs[$key] = in_array($key, self::PLUS_JOINED, true)
                    ? $this->plusJoin($value)
                    : preg_replace('/\s+/u', ' ', $value);
            }

            if ($specs) {
                $rows[] = ['name' => $name, 'specs' => $specs];
            }
        }

        fclose($handle);

        return [$rows, $fields];
    }

    /** "Pink, Grey, Black" -> "Pink + Grey + Black". */
    private function plusJoin(string $value): string
    {
        $parts = preg_split('/\s*[,\/;+]\s*/u', $value, -1, PREG_SPLIT_NO_EMPTY);

        $parts = array_values(array_filter(array_map(
            fn ($p) => trim(preg_replace('/\s+/u', ' ', $p)),
            $parts,
        )));

        return implode(' + ', $parts);
    }
}
