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
                            'image_url' => 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=800&fit=crop&q=80',
                            'image_alt_key' => 'home.hero.slide1.alt',
                            'h1_key' => 'home.hero.slide1.heading',
                            'p_key' => 'home.hero.slide1.description',
                            'cta_primary_label_key' => 'home.hero.slide1.cta1',
                            'cta_primary_href' => '/shop',
                            'cta_secondary_label_key' => 'home.hero.slide1.cta2',
                            'cta_secondary_href' => '/categories',
                            'overlay_style' => 'dark',
                            'align' => 'left',
                            'is_active' => true,
                            'sort' => 0,
                        ],
                        [
                            'image_path' => null,
                            'image_url' => 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=800&fit=crop&q=80',
                            'image_alt_key' => 'home.hero.slide2.alt',
                            'h1_key' => 'home.hero.slide2.heading',
                            'p_key' => 'home.hero.slide2.description',
                            'cta_primary_label_key' => 'home.hero.slide2.cta1',
                            'cta_primary_href' => '/new-arrivals',
                            'overlay_style' => 'dark',
                            'align' => 'center',
                            'is_active' => true,
                            'sort' => 1,
                        ],
                        [
                            'image_path' => null,
                            'image_url' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=800&fit=crop&q=80',
                            'image_alt_key' => 'home.hero.slide3.alt',
                            'h1_key' => 'home.hero.slide3.heading',
                            'p_key' => 'home.hero.slide3.description',
                            'cta_primary_label_key' => 'home.hero.slide3.cta1',
                            'cta_primary_href' => '/shop',
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
