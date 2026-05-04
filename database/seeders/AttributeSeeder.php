<?php

namespace Database\Seeders;

use App\Domain\Catalog\Models\Attribute;
use Illuminate\Database\Seeder;

class AttributeSeeder extends Seeder
{
    /**
     * Seeds the six product-tagging attributes used by the home-page
     * "Find Your Perfect Tile" component. Slugs and value slugs match the URLs
     * generated in resources/js/Pages/Storefront/Home.jsx (ChooseBy()) so chips
     * land on a populated /shop page once products are tagged via the importer.
     *
     * Idempotent — safe to re-run; existing rows are not duplicated.
     */
    public function run(): void
    {
        $definitions = [
            [
                'name' => 'Colour',
                'slug' => 'color',
                'type' => 'color',
                'sort_order' => 1,
                'values' => [
                    ['White',       'white',       ['hex' => '#f5f5f5']],
                    ['Beige',       'beige',       ['hex' => '#d4c5a9']],
                    ['Light grey',  'light-grey',  ['hex' => '#cfcfcf']],
                    ['Grey',        'grey',        ['hex' => '#a0a0a0']],
                    ['Dark Grey',   'dark-grey',   ['hex' => '#555555']],
                    ['Black',       'black',       ['hex' => '#222222']],
                    ['Brown',       'brown',       ['hex' => '#8b6b3d']],
                    ['Tan',         'tan',         ['hex' => '#c8a97e']],
                    ['Sand',        'sand',        ['hex' => '#e1cba2']],
                    ['Blue',        'blue',        ['hex' => '#4a7c9b']],
                    ['Green',       'green',       ['hex' => '#6b8e6b']],
                    ['Moss',        'moss',        ['hex' => '#8b9d6b']],
                    ['Terracotta',  'terracotta',  ['hex' => '#c75b39']],
                    ['Orange',      'orange',      ['hex' => '#e07a3a']],
                    ['Cream',       'cream',       ['hex' => '#f0e6d2']],
                ],
            ],
            [
                'name' => 'Space',
                'slug' => 'space',
                'type' => 'select',
                'sort_order' => 2,
                'values' => [
                    ['Bathroom',    'bathroom'],
                    ['Kitchen',     'kitchen'],
                    ['Splashback',  'splashback'],
                    ['Living Room', 'living-room'],
                    ['Outdoor',     'outdoor'],
                    ['Pool Area',   'pool'],
                    ['Commercial',  'commercial'],
                ],
            ],
            [
                'name' => 'Size',
                'slug' => 'size',
                'type' => 'size',
                'sort_order' => 3,
                'values' => [
                    ['300×300mm',   '300x300'],
                    ['300×600mm',   '300x600'],
                    ['600×600mm',   '600x600'],
                    ['600×900mm',   '600x900'],
                    ['600×1200mm',  '600x1200'],
                    ['800×800mm',   '800x800'],
                    ['60×246mm',    '60x246'],
                    ['60×250mm',    '60x250'],
                    ['60×251mm',    '60x251'],
                    ['60×252mm',    '60x252'],
                    ['60×253mm',    '60x253'],
                ],
            ],
            [
                'name' => 'Material',
                'slug' => 'material',
                'type' => 'select',
                'sort_order' => 4,
                'values' => [
                    ['Porcelain',     'porcelain'],
                    ['Ceramic',       'ceramic'],
                    ['Natural Stone', 'natural-stone'],
                    ['Hybrid',        'hybrid'],
                    ['Timber',        'timber'],
                    ['Engineered',    'engineered'],
                ],
            ],
            [
                'name' => 'Finish',
                'slug' => 'finish',
                'type' => 'select',
                'sort_order' => 5,
                'values' => [
                    ['Matt',      'matt'],
                    ['Gloss',     'gloss'],
                    ['Honed',     'honed'],
                    ['Textured',  'textured'],
                    ['Polished',  'polished'],
                    ['Lappato',   'lappato'],
                    ['Handmade',  'handmade'],
                ],
            ],
            [
                'name' => 'Style',
                'slug' => 'style',
                'type' => 'select',
                'sort_order' => 6,
                'values' => [
                    ['Marble Look',   'marble-look'],
                    ['Wood Look',     'wood-look'],
                    ['Concrete Look', 'concrete-look'],
                    ['Stone Look',    'stone-look'],
                    ['Terrazzo Look', 'terrazzo-look'],
                    ['Geometric',     'geometric'],
                    ['Subway',        'subway'],
                ],
            ],
        ];

        foreach ($definitions as $def) {
            $attribute = Attribute::updateOrCreate(
                ['slug' => $def['slug']],
                [
                    'name' => $def['name'],
                    'type' => $def['type'],
                    'is_filterable' => true,
                    'is_visible' => true,
                    'sort_order' => $def['sort_order'],
                ],
            );

            foreach ($def['values'] as $i => $row) {
                [$value, $slug] = [$row[0], $row[1]];
                $meta = $row[2] ?? null;

                $attribute->values()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'value' => $value,
                        'meta_json' => $meta,
                        'sort_order' => $i,
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
