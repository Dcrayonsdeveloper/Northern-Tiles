<?php

namespace App\Domain\Catalog\Support;

use App\Models\Product;

/**
 * Resolves the client's plain product names to catalogue rows.
 *
 * Their range sheets never match the catalogue byte for byte. The database
 * appends marketing copy in two different shapes —
 *
 *   COCO WHITE GLOSS 50X150MM Subway Tile - Spanish Porcelain
 *   ALBA WHITE SATIN 600X600MM Marble Look Porcelain Tile
 *
 * so there is no separator to rely on; sizes are written 600*600 in the sheets
 * and 600X600 in the catalogue; and a trailing "Rec." appears on one side only.
 *
 * Matching falls through three tiers, in order of how much each has to assume.
 * Anything with more than one candidate is reported as ambiguous rather than
 * resolved by taking the first: picking wrong is invisible once done, and the
 * ambiguous list is always short enough to read.
 *
 * Extracted so that filing products and deleting them agree on what a name
 * means — a delete that matched more loosely than the assign that preceded it
 * would remove things nobody chose.
 */
class ProductNameMatcher
{
    /** @var array<string,int> normalised name => product id */
    private array $exact = [];

    /** @var list<array{id:int,key:string,tokens:list<string>}> */
    private array $all = [];

    public function __construct()
    {
        Product::query()->select(['id', 'name'])->chunkById(500, function ($chunk) {
            foreach ($chunk as $product) {
                $key = self::key($product->name);

                $this->exact[$key] ??= $product->id;
                $this->exact[self::key(preg_split('/\s+[-–|]\s+/', $product->name)[0] ?? $product->name)] ??= $product->id;

                $this->all[] = [
                    'id'     => $product->id,
                    'key'    => $key,
                    'tokens' => self::tokens($product->name),
                ];
            }
        });
    }

    /**
     * @param  iterable<string>  $names
     * @return array{ids:list<int>, tiers:array{exact:int,prefix:int,tokens:int}, ambiguous:list<string>, unmatched:list<string>}
     */
    public function resolve(iterable $names): array
    {
        $ids       = [];
        $tiers     = ['exact' => 0, 'prefix' => 0, 'tokens' => 0];
        $ambiguous = [];
        $unmatched = [];

        foreach ($names as $name) {
            $key = self::key($name);
            // "Rec." is a finish note the catalogue does not always carry.
            $bare = preg_replace('/REC$/', '', $key);

            if ($id = $this->exact[$key] ?? $this->exact[$bare] ?? null) {
                $ids[$id] = true;
                $tiers['exact']++;

                continue;
            }

            $hits = array_values(array_filter($this->all, fn ($p) => str_starts_with($p['key'], $bare)));

            if (count($hits) === 1) {
                $ids[$hits[0]['id']] = true;
                $tiers['prefix']++;

                continue;
            }

            if (count($hits) > 1) {
                $ambiguous[] = $name . '  (' . count($hits) . ' candidates)';

                continue;
            }

            // Every word present, something extra in between — for rows where
            // the catalogue carries a supplier code mid-name.
            $want = self::tokens($name);
            $hits = array_values(array_filter($this->all, fn ($p) => ! array_diff($want, $p['tokens'])));

            if (count($hits) === 1) {
                $ids[$hits[0]['id']] = true;
                $tiers['tokens']++;
            } elseif (count($hits) > 1) {
                $ambiguous[] = $name . '  (' . count($hits) . ' candidates)';
            } else {
                $unmatched[] = $name;
            }
        }

        return [
            'ids'       => array_keys($ids),
            'tiers'     => $tiers,
            'ambiguous' => $ambiguous,
            'unmatched' => $unmatched,
        ];
    }

    /**
     * Comparison key: case, spacing, punctuation and the '*'/'X' size separator
     * all differ between the sheets and the catalogue, and none carry meaning.
     */
    public static function key(string $s): string
    {
        return preg_replace('/[^A-Z0-9]/', '', str_replace('*', 'X', strtoupper($s)));
    }

    /**
     * Word set for the last-resort tier. Size tokens stay — they are the only
     * thing separating one variant of a range from another.
     */
    public static function tokens(string $s): array
    {
        $parts = preg_split('/[^A-Z0-9.]+/', str_replace('*', 'X', strtoupper($s)), -1, PREG_SPLIT_NO_EMPTY);

        return array_values(array_unique($parts));
    }
}
