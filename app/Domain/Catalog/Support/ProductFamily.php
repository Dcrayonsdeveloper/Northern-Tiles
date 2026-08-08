<?php

namespace App\Domain\Catalog\Support;

use App\Domain\Catalog\Models\VariantFamily;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Str;

/**
 * Read path for variant families on the storefront.
 *
 * A family only renders when it is active AND has 2+ live members, so a
 * lone product never shows a pointless one-card selector.
 */
class ProductFamily
{
    /**
     * Live members of this product's family (including the product itself),
     * ordered by variant_family_position. Null when there is nothing to show.
     */
    public static function siblings(Product $product): ?EloquentCollection
    {
        if (! $product->variant_family_id) {
            return null;
        }

        $family = $product->relationLoaded('variantFamily')
            ? $product->variantFamily
            : VariantFamily::find($product->variant_family_id);

        if (! $family || ! $family->is_active) {
            return null;
        }

        $members = $family->products()
            ->where('is_active', true)
            ->where('status', Product::STATUS_PUBLISHED)
            ->with([
                'media' => fn ($q) => $q->where('type', 'image')
                    ->orderByDesc('is_primary')
                    ->orderBy('sort'),
            ])
            ->get([
                'id', 'name', 'slug', 'sku', 'price', 'compare_at_price', 'image_url',
                'specifications', 'inventory_quantity', 'inventory_policy',
                'variant_family_id', 'variant_family_position',
            ]);

        // The "2+ rule" — a single live member is not a choice.
        return $members->count() > 1 ? $members : null;
    }

    /**
     * Compact payload for the product page selector, or null when hidden.
     *
     * @return array{family: array{id:int,name:string}, variants: array<int, array<string, mixed>>}|null
     */
    public static function selectorFor(Product $product): ?array
    {
        $members = self::siblings($product);

        if (! $members) {
            return null;
        }

        $family = $product->relationLoaded('variantFamily')
            ? $product->variantFamily
            : VariantFamily::find($product->variant_family_id);

        return [
            'family' => [
                'id' => $family->id,
                'name' => $family->name,
            ],
            'variants' => $members->map(fn (Product $sib) => [
                'id' => $sib->id,
                'slug' => $sib->slug,
                'sku' => $sib->sku,
                'label' => self::label($sib, $family->name),
                'name' => $sib->name,
                'price' => (float) $sib->price,
                'compare_at_price' => $sib->compare_at_price !== null ? (float) $sib->compare_at_price : null,
                'image_url' => self::imageUrl($sib),
                'in_stock' => self::inStock($sib),
                'is_current' => $sib->id === $product->id,
            ])->values()->all(),
        ];
    }

    /**
     * Short, human label for a variant card.
     *
     * Prefers the clean name stored in `specifications.name` (the importer
     * keeps the un-SEO'd product name there), then falls back to the display
     * name with its marketing tail stripped. The family prefix is dropped so
     * cards read "ICE MATT 60X246MM" rather than repeating "ARGILE" 18 times.
     */
    public static function label(Product $product, ?string $familyName = null): string
    {
        $specs = is_array($product->specifications) ? $product->specifications : [];

        $label = '';
        foreach (['name', 'colour', 'color', 'model', 'style'] as $key) {
            if (! empty($specs[$key]) && is_string($specs[$key])) {
                $label = $specs[$key];
                break;
            }
        }

        if ($label === '') {
            // "ARGILE ICE MATT 60X246MM - Premium Spanish Porcelain…" -> "ARGILE ICE MATT 60X246MM"
            $label = preg_split('/\s+[-|]\s+/', html_entity_decode($product->name))[0] ?? $product->name;
        }

        $label = trim(preg_replace('/\s+/', ' ', $label));

        if ($familyName && Str::startsWith(Str::upper($label), Str::upper($familyName) . ' ')) {
            $trimmed = trim(Str::substr($label, Str::length($familyName)));
            if ($trimmed !== '') {
                $label = $trimmed;
            }
        }

        return $label;
    }

    private static function imageUrl(Product $product): ?string
    {
        if ($product->relationLoaded('media')) {
            $first = $product->media->first();
            if ($first) {
                return $first->url;
            }
        }

        return $product->image_url ?: null;
    }

    /**
     * Mirrors the in-stock rule used on the product page.
     */
    private static function inStock(Product $product): bool
    {
        if ((float) $product->price <= 0) {
            return false;
        }

        return ($product->inventory_quantity ?? 0) > 0
            || $product->inventory_policy === 'continue';
    }
}
