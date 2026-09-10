<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Client-specified category restructure.
 *
 *   Builders Range      (root, already existed but had no children)
 *   Clearance/Specials  (root, new)
 *     both with: Hybrid Flooring, Subway Tiles, Indoor Tiles,
 *                Outdoor Tiles, Engineered Flooring
 *
 *   Tiles gains Decorative Tiles, Mosaic and Tiles.
 *
 * Additive and idempotent: rows are matched on slug and inserted only when
 * missing, so re-running touches nothing. `slug` is unique across the whole
 * table, so the five repeated sub-names are prefixed per parent.
 *
 * Products are attached separately from the client's product sheet — these
 * categories are created empty on purpose.
 */
return new class extends Migration
{
    /** Sub-categories shared by Builders Range and Clearance/Specials. */
    private const SHARED_SUBS = [
        'Hybrid Flooring'     => 'hybrid-flooring',
        'Subway Tiles'        => 'subway-tiles',
        'Indoor Tiles'        => 'indoor-tiles',
        'Outdoor Tiles'       => 'outdoor-tiles',
        'Engineered Flooring' => 'engineered-flooring',
    ];

    public function up(): void
    {
        $roots = [
            ['name' => 'Builders Range',     'slug' => 'builders-range',     'prefix' => 'builders',  'sort' => 60],
            ['name' => 'Clearance/Specials', 'slug' => 'clearance-specials', 'prefix' => 'clearance', 'sort' => 70],
        ];

        foreach ($roots as $root) {
            $parentId = $this->ensure($root['name'], $root['slug'], null, $root['sort']);

            $sort = 0;
            foreach (self::SHARED_SUBS as $name => $suffix) {
                $this->ensure($name, "{$root['prefix']}-{$suffix}", $parentId, $sort += 10);
            }
        }

        // Tiles additions. The nav's "Tiles" entry points at ?category=tiles,
        // which had no category behind it — this creates it.
        $tilesId = $this->ensure('Tiles', 'tiles', null, 50);

        $this->ensure('Decorative Tiles', 'decorative-tiles', $tilesId, 30);
        $this->ensure('Mosaic', 'mosaic', $tilesId, 40);

        // Subway and External Porcelain already exist under ntd-tiles; they are
        // left where they are so existing product links keep resolving.
    }

    public function down(): void
    {
        $slugs = ['decorative-tiles', 'mosaic'];

        foreach (['builders', 'clearance'] as $prefix) {
            foreach (self::SHARED_SUBS as $suffix) {
                $slugs[] = "{$prefix}-{$suffix}";
            }
        }
        $slugs[] = 'clearance-specials';

        // 'builders-range' and 'tiles' are intentionally not dropped —
        // builders-range predates this migration, and products may have been
        // attached to tiles in the meantime.
        DB::table('categories')->whereIn('slug', $slugs)->delete();
    }

    /** Insert the category if its slug is not already taken; return its id. */
    private function ensure(string $name, string $slug, ?int $parentId, int $sort): int
    {
        $existing = DB::table('categories')->where('slug', $slug)->first();

        if ($existing) {
            return (int) $existing->id;
        }

        return (int) DB::table('categories')->insertGetId([
            'name'       => $name,
            'slug'       => $slug,
            'parent_id'  => $parentId,
            'sort'       => $sort,
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};
