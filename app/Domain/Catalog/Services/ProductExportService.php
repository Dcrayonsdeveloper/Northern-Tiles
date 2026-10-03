<?php

namespace App\Domain\Catalog\Services;

use App\Models\Product;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Exports the catalogue to a CSV that Excel opens natively.
 *
 * Every product column goes out, plus one column per distinct specification
 * key — the specs are a JSON blob on the row, and a single blob cell is not
 * something anyone can sort or filter in a spreadsheet.
 *
 * The file is streamed and the query chunked. The catalogue is well past 600
 * products with descriptions and spec blobs on each, and the production box
 * has under 2 GB of RAM: building the whole thing in memory first is how an
 * export turns into a 502.
 */
class ProductExportService
{
    /** Rows per database chunk. Small enough to stay flat in memory. */
    private const CHUNK = 200;

    /**
     * Columns taken straight off the product, in the order they appear.
     *
     * Keyed by header; the value reads it off the model. Anything needing a
     * relation is resolved here rather than in the row loop, so the header
     * list and the value list cannot drift apart.
     *
     * @return array<string, callable(Product): (string|int|float|null)>
     */
    private function columns(): array
    {
        return [
            'id' => fn (Product $p) => $p->id,
            'name' => fn (Product $p) => $p->name,
            'sku' => fn (Product $p) => $p->sku,
            'slug' => fn (Product $p) => $p->slug,
            'status' => fn (Product $p) => $p->status,
            'is_active' => fn (Product $p) => $this->bool($p->is_active),
            'is_featured' => fn (Product $p) => $this->bool($p->is_featured),
            'price' => fn (Product $p) => $p->price,
            'compare_at_price' => fn (Product $p) => $p->compare_at_price,
            'cost' => fn (Product $p) => $p->cost,
            'inventory_quantity' => fn (Product $p) => $p->inventory_quantity,
            'inventory_policy' => fn (Product $p) => $p->inventory_policy,
            // The availability the storefront actually shows, so the sheet and
            // the site answer the same question. Mirrors Product::isInStock()
            // plus the price check that gates Add to Cart.
            'available_on_site' => fn (Product $p) => $this->bool(
                (float) $p->price > 0
                && ((int) $p->inventory_quantity > 0 || $p->inventory_policy === 'continue')
            ),
            'brand' => fn (Product $p) => $p->brand,
            'product_type' => fn (Product $p) => $p->product_type,
            'primary_category' => fn (Product $p) => $p->category?->name,
            'categories' => fn (Product $p) => $p->categories->pluck('name')->implode(', '),
            'collections' => fn (Product $p) => $p->collections->pluck('name')->implode(', '),
            'tags' => fn (Product $p) => $p->productTags->pluck('name')->implode(', '),
            'variant_family' => fn (Product $p) => $p->variantFamily?->name,
            'variant_family_position' => fn (Product $p) => $p->variant_family_position,
            'vendor' => fn (Product $p) => $p->seller?->name,
            'short_description' => fn (Product $p) => $p->short_description,
            'description' => fn (Product $p) => $p->description,
            'length_mm' => fn (Product $p) => $p->length_mm,
            'width_mm' => fn (Product $p) => $p->width_mm,
            'height_mm' => fn (Product $p) => $p->height_mm,
            'weight' => fn (Product $p) => $p->weight,
            'sqm_per_box' => fn (Product $p) => $p->sqm_per_box,
            'unit_label' => fn (Product $p) => $p->unit_label,
            'quantity_label' => fn (Product $p) => $p->quantity_label,
            'show_wastage' => fn (Product $p) => $this->bool($p->show_wastage),
            'show_sample' => fn (Product $p) => $this->bool($p->show_sample),
            'show_big_sample' => fn (Product $p) => $this->bool($p->show_big_sample),
            'is_digital' => fn (Product $p) => $this->bool($p->is_digital),
            'requires_shipping' => fn (Product $p) => $this->bool($p->requires_shipping),
            'image_count' => fn (Product $p) => $p->media->count(),
            'primary_image_url' => fn (Product $p) => $this->primaryImage($p),
            'all_image_urls' => fn (Product $p) => $p->media->pluck('url')->implode(' | '),
            'meta_title' => fn (Product $p) => $p->meta_title,
            'meta_description' => fn (Product $p) => $p->meta_description,
            'canonical_url' => fn (Product $p) => $p->canonical_url,
            'noindex' => fn (Product $p) => $this->bool($p->noindex),
            'published_at' => fn (Product $p) => $p->published_at?->toDateTimeString(),
            'created_at' => fn (Product $p) => $p->created_at?->toDateTimeString(),
            'updated_at' => fn (Product $p) => $p->updated_at?->toDateTimeString(),
        ];
    }

    /**
     * Every specification key in use, sorted, so each becomes its own column.
     *
     * Reads only the one column it needs: the point of the pre-pass is to know
     * the header row before streaming, not to load the catalogue twice.
     *
     * @return array<int, string>
     */
    public function specKeys(): array
    {
        $keys = [];

        Product::query()
            ->whereNotNull('specifications')
            ->select('id', 'specifications')
            ->chunk(self::CHUNK, function ($chunk) use (&$keys) {
                foreach ($chunk as $product) {
                    if (is_array($product->specifications)) {
                        foreach (array_keys($product->specifications) as $key) {
                            $keys[$key] = true;
                        }
                    }
                }
            });

        $keys = array_keys($keys);
        sort($keys);

        return $keys;
    }

    /**
     * Stream the whole catalogue as a CSV download.
     */
    public function download(string $filename = 'products.csv'): StreamedResponse
    {
        $columns = $this->columns();
        $specKeys = $this->specKeys();

        return response()->streamDownload(function () use ($columns, $specKeys) {
            $out = fopen('php://output', 'w');

            // Excel reads a CSV as the system codepage unless the file opens
            // with a UTF-8 byte order mark, which turns every accented
            // character in a product name into mojibake.
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, array_merge(
                array_keys($columns),
                array_map(fn ($key) => 'spec_' . $key, $specKeys)
            ));

            Product::query()
                ->with(['category', 'categories', 'collections', 'productTags', 'seller', 'variantFamily', 'media'])
                ->orderBy('id')
                ->chunk(self::CHUNK, function ($products) use ($out, $columns, $specKeys) {
                    foreach ($products as $product) {
                        $row = [];

                        foreach ($columns as $read) {
                            $row[] = $read($product);
                        }

                        $specs = is_array($product->specifications) ? $product->specifications : [];

                        foreach ($specKeys as $key) {
                            $value = $specs[$key] ?? null;
                            $row[] = is_scalar($value) || $value === null
                                ? $value
                                : json_encode($value);
                        }

                        fputcsv($out, $row);
                    }

                    // Without this the rows queue up in PHP's output buffer and
                    // the streaming is only notional.
                    flush();
                });

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            // Streamed responses have no known length, and without this nginx
            // buffers the whole file before sending a byte.
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * TRUE/FALSE rather than 1/0 — Excel reads those as booleans, and a column
     * of 1s and 0s reads as a quantity.
     */
    private function bool(?bool $value): string
    {
        return $value ? 'TRUE' : 'FALSE';
    }

    private function primaryImage(Product $product): ?string
    {
        $primary = $product->media->firstWhere('is_primary', true) ?? $product->media->first();

        return $primary?->url;
    }
}
