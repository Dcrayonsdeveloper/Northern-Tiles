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

        // Footer menus (4 columns)
        $this->seedFooterMenus();

        // Company info
        $this->seedCompanyInfo();

        // Home hero slides
        $this->seedHeroSlides();

        // Marketplace settings (currency, shipping, tax)
        $this->seedMarketplaceSettings();
    }

    protected function seedMarketplaceSettings(): void
    {
        // Currency settings
        if (Setting::getValue('marketplace.currency') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'marketplace.currency'],
                ['group' => 'marketplace', 'value_text' => 'INR'],
            );
            Setting::forgetCache('marketplace.currency');
        }

        if (Setting::getValue('marketplace.currency_symbol') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'marketplace.currency_symbol'],
                ['group' => 'marketplace', 'value_text' => '₹'],
            );
            Setting::forgetCache('marketplace.currency_symbol');
        }

        // Shipping settings
        if (Setting::getValue('shipping.free_threshold') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'shipping.free_threshold'],
                ['group' => 'shipping', 'value_text' => '999'],
            );
            Setting::forgetCache('shipping.free_threshold');
        }

        if (Setting::getValue('shipping.flat_rate') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'shipping.flat_rate'],
                ['group' => 'shipping', 'value_text' => '50'],
            );
            Setting::forgetCache('shipping.flat_rate');
        }

        // Tax settings
        if (Setting::getValue('tax.default_rate') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'tax.default_rate'],
                ['group' => 'tax', 'value_text' => '0'],  // 0% default, can be set to 18 for GST
            );
            Setting::forgetCache('tax.default_rate');
        }
    }

    protected function seedFooterMenus(): void
    {
        // Footer Shop Menu
        if (Setting::getValue('menu.footer_shop') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'menu.footer_shop'],
                [
                    'group' => 'menus',
                    'value_json' => [
                        'items' => [
                            ['label' => 'All Products', 'url' => '/shop', 'target' => '_self', 'is_active' => true, 'sort' => 10],
                            ['label' => 'Categories', 'url' => '/categories', 'target' => '_self', 'is_active' => true, 'sort' => 20],
                            ['label' => 'New Arrivals', 'url' => '/shop?sort=newest', 'target' => '_self', 'is_active' => true, 'sort' => 30],
                            ['label' => 'Best Sellers', 'url' => '/shop?sort=popular', 'target' => '_self', 'is_active' => true, 'sort' => 40],
                        ],
                    ],
                ],
            );
            Setting::forgetCache('menu.footer_shop');
        }

        // Footer Company Menu
        if (Setting::getValue('menu.footer_company') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'menu.footer_company'],
                [
                    'group' => 'menus',
                    'value_json' => [
                        'items' => [
                            ['label' => 'About Us', 'url' => '/pages/about', 'target' => '_self', 'is_active' => true, 'sort' => 10],
                            ['label' => 'Contact', 'url' => '/pages/contact', 'target' => '_self', 'is_active' => true, 'sort' => 20],
                            ['label' => 'Careers', 'url' => '/pages/careers', 'target' => '_self', 'is_active' => true, 'sort' => 30],
                            ['label' => 'Press', 'url' => '/pages/press', 'target' => '_self', 'is_active' => true, 'sort' => 40],
                        ],
                    ],
                ],
            );
            Setting::forgetCache('menu.footer_company');
        }

        // Footer Help Menu
        if (Setting::getValue('menu.footer_help') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'menu.footer_help'],
                [
                    'group' => 'menus',
                    'value_json' => [
                        'items' => [
                            ['label' => 'FAQs', 'url' => '/pages/faqs', 'target' => '_self', 'is_active' => true, 'sort' => 10],
                            ['label' => 'Track Order', 'url' => '/pages/track-order', 'target' => '_self', 'is_active' => true, 'sort' => 20],
                            ['label' => 'Guides', 'url' => '/pages/guides', 'target' => '_self', 'is_active' => true, 'sort' => 30],
                        ],
                    ],
                ],
            );
            Setting::forgetCache('menu.footer_help');
        }

        // Footer Policies Menu
        if (Setting::getValue('menu.footer_policies') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'menu.footer_policies'],
                [
                    'group' => 'menus',
                    'value_json' => [
                        'items' => [
                            ['label' => 'Payment Policy', 'url' => '/pages/payment-policy', 'target' => '_self', 'is_active' => true, 'sort' => 10],
                            ['label' => 'Warranty', 'url' => '/pages/warranty', 'target' => '_self', 'is_active' => true, 'sort' => 20],
                            ['label' => 'Returns & Refunds', 'url' => '/pages/returns-and-refunds', 'target' => '_self', 'is_active' => true, 'sort' => 30],
                            ['label' => 'Shipping Policy', 'url' => '/pages/shipping-policy', 'target' => '_self', 'is_active' => true, 'sort' => 40],
                            ['label' => 'Terms & Conditions', 'url' => '/pages/terms-and-conditions', 'target' => '_self', 'is_active' => true, 'sort' => 50],
                        ],
                    ],
                ],
            );
            Setting::forgetCache('menu.footer_policies');
        }
    }

    protected function seedCompanyInfo(): void
    {
        if (Setting::getValue('company.email') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'company.email'],
                ['group' => 'company', 'value_text' => 'support@jikra.com'],
            );
            Setting::forgetCache('company.email');
        }

        if (Setting::getValue('company.phone') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'company.phone'],
                ['group' => 'company', 'value_text' => '+1 234 567 890'],
            );
            Setting::forgetCache('company.phone');
        }

        if (Setting::getValue('company.address') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'company.address'],
                ['group' => 'company', 'value_text' => '123 Business Street, City, Country'],
            );
            Setting::forgetCache('company.address');
        }

        if (Setting::getValue('footer.tagline') === null) {
            Setting::query()->updateOrCreate(
                ['key' => 'footer.tagline'],
                ['group' => 'footer', 'value_text' => 'Your trusted shopping destination'],
            );
            Setting::forgetCache('footer.tagline');
        }
    }

    protected function seedHeroSlides(): void
    {
        if (Setting::getValue('home.hero_slides') !== null) {
            return;
        }

        // Default hero slides with placeholder images from picsum.photos
        // These are high-quality stock images that work well for e-commerce
        $heroSlides = [
            [
                'is_active' => true,
                'sort' => 0,
                'image_path' => null,
                'image_url' => 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=960&fit=crop&q=80', // Store interior
                'image_alt_key' => 'home.hero.slide1.image_alt',
                'h1_key' => 'home.hero.slide1.h1',
                'p_key' => 'home.hero.slide1.p',
                'cta_primary_label_key' => 'home.hero.slide1.cta_primary',
                'cta_primary_href' => '/shop',
                'cta_secondary_label_key' => 'home.hero.slide1.cta_secondary',
                'cta_secondary_href' => '/pages/about',
                'overlay_style' => 'dark',
                'align' => 'left',
            ],
            [
                'is_active' => true,
                'sort' => 1,
                'image_path' => null,
                'image_url' => 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=960&fit=crop&q=80', // Shopping bags
                'image_alt_key' => 'home.hero.slide2.image_alt',
                'h1_key' => 'home.hero.slide2.h1',
                'p_key' => 'home.hero.slide2.p',
                'cta_primary_label_key' => 'home.hero.slide2.cta_primary',
                'cta_primary_href' => '/shop?category=new-arrivals',
                'cta_secondary_label_key' => null,
                'cta_secondary_href' => null,
                'overlay_style' => 'dark',
                'align' => 'center',
            ],
            [
                'is_active' => true,
                'sort' => 2,
                'image_path' => null,
                'image_url' => 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=960&fit=crop&q=80', // Fashion shopping
                'image_alt_key' => 'home.hero.slide3.image_alt',
                'h1_key' => 'home.hero.slide3.h1',
                'p_key' => 'home.hero.slide3.p',
                'cta_primary_label_key' => 'home.hero.slide3.cta_primary',
                'cta_primary_href' => '/shop?category=best-sellers',
                'cta_secondary_label_key' => null,
                'cta_secondary_href' => null,
                'overlay_style' => 'dark',
                'align' => 'left',
            ],
        ];

        Setting::query()->updateOrCreate(
            ['key' => 'home.hero_slides'],
            ['group' => 'home', 'value_json' => $heroSlides],
        );
        Setting::forgetCache('home.hero_slides');
    }
}
