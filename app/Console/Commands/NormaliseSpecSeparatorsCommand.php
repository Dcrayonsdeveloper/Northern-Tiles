<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Rewrites colour and finish to " + " separated, catalogue-wide.
 *
 * The spec sync already writes them that way, but it only touched products
 * named in the range sheets — everything else still carried the comma or
 * slash form it was imported with, so two products side by side read
 * differently on the same page.
 *
 * Colour and finish are joined with " + ". Slip rating is joined with " / ",
 * the way the standard writes it — the sheets carry the same rating three
 * ways ("R11, P5", "P3/R10", "R11 / P5 (Maximum Slip Resistance)") and a comma
 * between two ratings reads as two separate ones.
 *
 * Style, space and everything else keep whatever punctuation the supplier
 * used: only these three fields are rendered as lists on the product page.
 *
 * Hyphens are never split, so "External High-Grip" survives as one value.
 */
class NormaliseSpecSeparatorsCommand extends Command
{
    protected $signature = 'products:normalise-spec-separators
                            {--dry-run : Report what would change without writing}';

    protected $description = 'Normalise colour, finish and slip rating separators across the catalogue';

    /** Joined with " + ". */
    private const PLUS_FIELDS = ['colour', 'color', 'finish'];

    /**
     * Joined with " / ", the way the slip standard writes it: R11 / P5. The
     * sheets carry the same rating three ways — "R11, P5", "P3/R10" and
     * "R11 / P5 (Maximum Slip Resistance)" — and a comma between two ratings
     * reads as a list of products' worth of ratings rather than one.
     */
    private const SLASH_FIELDS = ['slip_rating'];

    /** Sheet placeholders meaning "none". Cleared so the row hides. */
    private const EMPTY_MARKERS = ['-', '–', '—', 'n/a', 'na', 'none'];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $changed = 0;
        $scanned = 0;
        $examples = [];

        Product::query()
            ->select(['id', 'name', 'specifications'])
            ->orderBy('id')
            ->chunkById(300, function ($products) use (&$changed, &$scanned, &$examples, $dryRun) {
                foreach ($products as $product) {
                    $scanned++;

                    $specs = is_array($product->specifications) ? $product->specifications : [];

                    if (! $specs) {
                        continue;
                    }

                    $before = $specs;

                    foreach ([' + ' => self::PLUS_FIELDS, ' / ' => self::SLASH_FIELDS] as $glue => $fields) {
                        foreach ($fields as $field) {
                            if (! isset($specs[$field])) {
                                continue;
                            }

                            $value = trim((string) $specs[$field]);

                            if ($value === '') {
                                continue;
                            }

                            if (in_array(mb_strtolower($value), self::EMPTY_MARKERS, true)) {
                                $specs[$field] = '';

                                continue;
                            }

                            $specs[$field] = $this->joinWith($value, $glue);
                        }
                    }

                    if ($specs === $before) {
                        continue;
                    }

                    if (count($examples) < 12) {
                        foreach (array_merge(self::PLUS_FIELDS, self::SLASH_FIELDS) as $field) {
                            if (isset($before[$field]) && ($before[$field] ?? null) !== ($specs[$field] ?? null)) {
                                $examples[] = sprintf(
                                    '%-40s %-9s %s  ->  %s',
                                    mb_strimwidth($product->name, 0, 40, '…'),
                                    $field,
                                    $before[$field],
                                    $specs[$field],
                                );
                            }
                        }
                    }

                    if (! $dryRun) {
                        // specifications only; updated_at stays put so the
                        // "recently changed" signal survives a bulk tidy.
                        DB::table('products')->where('id', $product->id)->update([
                            'specifications' => json_encode($specs),
                        ]);
                    }

                    $changed++;
                }
            });

        $this->info("products scanned : {$scanned}");
        $this->info("products changed : {$changed}");

        if ($examples) {
            $this->line('');
            $this->line('examples:');

            foreach ($examples as $e) {
                $this->line("   {$e}");
            }
        }

        if ($dryRun) {
            $this->line('');
            $this->info('[dry run] Nothing was written.');
        }

        return self::SUCCESS;
    }

    /**
     * "Milk, Cream / Soft White" -> "Milk + Cream + Soft White" (or " / ").
     */
    private function joinWith(string $value, string $glue): string
    {
        // Comma, slash, semicolon and an existing plus are separators; a hyphen
        // is not, so "External High-Grip" stays whole.
        //
        // Except inside brackets, where a slash is part of the phrase rather
        // than a separator: "Bone (Warm Off-White / Soft Beige)" split on the
        // slash leaves "Bone (Warm Off-White" and "Soft Beige)", and
        // "R11 / P5 (Maximum Slip Resistance)" is already written the way it
        // should read. When brackets are present, only commas and semicolons
        // separate.
        $pattern = str_contains($value, '(')
            ? '/\s*[,;]\s*/u'
            : '/\s*[,\/;+]\s*/u';

        $parts = preg_split($pattern, $value, -1, PREG_SPLIT_NO_EMPTY);

        $parts = array_values(array_filter(array_map(
            fn ($p) => trim(preg_replace('/\s+/u', ' ', $p)),
            $parts,
        )));

        return implode($glue, $parts);
    }
}
