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
            'image_alt' => 'Shop NTD Products',
            'featured_content' => [
                [
                    'title' => 'Hybrid Flooring',
                    'url' => '/shop?category=hybrid-flooring',
                    'image_url' => '/images/menu/hybrid-flooring.jpg',
                    'type' => 'Featured',
                    'description' => 'Waterproof rigid core hybrid flooring',
                ],
                [
                    'title' => 'NTD Tiles',
                    'url' => '/shop?category=ntd-tiles',
                    'image_url' => '/images/menu/ntd-tiles.jpg',
                    'type' => 'Collection',
                    'description' => 'Premium porcelain and specialty tiles',
                ],
            ],
        ]);

        // Hybrid Flooring Category
        $hybridCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'Hybrid Flooring',
            'url' => '/shop/hybrid-flooring',
            'sort_order' => 0,
            'is_active' => true,
            'description' => 'Waterproof rigid core hybrid flooring',
        ]);

        foreach ([
            ['label' => 'Timber Oak', 'slug' => 'timber-oak'],
            ['label' => 'Herringbone', 'slug' => 'herringbone'],
            ['label' => 'Tile-Look', 'slug' => 'tile-look'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $hybridCategory->id,
                'label' => $item['label'],
                'url' => '/shop/hybrid-flooring/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // Timber Products Category
        $timberCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'Timber Products',
            'url' => '/shop/timber-products',
            'sort_order' => 1,
            'is_active' => true,
            'description' => 'Solid and engineered oak timber flooring',
        ]);

        foreach ([
            ['label' => 'Solid Oak Flooring', 'slug' => 'solid-oak'],
            ['label' => 'Engineered Oak Flooring', 'slug' => 'engineered-oak'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $timberCategory->id,
                'label' => $item['label'],
                'url' => '/shop/timber-products/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // NTD Tiles Category
        $tilesCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'NTD Tiles',
            'url' => '/shop/ntd-tiles',
            'sort_order' => 2,
            'is_active' => true,
            'description' => 'Premium porcelain and specialty tiles',
        ]);

        foreach ([
            ['label' => 'Porcelain Tiles', 'slug' => 'porcelain'],
            ['label' => 'Subway Tiles', 'slug' => 'subway'],
            ['label' => 'External Porcelain', 'slug' => 'external-porcelain'],
            ['label' => 'Pool Coping', 'slug' => 'pool-coping'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $tilesCategory->id,
                'label' => $item['label'],
                'url' => '/shop/ntd-tiles/' . $item['slug'],
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
            'image_alt' => 'Browse NTD collections',
            'featured_content' => [
                [
                    'title' => 'Builders Range',
                    'url' => '/collections/builders-range',
                    'image_url' => '/images/menu/builders-range.jpg',
                    'type' => 'Collection',
                    'description' => 'Products for builders and contractors',
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
            ['label' => 'Builders Range', 'slug' => 'builders-range'],
            ['label' => 'Specialty Tiles', 'slug' => 'specialty-tiles'],
            ['label' => 'Stone Collection', 'slug' => 'stone'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $featuredCollections->id,
                'label' => $item['label'],
                'url' => '/collections/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // Trade Supplies
        $tradeCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $collections->id,
            'label' => 'Trade Supplies',
            'url' => '/shop/trade-supplies',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        foreach ([
            ['label' => 'Levelling Systems', 'slug' => 'levelling-systems'],
            ['label' => 'Waterproofing', 'slug' => 'waterproofing'],
            ['label' => 'Adhesives & Grouts', 'slug' => 'adhesives-grouts'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $tradeCategory->id,
                'label' => $item['label'],
                'url' => '/shop/trade-supplies/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // 3. About - Simple link
        MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'About',
            'url' => '/about',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => false,
        ]);

        // 4. Contact - Simple link
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
            ['label' => 'Hybrid Flooring', 'slug' => 'hybrid-flooring'],
            ['label' => 'Timber Products', 'slug' => 'timber-products'],
            ['label' => 'NTD Tiles', 'slug' => 'ntd-tiles'],
            ['label' => 'Stone', 'slug' => 'stone'],
            ['label' => 'Trade Supplies', 'slug' => 'trade-supplies'],
        ] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $shop->id,
                'label' => $item['label'],
                'url' => '/shop/' . $item['slug'],
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // Collections
        $collections = MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Collections',
            'url' => '/collections',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'description' => 'Explore NTD collections',
        ]);

        foreach ([
            ['label' => 'Builders Range', 'slug' => 'builders-range'],
            ['label' => 'Specialty Tiles', 'slug' => 'specialty-tiles'],
            ['label' => 'Stone Collection', 'slug' => 'stone'],
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
