<?php

namespace App\Domain\Builder\Services;

use App\Models\Product;

/**
 * Works out whether a trade-catalogue product is priced by the square metre.
 *
 * The portal used to print "/ sqm" against every price, so a 20kg bag of ARDEX
 * grout read as "$52.50 / sqm". Only tiles and flooring are sold by area;
 * adhesives, grouts, silicones, spacers, levelling clips and trims are sold per
 * unit.
 *
 * This lives in the Builder domain and is called only from the trade
 * controllers. It reads existing columns and derives an answer — it does not
 * add or modify any product data, and the retail storefront and admin are
 * untouched by it.
 *
 * Two signals, because neither alone is sufficient:
 *
 *  - sqm_per_box > 0 is conclusive when present (nothing in a trade-supply
 *    category carries it) but is unset on plenty of genuine tiles — subway,
 *    external porcelain, italian porcelain, terrazzo and stone all have it
 *    empty, so it cannot be used on its own.
 *  - The category is therefore matched too, on keywords rather than a fixed
 *    slug list, so a newly added "porcelain-600x600" is classified correctly
 *    without a code change.
 */
class TradeUnitResolver
{
    /** Category-slug fragments that mean "surface material, sold by area". */
    private const AREA_KEYWORDS = [
        'tile', 'porcelain', 'ceramic', 'subway', 'terrazzo', 'mosaic',
        'marble', 'stone', 'paver', 'travertine', 'slate',
        'floor', 'flooring', 'hybrid', 'timber', 'oak', 'herringbone',
        'laminate', 'vinyl', 'plank', 'decking',
        'ntd', 'sward', 'baltic', 'tundra', 'enzo',
    ];

    /**
     * Accessories whose slug contains an area keyword but which are sold per
     * unit. Checked first, so "tile-crosses" is not mistaken for a tile.
     */
    private const NEVER_AREA = [
        'tile-crosses', 'tiling-waterproofing', 'levelling-clips',
        'levelling-system', 'levelling-systems', 'spacers', 'quad',
        'smart-waste', 'tile-cutter', 'tile-cutters', 'trims', 'trim',
    ];

    /**
     * True when the product should be priced and ordered per square metre.
     */
    public function isSoldPerSquareMetre(Product $product): bool
    {
        $slugs = $this->categorySlugs($product);

        foreach ($slugs as $slug) {
            if (in_array($slug, self::NEVER_AREA, true)) {
                return false;
            }
        }

        // Conclusive: a per-box area only exists on boxed tiles and flooring.
        if ((float) $product->sqm_per_box > 0) {
            return true;
        }

        foreach ($slugs as $slug) {
            foreach (self::AREA_KEYWORDS as $keyword) {
                if (str_contains($slug, $keyword)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * "sqm" for tiles and flooring, null for everything else. The trade views
     * print the unit only when it is present, so a null simply drops the
     * suffix rather than substituting some other wording.
     */
    public function unitLabel(Product $product): ?string
    {
        return $this->isSoldPerSquareMetre($product) ? 'sqm' : null;
    }

    /**
     * Stamp the answer onto the model for the Inertia payload. Returns the same
     * product so it can be used inline in a map/transform.
     */
    public function decorate(Product $product): Product
    {
        $perSqm = $this->isSoldPerSquareMetre($product);

        $product->setAttribute('is_sold_per_sqm', $perSqm);
        $product->setAttribute('unit_label', $perSqm ? 'sqm' : null);

        return $product;
    }

    /**
     * The primary category plus any many-to-many categories, lowercased.
     * Relations are only read when already loaded or loadable, so this never
     * turns a product listing into an N+1.
     */
    private function categorySlugs(Product $product): array
    {
        $slugs = [];

        $primary = $product->relationLoaded('category')
            ? $product->getRelation('category')
            : $product->category()->first();

        if ($primary?->slug) {
            $slugs[] = strtolower($primary->slug);
        }

        if ($product->relationLoaded('categories')) {
            foreach ($product->getRelation('categories') as $category) {
                if ($category->slug) {
                    $slugs[] = strtolower($category->slug);
                }
            }
        }

        return array_unique($slugs);
    }
}
