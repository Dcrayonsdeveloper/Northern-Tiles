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
            'mega_columns' => 4,
            'image_url' => 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop',
            'image_alt' => 'Shop our latest collection',
            'badge_text' => 'Sale',
            'badge_color' => 'red',
            'featured_content' => [
                [
                    'title' => 'Summer Collection 2025',
                    'url' => '/shop?collection=summer',
                    'image_url' => 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=200&fit=crop',
                    'type' => 'Collection',
                    'description' => 'Discover our vibrant summer styles',
                ],
                [
                    'title' => 'New Arrivals',
                    'url' => '/shop?sort=newest',
                    'image_url' => 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&h=200&fit=crop',
                    'type' => 'Featured',
                    'description' => 'Fresh styles just landed',
                ],
            ],
        ]);

        // Shop subcategories (columns in mega menu)
        $womenCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'Women',
            'url' => '/shop/women',
            'sort_order' => 0,
            'is_active' => true,
            'description' => 'Fashion for her',
        ]);

        foreach (['Dresses', 'Tops & Blouses', 'Pants & Jeans', 'Skirts', 'Jackets', 'Accessories'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $womenCategory->id,
                'label' => $item,
                'url' => '/shop/women/' . strtolower(str_replace([' & ', ' '], '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        $menCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'Men',
            'url' => '/shop/men',
            'sort_order' => 1,
            'is_active' => true,
            'description' => 'Fashion for him',
        ]);

        foreach (['Shirts', 'T-Shirts', 'Pants', 'Suits', 'Outerwear', 'Accessories'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $menCategory->id,
                'label' => $item,
                'url' => '/shop/men/' . strtolower(str_replace(' ', '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        $kidsCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'Kids',
            'url' => '/shop/kids',
            'sort_order' => 2,
            'is_active' => true,
            'description' => 'Fashion for little ones',
        ]);

        foreach (['Girls', 'Boys', 'Baby', 'Teens', 'School Wear'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $kidsCategory->id,
                'label' => $item,
                'url' => '/shop/kids/' . strtolower(str_replace(' ', '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        $accessoriesCategory = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $shop->id,
            'label' => 'Accessories',
            'url' => '/shop/accessories',
            'sort_order' => 3,
            'is_active' => true,
            'description' => 'Complete your look',
        ]);

        foreach (['Bags & Purses', 'Jewelry', 'Watches', 'Sunglasses', 'Belts', 'Scarves'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $accessoriesCategory->id,
                'label' => $item,
                'url' => '/shop/accessories/' . strtolower(str_replace([' & ', ' '], '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
                'badge_text' => $item === 'Jewelry' ? 'New' : null,
                'badge_color' => $item === 'Jewelry' ? 'green' : null,
            ]);
        }

        // 2. Collections - Mega Menu with Video
        $collections = MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Collections',
            'url' => '/collections',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => true,
            'mega_columns' => 3,
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'image_url' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=250&fit=crop',
            'image_alt' => 'Watch our collection video',
            'featured_content' => [
                [
                    'title' => 'Behind the Scenes',
                    'url' => '/blog/behind-the-scenes',
                    'image_url' => 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=200&fit=crop',
                    'type' => 'Blog',
                    'description' => 'See how our collections come to life',
                ],
            ],
        ]);

        $seasonalCollection = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $collections->id,
            'label' => 'Seasonal',
            'url' => '/collections/seasonal',
            'sort_order' => 0,
            'is_active' => true,
        ]);

        foreach (['Spring 2025', 'Summer 2025', 'Fall Preview', 'Winter Essentials'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $seasonalCollection->id,
                'label' => $item,
                'url' => '/collections/' . strtolower(str_replace(' ', '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        $specialCollection = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $collections->id,
            'label' => 'Special Editions',
            'url' => '/collections/special',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        foreach (['Limited Edition', 'Designer Collab', 'Sustainable Line', 'Vintage Revival'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $specialCollection->id,
                'label' => $item,
                'url' => '/collections/' . strtolower(str_replace(' ', '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
                'badge_text' => $item === 'Limited Edition' ? 'Hot' : null,
                'badge_color' => $item === 'Limited Edition' ? 'orange' : null,
            ]);
        }

        $lifestyleCollection = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $collections->id,
            'label' => 'Lifestyle',
            'url' => '/collections/lifestyle',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        foreach (['Work From Home', 'Weekend Casual', 'Evening Wear', 'Active & Sport'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $lifestyleCollection->id,
                'label' => $item,
                'url' => '/collections/' . strtolower(str_replace([' & ', ' '], '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // 3. Blog - Mega Menu with Blog Posts
        $blog = MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Blog',
            'url' => '/blog',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => true,
            'mega_columns' => 3,
            'image_url' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
            'image_alt' => 'Read our latest articles',
            'featured_content' => [
                [
                    'title' => '10 Spring Fashion Trends',
                    'url' => '/blog/spring-fashion-trends',
                    'image_url' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=200&fit=crop',
                    'type' => 'Style Guide',
                    'description' => 'Discover what\'s hot this season',
                    'date' => 'Dec 15, 2025',
                ],
                [
                    'title' => 'Sustainable Fashion Guide',
                    'url' => '/blog/sustainable-fashion',
                    'image_url' => 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=300&h=200&fit=crop',
                    'type' => 'Lifestyle',
                    'description' => 'How to build an eco-friendly wardrobe',
                    'date' => 'Dec 12, 2025',
                ],
                [
                    'title' => 'Interview: Designer Spotlight',
                    'url' => '/blog/designer-spotlight',
                    'image_url' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
                    'type' => 'Interview',
                    'description' => 'Meet the minds behind our collections',
                    'date' => 'Dec 10, 2025',
                ],
            ],
        ]);

        $styleTips = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $blog->id,
            'label' => 'Style Tips',
            'url' => '/blog/category/style-tips',
            'sort_order' => 0,
            'is_active' => true,
        ]);

        foreach (['How to Style', 'Color Matching', 'Wardrobe Basics', 'Occasion Dressing'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $styleTips->id,
                'label' => $item,
                'url' => '/blog/category/' . strtolower(str_replace(' ', '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        $trendsBlog = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $blog->id,
            'label' => 'Trends',
            'url' => '/blog/category/trends',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        foreach (['Fashion Week', 'Street Style', 'Celebrity Looks', 'Runway Reports'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $trendsBlog->id,
                'label' => $item,
                'url' => '/blog/category/' . strtolower(str_replace(' ', '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        $lifestyleBlog = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $blog->id,
            'label' => 'Lifestyle',
            'url' => '/blog/category/lifestyle',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        foreach (['Sustainability', 'Behind the Brand', 'Interviews', 'Events'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $lifestyleBlog->id,
                'label' => $item,
                'url' => '/blog/category/' . strtolower(str_replace(' ', '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // 4. Sale - Regular dropdown (not mega)
        $sale = MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Sale',
            'url' => '/sale',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => false,
            'badge_text' => 'Up to 70%',
            'badge_color' => 'red',
        ]);

        foreach (['All Sale Items', 'Women\'s Sale', 'Men\'s Sale', 'Kids\' Sale', 'Final Clearance'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $sale->id,
                'label' => $item,
                'url' => '/sale/' . strtolower(str_replace(['\'', ' '], ['', '-'], $item)),
                'sort_order' => $i,
                'is_active' => true,
                'badge_text' => $item === 'Final Clearance' ? '80% Off' : null,
                'badge_color' => $item === 'Final Clearance' ? 'red' : null,
            ]);
        }

        // 5. About - Simple link
        MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'About',
            'url' => '/about',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'is_mega' => false,
        ]);

        // 6. Contact - Simple link
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
            ['label' => 'Careers', 'url' => '/careers', 'sort_order' => 5],
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
            'image_url' => 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop',
        ]);

        foreach (['Women', 'Men', 'Kids', 'Accessories', 'Sale'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $shop->id,
                'label' => $item,
                'url' => '/shop/' . strtolower($item),
                'sort_order' => $i,
                'is_active' => true,
                'badge_text' => $item === 'Sale' ? 'Up to 70%' : null,
                'badge_color' => $item === 'Sale' ? 'red' : null,
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

        foreach (['Summer 2025', 'New Arrivals', 'Bestsellers', 'Limited Edition'] as $i => $item) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $collections->id,
                'label' => $item,
                'url' => '/collections/' . strtolower(str_replace(' ', '-', $item)),
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }

        // Blog
        MenuItem::create([
            'menu_id' => $menu->id,
            'label' => 'Blog',
            'url' => '/blog',
            'sort_order' => $sortOrder++,
            'is_active' => true,
            'description' => 'Style tips & inspiration',
        ]);

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
