<?php

namespace Database\Seeders;

use App\Domain\CMS\Models\Author;
use App\Domain\CMS\Models\Page;
use App\Domain\CMS\Models\PostCategory;
use Illuminate\Database\Seeder;

class CMSSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedAuthors();
        $this->seedPostCategories();
        $this->seedPages();
    }

    protected function seedAuthors(): void
    {
        Author::firstOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'bio_json' => ['content' => 'Site administrator and content curator.'],
                'job_title' => 'Administrator',
                'is_active' => true,
            ]
        );
    }

    protected function seedPostCategories(): void
    {
        $categories = [
            ['name' => 'News', 'slug' => 'news', 'description' => 'Latest news and updates'],
            ['name' => 'Tutorials', 'slug' => 'tutorials', 'description' => 'How-to guides and tutorials'],
            ['name' => 'Product Updates', 'slug' => 'product-updates', 'description' => 'New products and features'],
        ];

        foreach ($categories as $category) {
            PostCategory::firstOrCreate(
                ['slug' => $category['slug']],
                array_merge($category, ['is_active' => true])
            );
        }
    }

    protected function seedPages(): void
    {
        $pages = [
            [
                'title' => 'About Us',
                'slug' => 'about',
                'meta_title' => 'About Us',
                'meta_description' => 'Learn more about our company and mission.',
                'body_json' => [
                    'blocks' => [
                        ['type' => 'heading', 'content' => 'About Our Company'],
                        ['type' => 'paragraph', 'content' => 'Welcome to our store. We are dedicated to providing quality products and excellent customer service.'],
                    ]
                ],
                'template' => 'about',
                'status' => 'published',
                'published_at' => now(),
            ],
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'meta_title' => 'Privacy Policy',
                'meta_description' => 'Our privacy policy explains how we collect and use your data.',
                'body_json' => [
                    'blocks' => [
                        ['type' => 'heading', 'content' => 'Privacy Policy'],
                        ['type' => 'paragraph', 'content' => 'This privacy policy describes how we handle your personal information.'],
                    ]
                ],
                'template' => 'default',
                'status' => 'published',
                'published_at' => now(),
            ],
            [
                'title' => 'Terms of Service',
                'slug' => 'terms-of-service',
                'meta_title' => 'Terms of Service',
                'meta_description' => 'Read our terms of service before using our website.',
                'body_json' => [
                    'blocks' => [
                        ['type' => 'heading', 'content' => 'Terms of Service'],
                        ['type' => 'paragraph', 'content' => 'By using our services, you agree to these terms.'],
                    ]
                ],
                'template' => 'default',
                'status' => 'published',
                'published_at' => now(),
            ],
            [
                'title' => 'Return Policy',
                'slug' => 'return-policy',
                'meta_title' => 'Return Policy',
                'meta_description' => 'Learn about our return and refund policy.',
                'body_json' => [
                    'blocks' => [
                        ['type' => 'heading', 'content' => 'Return Policy'],
                        ['type' => 'paragraph', 'content' => 'We offer hassle-free returns within 30 days of purchase.'],
                    ]
                ],
                'template' => 'default',
                'status' => 'published',
                'published_at' => now(),
            ],
        ];

        foreach ($pages as $page) {
            Page::firstOrCreate(
                ['slug' => $page['slug']],
                $page
            );
        }
    }
}
