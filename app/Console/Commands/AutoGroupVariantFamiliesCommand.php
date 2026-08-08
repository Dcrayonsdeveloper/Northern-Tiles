<?php

namespace App\Console\Commands;

use App\Domain\Catalog\Models\VariantFamily;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Bootstraps variant families from product names.
 *
 * The catalogue names every range with a leading brand/range token
 * ("ARGILE ICE MATT 60X246MM", "COCO VERDE GLOSS 50X150MM"), so the leading
 * token is a reliable family key. Ranges the heuristic gets wrong can be
 * fixed by hand in Admin → Variant Families.
 */
class AutoGroupVariantFamiliesCommand extends Command
{
    protected $signature = 'variant-families:auto-group
        {--dry-run : Show what would change without writing anything}
        {--only= : Comma-separated family names to limit the run to (e.g. ARGILE,COCO)}
        {--except= : Comma-separated family names to skip (e.g. ARDEX)}
        {--min=2 : Minimum products required to form a family}
        {--force : Also regroup products that already belong to a family}
        {--reset : Detach every product and delete every family, then stop}';

    protected $description = 'Group products into variant families by the leading token of their name';

    /**
     * First words that never identify a range on their own — when one of these
     * leads, the family key falls back to the first two words.
     */
    private const GENERIC_FIRST_WORDS = [
        'THE', 'NEW', 'PREMIUM', 'LUXURY', 'NATURAL', 'CLASSIC', 'MODERN', 'ROYAL',
        'WHITE', 'BLACK', 'GREY', 'GRAY', 'BEIGE', 'BROWN', 'BLUE', 'GREEN', 'RED',
        'CREAM', 'IVORY', 'CHARCOAL', 'SILVER', 'GOLD', 'DARK', 'LIGHT', 'WARM',
        'STONE', 'TILE', 'TILES', 'FLOOR', 'WALL', 'POOL', 'SUBWAY', 'MOSAIC',
        'HYBRID', 'TIMBER', 'PORCELAIN', 'CERAMIC', 'MARBLE', 'CONCRETE', 'TERRAZZO',
        'LA', 'LE', 'DI', 'DE', 'EL', 'DO', 'X',
    ];

    public function handle(): int
    {
        if ($this->option('reset')) {
            return $this->reset();
        }

        $min = max(2, (int) $this->option('min'));
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        $only = $this->nameList('only');
        $except = $this->nameList('except');

        $products = Product::query()
            ->when(! $force, fn ($q) => $q->whereNull('variant_family_id'))
            ->orderBy('sku')
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'variant_family_id']);

        if ($products->isEmpty()) {
            $this->info('No products to group.' . ($force ? '' : ' (use --force to regroup already-grouped products)'));

            return self::SUCCESS;
        }

        $buckets = $products
            ->groupBy(fn (Product $p) => $this->familyKey($p->name))
            ->reject(fn ($group, $key) => $key === '' || $group->count() < $min)
            ->when($only, fn ($c) => $c->filter(fn ($group, $key) => in_array($key, $only, true)))
            ->when($except, fn ($c) => $c->reject(fn ($group, $key) => in_array($key, $except, true)))
            ->sortKeys();

        if ($buckets->isEmpty()) {
            $this->warn('No group reached the minimum of ' . $min . ' products.');

            return self::SUCCESS;
        }

        $this->table(
            ['Family', 'Products', 'Example'],
            $buckets->map(fn ($group, $key) => [
                $key,
                $group->count(),
                Str::limit($group->first()->name, 55),
            ])->values()->all()
        );

        $this->line('');
        $this->info($buckets->count() . ' families / ' . $buckets->flatten()->count() . ' products.');

        $large = $buckets->filter(fn ($g) => $g->count() > 30);
        if ($large->isNotEmpty()) {
            $this->warn('Large families (review these — they may be a brand rather than a range): '
                . $large->keys()->implode(', '));
        }

        if ($dryRun) {
            $this->line('');
            $this->comment('Dry run — nothing was written. Re-run without --dry-run to apply.');

            return self::SUCCESS;
        }

        $created = 0;
        $assigned = 0;
        $position = (int) VariantFamily::max('position');

        DB::transaction(function () use ($buckets, &$created, &$assigned, &$position) {
            foreach ($buckets as $name => $group) {
                $family = VariantFamily::firstOrCreate(
                    ['name' => $name],
                    ['is_active' => true, 'position' => ++$position]
                );

                if ($family->wasRecentlyCreated) {
                    $created++;
                }

                // Continue after any members the family already has.
                $slot = (int) Product::where('variant_family_id', $family->id)
                    ->whereNotIn('id', $group->pluck('id'))
                    ->max('variant_family_position');

                foreach ($group as $product) {
                    Product::whereKey($product->id)->update([
                        'variant_family_id' => $family->id,
                        'variant_family_position' => $slot++,
                    ]);
                    $assigned++;
                }
            }
        });

        $this->info("Done — {$created} families created, {$assigned} products assigned.");
        $this->comment('Review and adjust at /admin/variant-families');

        return self::SUCCESS;
    }

    /**
     * @return array<int, string>
     */
    private function nameList(string $option): array
    {
        return collect(explode(',', (string) $this->option($option)))
            ->map(fn ($s) => Str::upper(trim($s)))
            ->filter()
            ->values()
            ->all();
    }

    private function reset(): int
    {
        if (! $this->confirm('Detach ALL products from families and delete ALL variant families?', false)) {
            $this->comment('Aborted.');

            return self::SUCCESS;
        }

        DB::transaction(function () {
            Product::whereNotNull('variant_family_id')->update([
                'variant_family_id' => null,
                'variant_family_position' => 0,
            ]);
            VariantFamily::query()->update(['default_product_id' => null]);
            VariantFamily::query()->delete();
        });

        $this->info('All variant families removed. No products were deleted.');

        return self::SUCCESS;
    }

    /**
     * Family key for a product name — the leading range token, in caps.
     */
    private function familyKey(string $name): string
    {
        // Drop the SEO tail: "ARGILE ICE MATT 60X246MM - Premium Spanish…"
        $head = preg_split('/\s+[-|]\s+/', html_entity_decode($name))[0] ?? $name;

        $words = preg_split('/\s+/', Str::upper(trim($head)), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (! $words) {
            return '';
        }

        $first = preg_replace('/[^A-Z0-9.]/', '', $words[0]);

        $tooWeak = strlen($first) < 3
            || preg_match('/\d/', $first)
            || in_array($first, self::GENERIC_FIRST_WORDS, true);

        if (! $tooWeak) {
            return $first;
        }

        // Fall back to two words ("STONE FOCUS", "GEO STONE", "20MM SANDSTONE").
        $second = isset($words[1]) ? preg_replace('/[^A-Z0-9.]/', '', $words[1]) : '';

        if ($second === '' || strlen($second) < 3) {
            return '';
        }

        return trim($first . ' ' . $second);
    }
}
