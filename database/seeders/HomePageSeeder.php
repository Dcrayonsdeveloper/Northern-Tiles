<?php

namespace Database\Seeders;

use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Models\PageSection;
use App\Domain\CMS\Models\SectionRegistry;
use Illuminate\Database\Seeder;

class HomePageSeeder extends Seeder
{
    public function run(): void
    {
        // Check if home page already exists
        $existingHome = Page::where('template', 'home')->first();
        if ($existingHome) {
            $this->command->info('Home page already exists, skipping...');
            return;
        }

        // Create the home page
        $homePage = Page::create([
            'title' => 'Home',
            'slug' => 'home',
            'full_slug' => 'home',
            'template' => 'home',
            'status' => Page::STATUS_PUBLISHED,
            'published_at' => now(),
            'meta_title' => 'Welcome to Our Store',
            'meta_description' => 'Discover amazing products at great prices.',
        ]);

        // Define the home page sections with default data
        $sections = [
            [
                'section_key' => 'hero_slider',
                'data_json' => [
                    'slides' => [
                        [
                            'image_path' => null,
                            'image_url' => 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=1080&fit=crop&q=80',
                            'image_alt_key' => 'Modern tiled living space',
                            'h1_key' => 'Premium Tiles & Flooring',
                            'p_key' => 'Melbourne\'s trusted wholesale supplier of tiles, stone, timber and hybrid flooring.',
                            'cta_primary_label_key' => 'Shop Now',
                            'cta_primary_href' => '/shop',
                            'cta_secondary_label_key' => 'Visit Showroom',
                            'cta_secondary_href' => '/pages/contact',
                            'overlay_style' => 'dark',
                            'align' => 'left',
                            'is_active' => true,
                            'sort' => 0,
                        ],
                        [
                            'image_path' => null,
                            'image_url' => 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&h=1080&fit=crop&q=80',
                            'image_alt_key' => 'Luxury bathroom tile design',
                            'h1_key' => 'New Season Collections',
                            'p_key' => 'Discover our latest range of porcelain, ceramic and natural stone tiles.',
                            'cta_primary_label_key' => 'Browse Collections',
                            'cta_primary_href' => '/shop',
                            'overlay_style' => 'dark',
                            'align' => 'center',
                            'is_active' => true,
                            'sort' => 1,
                        ],
                        [
                            'image_path' => null,
                            'image_url' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop&q=80',
                            'image_alt_key' => 'Contemporary home interior with premium flooring',
                            'h1_key' => 'Trade & Wholesale Pricing',
                            'p_key' => 'Exclusive rates for builders, architects and designers. Open to the public.',
                            'cta_primary_label_key' => 'Get a Quote',
                            'cta_primary_href' => '/pages/contact',
                            'overlay_style' => 'dark',
                            'align' => 'left',
                            'is_active' => true,
                            'sort' => 2,
                        ],
                    ],
                ],
                'sort' => 0,
                'is_active' => true,
            ],
            [
                'section_key' => 'category_carousel',
                'data_json' => [
                    'title_key' => 'home.categories.title',
                    'category_ids' => [],
                    'limit' => 12,
                ],
                'sort' => 1,
                'is_active' => true,
            ],
            [
                'section_key' => 'new_arrivals',
                'data_json' => [
                    'title_key' => 'home.new_arrivals.title',
                    'limit' => 8,
                    'category_id' => null,
                ],
                'sort' => 2,
                'is_active' => true,
            ],
            [
                'section_key' => 'video_section',
                'data_json' => [
                    'heading_key' => 'home.video.heading',
                    'subheading_key' => 'home.video.subheading',
                    'video_type' => 'embed',
                    'embed_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'cta_label_key' => 'home.video.cta',
                    'cta_href' => '/about',
                ],
                'sort' => 3,
                'is_active' => false, // Disabled by default until configured
            ],
            [
                'section_key' => 'discount_tile_carousel',
                'data_json' => [
                    'title_key' => 'home.discounts.title',
                    'limit' => 10,
                    'min_discount_percent' => 10,
                ],
                'sort' => 4,
                'is_active' => true,
            ],
            [
                'section_key' => 'gallery',
                'data_json' => [
                    'title_key' => 'home.gallery.title',
                    'items' => [],
                ],
                'sort' => 5,
                'is_active' => false, // Disabled by default until images are added
            ],
        ];

        // Create page sections
        foreach ($sections as $sectionData) {
            PageSection::create([
                'page_id' => $homePage->id,
                'section_key' => $sectionData['section_key'],
                'data_json' => $sectionData['data_json'],
                'sort' => $sectionData['sort'],
                'is_active' => $sectionData['is_active'],
            ]);
        }

        $this->command->info('Home page created with ' . count($sections) . ' sections.');
    }
}
