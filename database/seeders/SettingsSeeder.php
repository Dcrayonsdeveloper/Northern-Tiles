<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $topBar = Setting::getValue('ui.topBar');

        if ($topBar === null) {
            Setting::setValue('ui.topBar', config('ui.topBar'));
        }

        if (Setting::getValue('site.title') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'site.title'],
                ['group' => 'site', 'value_text' => config('app.name')],
            );
            Setting::forgetCache('site.title');
        }

        if (Setting::getValue('site.description') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'site.description'],
                ['group' => 'site', 'value_text' => ''],
            );
            Setting::forgetCache('site.description');
        }

        if (Setting::getValue('site.og_image') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'site.og_image'],
                ['group' => 'social', 'value_file' => null],
            );
            Setting::forgetCache('site.og_image');
        }

        if (Setting::getValue('twitter.site') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'twitter.site'],
                ['group' => 'social', 'value_text' => ''],
            );
            Setting::forgetCache('twitter.site');
        }

        if (Setting::getValue('twitter.creator') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'twitter.creator'],
                ['group' => 'social', 'value_text' => ''],
            );
            Setting::forgetCache('twitter.creator');
        }

        if (Setting::getValue('menu.header_top') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'menu.header_top'],
                ['group' => 'menus', 'value_json' => ['items' => []]],
            );
            Setting::forgetCache('menu.header_top');
        }

        if (Setting::getValue('menu.header_main') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'menu.header_main'],
                [
                    'group' => 'menus',
                    'value_json' => [
                        'items' => [
                            ['label' => 'Home', 'url' => '/', 'target' => '_self', 'is_active' => true, 'sort' => 10],
                            ['label' => 'New Arrivals', 'url' => '/shop?category=new-arrivals', 'target' => '_self', 'is_active' => true, 'sort' => 20],
                            ['label' => 'Best Sellers', 'url' => '/shop?category=best-sellers', 'target' => '_self', 'is_active' => true, 'sort' => 30],
                            ['label' => 'Kitchen Accessories', 'url' => '/shop?category=kitchen-accessories', 'target' => '_self', 'is_active' => true, 'sort' => 40],
                            ['label' => 'Mobile Accessories', 'url' => '/shop?category=mobile-accessories', 'target' => '_self', 'is_active' => true, 'sort' => 50],
                            ['label' => 'Corporate Gifting', 'url' => '/shop?category=corporate-gifting', 'target' => '_self', 'is_active' => true, 'sort' => 60],
                            ['label' => 'Contact', 'url' => '/contact', 'target' => '_self', 'is_active' => true, 'sort' => 70],
                        ],
                    ],
                ],
            );
            Setting::forgetCache('menu.header_main');
        }

        if (Setting::getValue('menu.footer') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'menu.footer'],
                [
                    'group' => 'menus',
                    'value_json' => [
                        'items' => [
                            ['label' => 'Shop', 'url' => '/shop', 'target' => '_self', 'is_active' => true, 'sort' => 10],
                            ['label' => 'About', 'url' => '/about', 'target' => '_self', 'is_active' => true, 'sort' => 20],
                            ['label' => 'Contact', 'url' => '/contact', 'target' => '_self', 'is_active' => true, 'sort' => 30],
                        ],
                    ],
                ],
            );
            Setting::forgetCache('menu.footer');
        }
    }
}
