<?php

namespace Database\Seeders;

use App\Domain\CMS\Models\SectionRegistry;
use Illuminate\Database\Seeder;

class SectionRegistrySeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            // Content sections
            [
                'section_key' => 'hero_banner',
                'title_key' => 'Hero Banner',
                'category' => SectionRegistry::CATEGORY_CONTENT,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Heading', 'required' => true],
                        ['key' => 'subheading', 'type' => 'text', 'label' => 'Subheading'],
                        ['key' => 'description', 'type' => 'textarea', 'label' => 'Description'],
                        ['key' => 'background_image', 'type' => 'image', 'label' => 'Background Image'],
                        ['key' => 'overlay_style', 'type' => 'select', 'label' => 'Overlay Style', 'options' => [
                            ['value' => 'dark', 'label' => 'Dark'],
                            ['value' => 'light', 'label' => 'Light'],
                            ['value' => 'none', 'label' => 'None'],
                        ]],
                        ['key' => 'cta_text', 'type' => 'text', 'label' => 'CTA Button Text'],
                        ['key' => 'cta_url', 'type' => 'text', 'label' => 'CTA Button URL'],
                        ['key' => 'align', 'type' => 'select', 'label' => 'Text Alignment', 'options' => [
                            ['value' => 'left', 'label' => 'Left'],
                            ['value' => 'center', 'label' => 'Center'],
                            ['value' => 'right', 'label' => 'Right'],
                        ]],
                    ],
                ],
                'default_data' => [
                    'heading' => 'Welcome',
                    'overlay_style' => 'dark',
                    'align' => 'left',
                ],
            ],
            [
                'section_key' => 'text_content',
                'title_key' => 'Text Content',
                'category' => SectionRegistry::CATEGORY_CONTENT,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Heading'],
                        ['key' => 'content', 'type' => 'richtext', 'label' => 'Content'],
                        ['key' => 'width', 'type' => 'select', 'label' => 'Width', 'options' => [
                            ['value' => 'narrow', 'label' => 'Narrow'],
                            ['value' => 'medium', 'label' => 'Medium'],
                            ['value' => 'full', 'label' => 'Full Width'],
                        ]],
                    ],
                ],
                'default_data' => [
                    'width' => 'medium',
                ],
            ],
            [
                'section_key' => 'feature_list',
                'title_key' => 'Feature List',
                'category' => SectionRegistry::CATEGORY_CONTENT,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Section Heading'],
                        ['key' => 'subheading', 'type' => 'text', 'label' => 'Section Subheading'],
                        ['key' => 'columns', 'type' => 'select', 'label' => 'Columns', 'options' => [
                            ['value' => '2', 'label' => '2 Columns'],
                            ['value' => '3', 'label' => '3 Columns'],
                            ['value' => '4', 'label' => '4 Columns'],
                        ]],
                        [
                            'key' => 'features',
                            'type' => 'array',
                            'label' => 'Features',
                            'itemSchema' => [
                                'fields' => [
                                    ['key' => 'icon', 'type' => 'text', 'label' => 'Icon (name or URL)'],
                                    ['key' => 'title', 'type' => 'text', 'label' => 'Title'],
                                    ['key' => 'description', 'type' => 'textarea', 'label' => 'Description'],
                                ],
                            ],
                        ],
                    ],
                ],
                'default_data' => [
                    'columns' => '3',
                    'features' => [],
                ],
            ],
            [
                'section_key' => 'cta_block',
                'title_key' => 'Call to Action',
                'category' => SectionRegistry::CATEGORY_CONTENT,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Heading'],
                        ['key' => 'description', 'type' => 'textarea', 'label' => 'Description'],
                        ['key' => 'primary_cta_text', 'type' => 'text', 'label' => 'Primary Button Text'],
                        ['key' => 'primary_cta_url', 'type' => 'text', 'label' => 'Primary Button URL'],
                        ['key' => 'secondary_cta_text', 'type' => 'text', 'label' => 'Secondary Button Text'],
                        ['key' => 'secondary_cta_url', 'type' => 'text', 'label' => 'Secondary Button URL'],
                        ['key' => 'background_color', 'type' => 'color', 'label' => 'Background Color'],
                    ],
                ],
                'default_data' => [
                    'background_color' => '#f3f4f6',
                ],
            ],
            [
                'section_key' => 'faq_accordion',
                'title_key' => 'FAQ Accordion',
                'category' => SectionRegistry::CATEGORY_CONTENT,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Section Heading'],
                        [
                            'key' => 'items',
                            'type' => 'array',
                            'label' => 'FAQ Items',
                            'itemSchema' => [
                                'fields' => [
                                    ['key' => 'question', 'type' => 'text', 'label' => 'Question'],
                                    ['key' => 'answer', 'type' => 'richtext', 'label' => 'Answer'],
                                ],
                            ],
                        ],
                    ],
                ],
                'default_data' => [
                    'heading' => 'Frequently Asked Questions',
                    'items' => [],
                ],
            ],

            // Media sections
            [
                'section_key' => 'image_gallery',
                'title_key' => 'Image Gallery',
                'category' => SectionRegistry::CATEGORY_MEDIA,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Heading'],
                        ['key' => 'columns', 'type' => 'select', 'label' => 'Columns', 'options' => [
                            ['value' => '2', 'label' => '2 Columns'],
                            ['value' => '3', 'label' => '3 Columns'],
                            ['value' => '4', 'label' => '4 Columns'],
                        ]],
                        [
                            'key' => 'images',
                            'type' => 'array',
                            'label' => 'Images',
                            'itemSchema' => [
                                'fields' => [
                                    ['key' => 'url', 'type' => 'image', 'label' => 'Image URL'],
                                    ['key' => 'alt', 'type' => 'text', 'label' => 'Alt Text'],
                                    ['key' => 'caption', 'type' => 'text', 'label' => 'Caption'],
                                ],
                            ],
                        ],
                    ],
                ],
                'default_data' => [
                    'columns' => '3',
                    'images' => [],
                ],
            ],
            [
                'section_key' => 'video_embed',
                'title_key' => 'Video Embed',
                'category' => SectionRegistry::CATEGORY_MEDIA,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Heading'],
                        ['key' => 'video_url', 'type' => 'text', 'label' => 'Video URL (YouTube/Vimeo)'],
                        ['key' => 'caption', 'type' => 'text', 'label' => 'Caption'],
                        ['key' => 'autoplay', 'type' => 'boolean', 'label' => 'Autoplay'],
                    ],
                ],
                'default_data' => [
                    'autoplay' => false,
                ],
            ],
            [
                'section_key' => 'image_text',
                'title_key' => 'Image with Text',
                'category' => SectionRegistry::CATEGORY_MEDIA,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'image_url', 'type' => 'image', 'label' => 'Image URL'],
                        ['key' => 'image_alt', 'type' => 'text', 'label' => 'Image Alt Text'],
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Heading'],
                        ['key' => 'content', 'type' => 'richtext', 'label' => 'Content'],
                        ['key' => 'image_position', 'type' => 'select', 'label' => 'Image Position', 'options' => [
                            ['value' => 'left', 'label' => 'Left'],
                            ['value' => 'right', 'label' => 'Right'],
                        ]],
                        ['key' => 'cta_text', 'type' => 'text', 'label' => 'Button Text'],
                        ['key' => 'cta_url', 'type' => 'text', 'label' => 'Button URL'],
                    ],
                ],
                'default_data' => [
                    'image_position' => 'left',
                ],
            ],

            // Layout sections
            [
                'section_key' => 'spacer',
                'title_key' => 'Spacer',
                'category' => SectionRegistry::CATEGORY_LAYOUT,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'height', 'type' => 'select', 'label' => 'Height', 'options' => [
                            ['value' => 'small', 'label' => 'Small (24px)'],
                            ['value' => 'medium', 'label' => 'Medium (48px)'],
                            ['value' => 'large', 'label' => 'Large (96px)'],
                        ]],
                    ],
                ],
                'default_data' => [
                    'height' => 'medium',
                ],
            ],
            [
                'section_key' => 'divider',
                'title_key' => 'Divider',
                'category' => SectionRegistry::CATEGORY_LAYOUT,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'style', 'type' => 'select', 'label' => 'Style', 'options' => [
                            ['value' => 'solid', 'label' => 'Solid Line'],
                            ['value' => 'dashed', 'label' => 'Dashed Line'],
                            ['value' => 'dotted', 'label' => 'Dotted Line'],
                        ]],
                        ['key' => 'color', 'type' => 'color', 'label' => 'Color'],
                        ['key' => 'width', 'type' => 'select', 'label' => 'Width', 'options' => [
                            ['value' => 'narrow', 'label' => 'Narrow'],
                            ['value' => 'medium', 'label' => 'Medium'],
                            ['value' => 'full', 'label' => 'Full'],
                        ]],
                    ],
                ],
                'default_data' => [
                    'style' => 'solid',
                    'color' => '#e5e7eb',
                    'width' => 'full',
                ],
            ],
            [
                'section_key' => 'two_column',
                'title_key' => 'Two Column Layout',
                'category' => SectionRegistry::CATEGORY_LAYOUT,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'left_content', 'type' => 'richtext', 'label' => 'Left Column Content'],
                        ['key' => 'right_content', 'type' => 'richtext', 'label' => 'Right Column Content'],
                        ['key' => 'ratio', 'type' => 'select', 'label' => 'Column Ratio', 'options' => [
                            ['value' => '50-50', 'label' => '50% / 50%'],
                            ['value' => '33-67', 'label' => '33% / 67%'],
                            ['value' => '67-33', 'label' => '67% / 33%'],
                        ]],
                    ],
                ],
                'default_data' => [
                    'ratio' => '50-50',
                ],
            ],

            // Commerce sections
            [
                'section_key' => 'product_grid',
                'title_key' => 'Product Grid',
                'category' => SectionRegistry::CATEGORY_COMMERCE,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Heading'],
                        ['key' => 'category_slug', 'type' => 'text', 'label' => 'Category Slug (empty for all)'],
                        ['key' => 'limit', 'type' => 'number', 'label' => 'Number of Products', 'min' => 1, 'max' => 24],
                        ['key' => 'columns', 'type' => 'select', 'label' => 'Columns', 'options' => [
                            ['value' => '2', 'label' => '2 Columns'],
                            ['value' => '3', 'label' => '3 Columns'],
                            ['value' => '4', 'label' => '4 Columns'],
                        ]],
                    ],
                ],
                'default_data' => [
                    'limit' => 8,
                    'columns' => '4',
                ],
            ],
            [
                'section_key' => 'testimonials',
                'title_key' => 'Testimonials',
                'category' => SectionRegistry::CATEGORY_COMMERCE,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Heading'],
                        [
                            'key' => 'testimonials',
                            'type' => 'array',
                            'label' => 'Testimonials',
                            'itemSchema' => [
                                'fields' => [
                                    ['key' => 'quote', 'type' => 'textarea', 'label' => 'Quote'],
                                    ['key' => 'author_name', 'type' => 'text', 'label' => 'Author Name'],
                                    ['key' => 'author_title', 'type' => 'text', 'label' => 'Author Title'],
                                    ['key' => 'author_image', 'type' => 'image', 'label' => 'Author Image'],
                                    ['key' => 'rating', 'type' => 'number', 'label' => 'Rating (1-5)', 'min' => 1, 'max' => 5],
                                ],
                            ],
                        ],
                    ],
                ],
                'default_data' => [
                    'heading' => 'What Our Customers Say',
                    'testimonials' => [],
                ],
            ],

            // Advanced sections
            [
                'section_key' => 'custom_html',
                'title_key' => 'Custom HTML',
                'category' => SectionRegistry::CATEGORY_ADVANCED,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'html', 'type' => 'richtext', 'label' => 'HTML Content'],
                    ],
                ],
                'default_data' => [
                    'html' => '',
                ],
                'role_scope' => 'admin',
            ],
            [
                'section_key' => 'contact_form',
                'title_key' => 'Contact Form',
                'category' => SectionRegistry::CATEGORY_ADVANCED,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading', 'type' => 'text', 'label' => 'Heading'],
                        ['key' => 'description', 'type' => 'textarea', 'label' => 'Description'],
                        ['key' => 'success_message', 'type' => 'text', 'label' => 'Success Message'],
                        ['key' => 'show_phone', 'type' => 'boolean', 'label' => 'Show Phone Field'],
                        ['key' => 'show_company', 'type' => 'boolean', 'label' => 'Show Company Field'],
                    ],
                ],
                'default_data' => [
                    'heading' => 'Contact Us',
                    'success_message' => 'Thank you! We will be in touch soon.',
                    'show_phone' => true,
                    'show_company' => false,
                ],
            ],

            // Home Page Sections
            [
                'section_key' => 'hero_slider',
                'title_key' => 'Hero Slider',
                'description_key' => 'Fullscreen hero carousel with multiple slides',
                'icon' => 'photo',
                'category' => SectionRegistry::CATEGORY_CONTENT,
                'schema_json' => [
                    'fields' => [
                        [
                            'key' => 'slides',
                            'type' => 'array',
                            'label' => 'Slides',
                            'itemSchema' => [
                                'fields' => [
                                    ['key' => 'image_path', 'type' => 'image', 'label' => 'Background Image', 'required' => true],
                                    ['key' => 'alt_key', 'type' => 'text', 'label' => 'Image Alt (dictionary key)'],
                                    ['key' => 'h1_key', 'type' => 'text', 'label' => 'Heading (dictionary key)', 'required' => true],
                                    ['key' => 'p_key', 'type' => 'text', 'label' => 'Description (dictionary key)'],
                                    ['key' => 'cta1_label_key', 'type' => 'text', 'label' => 'Primary CTA Label (dictionary key)'],
                                    ['key' => 'cta1_href', 'type' => 'text', 'label' => 'Primary CTA URL'],
                                    ['key' => 'cta2_label_key', 'type' => 'text', 'label' => 'Secondary CTA Label (dictionary key)'],
                                    ['key' => 'cta2_href', 'type' => 'text', 'label' => 'Secondary CTA URL'],
                                    ['key' => 'overlay_style', 'type' => 'select', 'label' => 'Overlay Style', 'options' => [
                                        ['value' => 'dark', 'label' => 'Dark'],
                                        ['value' => 'light', 'label' => 'Light'],
                                    ]],
                                    ['key' => 'align', 'type' => 'select', 'label' => 'Text Alignment', 'options' => [
                                        ['value' => 'left', 'label' => 'Left'],
                                        ['value' => 'center', 'label' => 'Center'],
                                    ]],
                                    ['key' => 'is_active', 'type' => 'boolean', 'label' => 'Active'],
                                    ['key' => 'sort', 'type' => 'number', 'label' => 'Sort Order'],
                                ],
                            ],
                        ],
                    ],
                ],
                'default_data' => [
                    'slides' => [],
                ],
            ],
            [
                'section_key' => 'category_carousel',
                'title_key' => 'Category Carousel',
                'description_key' => 'Horizontal scrollable category cards',
                'icon' => 'squares-2x2',
                'category' => SectionRegistry::CATEGORY_COMMERCE,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'title_key', 'type' => 'text', 'label' => 'Title (dictionary key)'],
                        ['key' => 'category_ids', 'type' => 'array', 'label' => 'Specific Category IDs (empty for top categories)'],
                        ['key' => 'limit', 'type' => 'number', 'label' => 'Limit', 'min' => 4, 'max' => 20],
                    ],
                ],
                'default_data' => [
                    'title_key' => 'home.categories.title',
                    'category_ids' => [],
                    'limit' => 12,
                ],
            ],
            [
                'section_key' => 'new_arrivals',
                'title_key' => 'New Arrivals',
                'description_key' => 'Latest products grid',
                'icon' => 'sparkles',
                'category' => SectionRegistry::CATEGORY_COMMERCE,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'title_key', 'type' => 'text', 'label' => 'Title (dictionary key)'],
                        ['key' => 'limit', 'type' => 'number', 'label' => 'Limit', 'min' => 4, 'max' => 24],
                        ['key' => 'category_id', 'type' => 'number', 'label' => 'Category ID (optional)'],
                    ],
                ],
                'default_data' => [
                    'title_key' => 'home.new_arrivals.title',
                    'limit' => 8,
                    'category_id' => null,
                ],
            ],
            [
                'section_key' => 'video_section',
                'title_key' => 'Video Section',
                'description_key' => 'Promotional video with heading',
                'icon' => 'play',
                'category' => SectionRegistry::CATEGORY_MEDIA,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'heading_key', 'type' => 'text', 'label' => 'Heading (dictionary key)'],
                        ['key' => 'subheading_key', 'type' => 'text', 'label' => 'Subheading (dictionary key)'],
                        ['key' => 'video_type', 'type' => 'select', 'label' => 'Video Type', 'options' => [
                            ['value' => 'upload', 'label' => 'Upload'],
                            ['value' => 'embed', 'label' => 'Embed (YouTube/Vimeo)'],
                        ]],
                        ['key' => 'video_file_path', 'type' => 'file', 'label' => 'Video File (mp4/webm)', 'accept' => 'video/mp4,video/webm', 'maxSize' => 52428800],
                        ['key' => 'embed_url', 'type' => 'text', 'label' => 'Embed URL (YouTube/Vimeo)'],
                        ['key' => 'poster_path', 'type' => 'image', 'label' => 'Poster Image', 'maxSize' => 2097152],
                        ['key' => 'cta_label_key', 'type' => 'text', 'label' => 'CTA Label (dictionary key)'],
                        ['key' => 'cta_href', 'type' => 'text', 'label' => 'CTA URL'],
                    ],
                    'validation' => [
                        'video_file_path' => 'nullable|file|mimes:mp4,webm|max:51200',
                        'embed_url' => 'nullable|url|regex:/(youtube\\.com|vimeo\\.com)/i',
                        'poster_path' => 'nullable|image|max:2048|dimensions:min_width=800,min_height=450',
                    ],
                ],
                'default_data' => [
                    'video_type' => 'embed',
                ],
            ],
            [
                'section_key' => 'discount_tile_carousel',
                'title_key' => 'Discount Tile Carousel',
                'description_key' => 'Products with active discounts',
                'icon' => 'tag',
                'category' => SectionRegistry::CATEGORY_COMMERCE,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'title_key', 'type' => 'text', 'label' => 'Title (dictionary key)'],
                        ['key' => 'limit', 'type' => 'number', 'label' => 'Limit', 'min' => 4, 'max' => 20],
                        ['key' => 'min_discount_percent', 'type' => 'number', 'label' => 'Minimum Discount %', 'min' => 5, 'max' => 90],
                    ],
                ],
                'default_data' => [
                    'title_key' => 'home.discounts.title',
                    'limit' => 10,
                    'min_discount_percent' => 10,
                ],
            ],
            [
                'section_key' => 'gallery',
                'title_key' => 'Gallery',
                'description_key' => 'Image gallery grid',
                'icon' => 'photo',
                'category' => SectionRegistry::CATEGORY_MEDIA,
                'schema_json' => [
                    'fields' => [
                        ['key' => 'title_key', 'type' => 'text', 'label' => 'Title (dictionary key)'],
                        [
                            'key' => 'items',
                            'type' => 'array',
                            'label' => 'Gallery Items',
                            'maxItems' => 12,
                            'itemSchema' => [
                                'fields' => [
                                    ['key' => 'image_path', 'type' => 'image', 'label' => 'Image', 'required' => true, 'maxSize' => 3145728, 'minWidth' => 800, 'minHeight' => 800],
                                    ['key' => 'alt_key', 'type' => 'text', 'label' => 'Alt Text (dictionary key)'],
                                    ['key' => 'href', 'type' => 'text', 'label' => 'Link URL (optional)'],
                                    ['key' => 'sort', 'type' => 'number', 'label' => 'Sort Order'],
                                ],
                            ],
                        ],
                    ],
                ],
                'default_data' => [
                    'title_key' => 'home.gallery.title',
                    'items' => [],
                ],
            ],
        ];

        foreach ($sections as $sectionData) {
            SectionRegistry::updateOrCreate(
                ['section_key' => $sectionData['section_key']],
                $sectionData
            );
        }
    }
}
