<?php

namespace Database\Seeders;

use App\Domain\Menu\Models\Menu;
use App\Domain\Menu\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing menu items for fresh seeding
        MenuItem::query()->delete();
        Menu::query()->delete();

        $headerMenu = Menu::create([
            'name' => 'Header Navigation',
            'slug' => 'header',
            'location' => 'header',
            'is_active' => true,
        ]);

        $footerMenu = Menu::create([
            'name' => 'Footer Navigation',
            'slug' => 'footer',
            'location' => 'footer',
            'is_active' => true,
        ]);

        $mobileMenu = Menu::create([
            'name' => 'Mobile Navigation',
            'slug' => 'mobile',
            'location' => 'mobile',
            'is_active' => true,
        ]);

        $this->seedHeaderMegaMenu($headerMenu);
        $this->seedFooterMenu($footerMenu);
        $this->seedMobileMenu($mobileMenu);
    }

    protected function seedHeaderMegaMenu(Menu $menu): void
    {
        $sortOrder = 0;

        // 1. Shop - Mega Menu with Categories
        $shop = MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Shop',
            'url' => '/shop',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => true,
            'mega_columns' => 3,
            'image_url' => '/images/menu/shop-banner.jpg',
            'image_alt' => 'Shop Jikra Products',
            'badge_text' => 'New',
            'badge_color' => 'green',
            'featured_content' => [
                [
                    'title' => 'New Arrivals',
                    'url' => '/shop?sort=newest',
                    'image_url' => '/images/menu/new-arrivals.jpg',
                    'type' => 'Featured',
                    'description' => 'Check out our latest products',
                ],
                [
                    'title' => 'Best Sellers',
                    'url' => '/collections/best-sellers',
                    'image_url' => '/images/menu/best-sellers.jpg',
                    'type' => 'Collection',
                    'description' => 'Our most popular items',
                ],
            ],
        ]);

        // Drinkware Category
        $drinkwareCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'Drinkware',
            'url' => '/shop/drinkware',
            'sort_order' => 0,
            'is_active' => true,
            'description' => 'Premium drinkware for every occasion',
        ]);

        foreach ([
            ['label' => 'Tumblers', 'slug' => 'tumblers'],
            ['label' => 'Coffee Mugs', 'slug' => 'coffee-mugs'],
            ['label' => 'Bottles', 'slug' => 'bottles'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $drinkwareCategory->id,
                'label' => $item['label'],
                'url' => '/shop/drinkware/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // Kitchen & Home Category
        $kitchenCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'Kitchen & Home',
            'url' => '/shop/kitchen-home',
            'sort_order' => 1,
            'is_active' => true,
            'description' => 'Essential items for your home',
        ]);

        foreach ([
            ['label' => 'Coffee Accessories', 'slug' => 'coffee-accessories'],
            ['label' => 'Lighters', 'slug' => 'lighters'],
            ['label' => 'Puja Essentials', 'slug' => 'puja-essentials'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $kitchenCategory->id,
                'label' => $item['label'],
                'url' => '/shop/kitchen-home/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // Safety & Utility Category
        $safetyCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'Safety & Utility',
            'url' => '/shop/safety-utility',
            'sort_order' => 2,
            'is_active' => true,
            'description' => 'Safety and utility products',
        ]);

        foreach ([
            ['label' => 'Anti-Slip Tapes', 'slug' => 'anti-slip-tapes'],
            ['label' => 'Counters & Tools', 'slug' => 'counters-tools'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $safetyCategory->id,
                'label' => $item['label'],
                'url' => '/shop/safety-utility/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // 2. Collections - Mega Menu
        $collections = MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Collections',
            'url' => '/collections',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => true,
            'mega_columns' => 2,
            'image_url' => '/images/menu/collections-banner.jpg',
            'image_alt' => 'Browse collections',
            'featured_content' => [
                [
                    'title' => 'Best Sellers',
                    'url' => '/collections/best-sellers',
                    'image_url' => '/images/menu/best-sellers.jpg',
                    'type' => 'Collection',
                    'description' => 'Our most popular products',
                ],
            ],
        ]);

        $featuredCollections = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $collections->id,
            'label' => 'Featured',
            'url' => '/collections',
            'sort_order' => 0,
            'is_active' => true,
        ]);

        foreach ([
            ['label' => 'Best Sellers', 'slug' => 'best-sellers'],
            ['label' => 'New Arrivals', 'slug' => 'new-arrivals'],
            ['label' => 'On Sale', 'slug' => 'on-sale', 'badge' => 'Sale', 'badge_color' => 'red'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $featuredCollections->id,
                'label' => $item['label'],
                'url' => '/collections/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
                'badge_text' => $item['badge'] ?? null,
                'badge_color' => $item['badge_color'] ?? null,
            ]);
        }

        $smartCollections = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $collections->id,
            'label' => 'Smart Collections',
            'url' => '/collections',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        foreach ([
            ['label' => 'Stainless Steel', 'slug' => 'stainless-steel'],
            ['label' => 'Eco-Friendly', 'slug' => 'eco-friendly'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $smartCollections->id,
                'label' => $item['label'],
                'url' => '/collections/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // 3. Sale - Regular dropdown
        $sale = MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Sale',
            'url' => '/collections/on-sale',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => false,
            'badge_text' => 'Up to 50%',
            'badge_color' => 'red',
        ]);

        foreach ([
            ['label' => 'All Sale Items', 'slug' => 'on-sale'],
            ['label' => 'Drinkware Sale', 'slug' => 'drinkware-sale'],
            ['label' => 'Clearance', 'slug' => 'clearance', 'badge' => '70% Off', 'badge_color' => 'red'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $sale->id,
                'label' => $item['label'],
                'url' => '/collections/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
                'badge_text' => $item['badge'] ?? null,
                'badge_color' => $item['badge_color'] ?? null,
            ]);
        }

        // 4. About - Simple link
        MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'About',
            'url' => '/about',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => false,
        ]);

        // 5. Contact - Simple link
        MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Contact',
            'url' => '/contact',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => false,
        ]);
    }

    protected function seedFooterMenu(Menu $menu): void
    {
        $items = [
            ['label' => 'Privacy Policy', 'url' => '/page/privacy-policy', 'sort_order' => 0],
            ['label' => 'Terms of Service', 'url' => '/page/terms-of-service', 'sort_order' => 1],
            ['label' => 'Return Policy', 'url' => '/page/return-policy', 'sort_order' => 2],
            ['label' => 'Shipping Info', 'url' => '/page/shipping', 'sort_order' => 3],
            ['label' => 'FAQ', 'url' => '/page/faq', 'sort_order' => 4],
            ['label' => 'Contact Us', 'url' => '/contact', 'sort_order' => 5],
        ];

        foreach ($items as $item) {
            MenuItem::create(array_merge($item, ['menu_id' => $menu->id, 'is_active' => true]));
        }
    }

    protected function seedMobileMenu(Menu $menu): void
    {
        $sortOrder = 0;

        // Shop with subcategories
        $shop = MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Shop',
            'url' => '/shop',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'description' => 'Browse our full collection',
            'image_url' => '/images/menu/shop-mobile.jpg',
        ]);

        foreach ([
            ['label' => 'Drinkware', 'slug' => 'drinkware'],
            ['label' => 'Kitchen & Home', 'slug' => 'kitchen-home'],
            ['label' => 'Safety & Utility', 'slug' => 'safety-utility'],
            ['label' => 'Sale', 'slug' => 'on-sale', 'badge' => 'Up to 50%', 'badge_color' => 'red'],
        ] as $i => $item) {
            $url = isset($item['slug']) && $item['label'] === 'Sale'
                ? '/collections/' . $item['slug']
                : '/shop/' . $item['slug'];

            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $shop->id,
                'label' => $item['label'],
                'url' => $url,
                'sort_order' => $i,
                'is_active' => true,
                'badge_text' => $item['badge'] ?? null,
                'badge_color' => $item['badge_color'] ?? null,
            ]);
        }

        // Collections
        $collections = MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Collections',
            'url' => '/collections',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'description' => 'Explore curated collections',
        ]);

        foreach ([
            ['label' => 'New Arrivals', 'slug' => 'new-arrivals'],
            ['label' => 'Best Sellers', 'slug' => 'best-sellers'],
            ['label' => 'On Sale', 'slug' => 'on-sale'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $collections->id,
                'label' => $item['label'],
                'url' => '/collections/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // About
        MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'About Us',
            'url' => '/about',
            'sort_order' => $sortOrder++,
            'is_active' => true,
        ]);

        // Contact
        MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Contact',
            'url' => '/contact',
            'sort_order' => $sortOrder++,
            'is_active' => true,
        ]);
    }
}
