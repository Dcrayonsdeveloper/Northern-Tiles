<?php

namespace Database\Seeders;

use App\Domain\Menu\Models\Menu;
use App\Domain\Menu\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $headerMenu = Menu::firstOrCreate(
            ['slug' => 'header'],
            ['name' => 'Header Navigation', 'location' => 'header', 'is_active' => true]
        );

        $footerMenu = Menu::firstOrCreate(
            ['slug' => 'footer'],
            ['name' => 'Footer Navigation', 'location' => 'footer', 'is_active' => true]
        );

        $megaMenu = Menu::firstOrCreate(
            ['slug' => 'mega-menu'],
            ['name' => 'Mega Menu', 'location' => 'mega_menu', 'is_active' => true]
        );

        $this->seedHeaderMenu($headerMenu);
        $this->seedFooterMenu($footerMenu);
    }

    protected function seedHeaderMenu(Menu $menu): void
    {
        $items = [
            ['label' => 'Home', 'url' => '/', 'sort_order' => 0],
            ['label' => 'Shop', 'url' => '/shop', 'sort_order' => 1],
            ['label' => 'Blog', 'url' => '/blog', 'sort_order' => 2],
            ['label' => 'About', 'url' => '/about', 'sort_order' => 3],
            ['label' => 'Contact', 'url' => '/contact', 'sort_order' => 4],
        ];

        foreach ($items as $item) {
            MenuItem::firstOrCreate(
                ['menu_id' => $menu->id, 'label' => $item['label']],
                array_merge($item, ['menu_id' => $menu->id, 'is_active' => true])
            );
        }
    }

    protected function seedFooterMenu(Menu $menu): void
    {
        $items = [
            ['label' => 'Privacy Policy', 'url' => '/page/privacy-policy', 'sort_order' => 0],
            ['label' => 'Terms of Service', 'url' => '/page/terms-of-service', 'sort_order' => 1],
            ['label' => 'Return Policy', 'url' => '/page/return-policy', 'sort_order' => 2],
            ['label' => 'FAQ', 'url' => '/page/faq', 'sort_order' => 3],
        ];

        foreach ($items as $item) {
            MenuItem::firstOrCreate(
                ['menu_id' => $menu->id, 'label' => $item['label']],
                array_merge($item, ['menu_id' => $menu->id, 'is_active' => true])
            );
        }
    }
}
