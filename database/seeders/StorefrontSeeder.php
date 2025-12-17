<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class StorefrontSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'New Arrivals', 'slug' => 'new-arrivals'],
            ['name' => 'Best Sellers', 'slug' => 'best-sellers'],
            ['name' => 'Kitchen Accessories', 'slug' => 'kitchen-accessories'],
            ['name' => 'Mobile Accessories', 'slug' => 'mobile-accessories'],
            ['name' => 'Corporate Gifting', 'slug' => 'corporate-gifting'],
        ];

        foreach ($categories as $categoryData) {
            Category::updateOrCreate(
                ['slug' => $categoryData['slug']],
                ['name' => $categoryData['name']],
            );
        }

        $categoryMap = Category::query()
            ->whereIn('slug', collect($categories)->pluck('slug')->all())
            ->get(['id', 'slug'])
            ->keyBy('slug');

        $products = [
            [
                'name' => 'Premium Dry-Fruit Gift Box',
                'slug' => 'premium-dry-fruit-gift-box',
                'category_slug' => 'corporate-gifting',
                'short_description' => 'Elegant corporate gifting box with premium dry fruits.',
                'description' => "Perfect for festive gifting and corporate events.",
                'price' => 1499,
                'compare_at_price' => 1799,
                'stock' => 40,
                'image_url' => 'https://picsum.photos/seed/premium-dry-fruit-gift-box/800/600',
            ],
            [
                'name' => 'Steel Lunch Box Set',
                'slug' => 'steel-lunch-box-set',
                'category_slug' => 'kitchen-accessories',
                'short_description' => 'Leak-proof stainless steel lunch box set.',
                'description' => "Durable, easy to clean and travel-friendly.",
                'price' => 899,
                'compare_at_price' => 1099,
                'stock' => 60,
                'image_url' => 'https://picsum.photos/seed/steel-lunch-box-set/800/600',
            ],
            [
                'name' => 'Fast Charger 25W',
                'slug' => 'fast-charger-25w',
                'category_slug' => 'mobile-accessories',
                'short_description' => 'Compact fast charger for daily use.',
                'description' => "Reliable charging performance with safety protection.",
                'price' => 699,
                'compare_at_price' => 899,
                'stock' => 100,
                'image_url' => 'https://picsum.photos/seed/fast-charger-25w/800/600',
            ],
            [
                'name' => 'Bluetooth Neckband',
                'slug' => 'bluetooth-neckband',
                'category_slug' => 'best-sellers',
                'short_description' => 'Comfortable neckband with clear sound.',
                'description' => "A best-seller for daily calling and music.",
                'price' => 1199,
                'compare_at_price' => 1499,
                'stock' => 80,
                'image_url' => 'https://picsum.photos/seed/bluetooth-neckband/800/600',
            ],
            [
                'name' => 'Kitchen Storage Container Set',
                'slug' => 'kitchen-storage-container-set',
                'category_slug' => 'best-sellers',
                'short_description' => 'Airtight containers to organize your pantry.',
                'description' => "Keeps items fresh and your kitchen neat.",
                'price' => 1299,
                'compare_at_price' => 1599,
                'stock' => 45,
                'image_url' => 'https://picsum.photos/seed/kitchen-storage-container-set/800/600',
            ],
            [
                'name' => 'Non-stick Frying Pan',
                'slug' => 'nonstick-frying-pan',
                'category_slug' => 'kitchen-accessories',
                'short_description' => 'Daily-use non-stick pan for quick cooking.',
                'description' => "Even heat distribution.\nEasy to clean.",
                'price' => 999,
                'compare_at_price' => 1199,
                'stock' => 35,
                'image_url' => 'https://picsum.photos/seed/nonstick-frying-pan/800/600',
            ],
            [
                'name' => 'New Arrival: Smart LED Lamp',
                'slug' => 'new-arrival-smart-led-lamp',
                'category_slug' => 'new-arrivals',
                'short_description' => 'Modern LED lamp for home and desk.',
                'description' => "Latest arrival with adjustable brightness.",
                'price' => 1099,
                'compare_at_price' => 1299,
                'stock' => 30,
                'image_url' => 'https://picsum.photos/seed/new-arrival-smart-led-lamp/800/600',
            ],
            [
                'name' => 'New Arrival: Silicone Spatula Set',
                'slug' => 'new-arrival-silicone-spatula-set',
                'category_slug' => 'new-arrivals',
                'short_description' => 'Heat-resistant spatulas for your kitchen.',
                'description' => "Flexible, durable, and easy to wash.",
                'price' => 499,
                'compare_at_price' => 649,
                'stock' => 70,
                'image_url' => 'https://picsum.photos/seed/new-arrival-silicone-spatula-set/800/600',
            ],
            [
                'name' => 'Corporate Gift: Mug Combo Pack',
                'slug' => 'corporate-gift-mug-combo-pack',
                'category_slug' => 'corporate-gifting',
                'short_description' => 'Premium mugs, perfect for gifting.',
                'description' => "A classy combo pack for office gifting.",
                'price' => 799,
                'compare_at_price' => 999,
                'stock' => 55,
                'image_url' => 'https://picsum.photos/seed/corporate-gift-mug-combo-pack/800/600',
            ],
        ];

        foreach ($products as $p) {
            $category = $categoryMap[$p['category_slug']] ?? null;

            Product::updateOrCreate(
                ['slug' => $p['slug']],
                [
                    'category_id' => $category?->id,
                    'name' => $p['name'],
                    'short_description' => $p['short_description'],
                    'description' => $p['description'],
                    'price' => $p['price'],
                    'compare_at_price' => $p['compare_at_price'],
                    'image_url' => $p['image_url'],
                    'stock' => $p['stock'],
                    'is_active' => true,
                ],
            );
        }
    }
}
