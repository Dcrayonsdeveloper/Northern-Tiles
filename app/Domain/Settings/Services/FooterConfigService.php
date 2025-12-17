<?php

namespace App\Domain\Settings\Services;

use App\Domain\CMS\Models\Page;
use App\Domain\Dictionary\Services\DictionaryService;

class FooterConfigService
{
    public function __construct(
        protected SettingService $settings,
        protected DictionaryService $dictionary,
    ) {}

    public function getConfig(): array
    {
        return [
            'brand' => $this->getBrandConfig(),
            'menus' => $this->getMenusConfig(),
        ];
    }

    protected function getBrandConfig(): array
    {
        // Footer logo: try footer.logo first, fallback to site.logo
        $footerLogoUrl = $this->settings->getFileUrl('footer.logo');
        $siteLogoUrl = $this->settings->getFileUrl('site.logo');

        return [
            'name' => $this->settings->getText('site.title', config('app.name', 'Jikra')),
            'logoUrl' => $footerLogoUrl ?? $siteLogoUrl,
            'tagline' => $this->resolveText('footer.tagline', 'Your trusted shopping destination'),
            'address' => $this->resolveText('company.address', '123 Business Street, City, Country'),
            'email' => $this->settings->getText('company.email', 'support@example.com'),
            'phone' => $this->settings->getText('company.phone', '+1 234 567 890'),
        ];
    }

    protected function getMenusConfig(): array
    {
        $menuConfigs = [
            'shop' => [
                'settingKey' => 'menu.footer_shop',
                'titleKey' => 'footer.shop.title',
                'defaultTitle' => 'Shop',
                'defaultItems' => [
                    ['label' => 'All Products', 'url' => '/shop', 'sort' => 10],
                    ['label' => 'Categories', 'url' => '/categories', 'sort' => 20],
                    ['label' => 'New Arrivals', 'url' => '/shop?sort=newest', 'sort' => 30],
                    ['label' => 'Best Sellers', 'url' => '/shop?sort=popular', 'sort' => 40],
                ],
            ],
            'company' => [
                'settingKey' => 'menu.footer_company',
                'titleKey' => 'footer.company.title',
                'defaultTitle' => 'Company',
                'defaultItems' => [
                    ['label' => 'About Us', 'url' => '/pages/about', 'sort' => 10],
                    ['label' => 'Contact', 'url' => '/pages/contact', 'sort' => 20],
                    ['label' => 'Careers', 'url' => '/pages/careers', 'sort' => 30],
                    ['label' => 'Press', 'url' => '/pages/press', 'sort' => 40],
                ],
            ],
            'help' => [
                'settingKey' => 'menu.footer_help',
                'titleKey' => 'footer.help.title',
                'defaultTitle' => 'Help & Support',
                'defaultItems' => [
                    ['label' => 'FAQs', 'url' => '/pages/faqs', 'sort' => 10],
                    ['label' => 'Track Order', 'url' => '/pages/track-order', 'sort' => 20],
                    ['label' => 'Guides', 'url' => '/pages/guides', 'sort' => 30],
                ],
            ],
            'policies' => [
                'settingKey' => 'menu.footer_policies',
                'titleKey' => 'footer.policies.title',
                'defaultTitle' => 'Policies',
                'defaultItems' => [
                    ['label' => 'Payment Policy', 'url' => '/pages/payment-policy', 'sort' => 10],
                    ['label' => 'Warranty', 'url' => '/pages/warranty', 'sort' => 20],
                    ['label' => 'Returns & Refunds', 'url' => '/pages/returns-and-refunds', 'sort' => 30],
                    ['label' => 'Shipping Policy', 'url' => '/pages/shipping-policy', 'sort' => 40],
                    ['label' => 'Terms & Conditions', 'url' => '/pages/terms-and-conditions', 'sort' => 50],
                ],
            ],
        ];

        $menus = [];

        foreach ($menuConfigs as $key => $config) {
            $menus[$key] = $this->buildMenu($config);
        }

        return $menus;
    }

    protected function buildMenu(array $config): array
    {
        $items = $this->settings->menuItems($config['settingKey'], $config['defaultItems']);

        $formattedItems = [];
        foreach ($items as $item) {
            $formattedItems[] = [
                'label' => $item['label'] ?? '',
                'href' => $item['url'] ?? '#',
                'target' => $item['target'] ?? '_self',
            ];
        }

        return [
            'title' => $this->resolveText($config['titleKey'], $config['defaultTitle']),
            'items' => $formattedItems,
        ];
    }

    protected function resolveText(string $dictionaryKey, string $default): string
    {
        $value = $this->dictionary->get($dictionaryKey, [], null, null);

        if ($value === $dictionaryKey || $value === null || $value === '') {
            $settingValue = $this->settings->getText($dictionaryKey);
            return $settingValue ?? $default;
        }

        return $value;
    }

    public function ensureRequiredPagesExist(): void
    {
        $requiredPages = [
            'about' => 'About Us',
            'contact' => 'Contact',
            'careers' => 'Careers',
            'press' => 'Press',
            'faqs' => 'FAQs',
            'track-order' => 'Track Order',
            'guides' => 'Guides',
            'payment-policy' => 'Payment Policy',
            'warranty' => 'Warranty',
            'returns-and-refunds' => 'Returns & Refunds',
            'shipping-policy' => 'Shipping Policy',
            'terms-and-conditions' => 'Terms & Conditions',
        ];

        foreach ($requiredPages as $slug => $title) {
            Page::firstOrCreate(
                ['slug' => $slug],
                [
                    'title' => $title,
                    'meta_title' => $title,
                    'meta_description' => $title . ' page',
                    'body_json' => [
                        'blocks' => [
                            [
                                'type' => 'heading',
                                'content' => $title,
                            ],
                            [
                                'type' => 'paragraph',
                                'content' => 'This page content will be updated soon.',
                            ],
                        ],
                    ],
                    'template' => 'default',
                    'status' => 'published',
                    'published_at' => now(),
                ],
            );
        }
    }
}
