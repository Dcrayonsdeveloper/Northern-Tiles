<?php

namespace App\Domain\Settings\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Home tab - Hero slides
            ...$this->heroSlidesRules(),

            // Identity tab
            'site_title' => ['required', 'string', 'max:255'],
            'site_tagline' => ['nullable', 'string', 'max:255'],

            'logo' => ['nullable', 'file', 'image', 'max:2048', 'dimensions:max_width=500,max_height=200'],
            'remove_logo' => ['nullable', 'boolean'],

            'logo_dark' => ['nullable', 'file', 'image', 'max:2048', 'dimensions:max_width=500,max_height=200'],
            'remove_logo_dark' => ['nullable', 'boolean'],

            'favicon' => ['nullable', 'file', 'image', 'max:512', 'dimensions:width=32,height=32'],
            'remove_favicon' => ['nullable', 'boolean'],

            'footer_logo' => ['nullable', 'file', 'image', 'max:2048', 'dimensions:max_width=500,max_height=200'],
            'remove_footer_logo' => ['nullable', 'boolean'],

            // Company tab
            'company_legal_name' => ['nullable', 'string', 'max:255'],
            'company_address' => ['nullable', 'string', 'max:500'],
            'company_city' => ['nullable', 'string', 'max:100'],
            'company_state' => ['nullable', 'string', 'max:100'],
            'company_postal_code' => ['nullable', 'string', 'max:20'],
            'company_country' => ['nullable', 'string', 'max:100'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'company_phone' => ['nullable', 'string', 'max:50'],
            'company_vat_number' => ['nullable', 'string', 'max:50'],

            // Social tab
            'social_facebook_url' => ['nullable', 'url', 'max:500'],
            'social_twitter_url' => ['nullable', 'url', 'max:500'],
            'social_instagram_url' => ['nullable', 'url', 'max:500'],
            'social_youtube_url' => ['nullable', 'url', 'max:500'],
            'social_linkedin_url' => ['nullable', 'url', 'max:500'],
            'social_tiktok_url' => ['nullable', 'url', 'max:500'],
            'twitter_site' => ['nullable', 'string', 'max:64', 'regex:/^@?[a-zA-Z0-9_]+$/'],
            'twitter_creator' => ['nullable', 'string', 'max:64', 'regex:/^@?[a-zA-Z0-9_]+$/'],

            // SEO tab
            'seo_meta_title' => ['nullable', 'string', 'max:70'],
            'seo_meta_description' => ['nullable', 'string', 'max:160'],
            'og_image' => ['nullable', 'file', 'image', 'max:4096', 'dimensions:min_width=1200,min_height=630'],
            'remove_og_image' => ['nullable', 'boolean'],

            // Tracking tab
            'tracking_gtm_id' => ['nullable', 'string', 'max:50', 'regex:/^GTM-[A-Z0-9]+$/'],
            'tracking_ga4_id' => ['nullable', 'string', 'max:50', 'regex:/^G-[A-Z0-9]+$/'],
            'tracking_meta_pixel_id' => ['nullable', 'string', 'max:50', 'regex:/^\d+$/'],

            // Menus tab
            ...$this->menuRules('menu_header_top'),
            ...$this->menuRules('menu_header_main'),
            ...$this->menuRules('menu_footer_shop'),
            ...$this->menuRules('menu_footer_company'),
            ...$this->menuRules('menu_footer_help'),
            ...$this->menuRules('menu_footer_policies'),
        ];
    }

    protected function menuRules(string $prefix): array
    {
        return [
            $prefix => ['nullable', 'array'],
            "{$prefix}.*.label" => ["required_with:{$prefix}", 'string', 'max:120'],
            "{$prefix}.*.url" => ["required_with:{$prefix}", 'string', 'max:500'],
            "{$prefix}.*.target" => ["required_with:{$prefix}", 'string', Rule::in(['_self', '_blank'])],
            "{$prefix}.*.is_active" => ['nullable', 'boolean'],
            "{$prefix}.*.sort" => ['nullable', 'integer', 'min:0', 'max:10000'],
        ];
    }

    protected function heroSlidesRules(): array
    {
        return [
            'hero_slides' => ['nullable', 'array', 'max:6'],
            'hero_slides.*.is_active' => ['nullable', 'boolean'],
            'hero_slides.*.sort' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'hero_slides.*.image_file' => [
                'nullable',
                'file',
                'image',
                'mimes:png,jpg,jpeg,webp',
                'max:4096',
                'dimensions:min_width=1600,min_height=800',
            ],
            'hero_slides.*.image_path' => ['nullable', 'string', 'max:500'],
            'hero_slides.*.image_alt_key' => ['nullable', 'string', 'max:255'],
            'hero_slides.*.h1_key' => ['required_if:hero_slides.*.is_active,true', 'nullable', 'string', 'max:255'],
            'hero_slides.*.p_key' => ['required_if:hero_slides.*.is_active,true', 'nullable', 'string', 'max:255'],
            'hero_slides.*.cta_primary_label_key' => ['nullable', 'string', 'max:255'],
            'hero_slides.*.cta_primary_href' => ['nullable', 'string', 'max:500'],
            'hero_slides.*.cta_secondary_label_key' => ['nullable', 'string', 'max:255'],
            'hero_slides.*.cta_secondary_href' => ['nullable', 'string', 'max:500'],
            'hero_slides.*.overlay_style' => ['nullable', 'string', Rule::in(['dark', 'light'])],
            'hero_slides.*.align' => ['nullable', 'string', Rule::in(['left', 'center'])],
        ];
    }

    public function messages(): array
    {
        return [
            'logo.dimensions' => 'Logo must be max 500x200 pixels.',
            'logo_dark.dimensions' => 'Dark logo must be max 500x200 pixels.',
            'favicon.dimensions' => 'Favicon must be exactly 32x32 pixels.',
            'footer_logo.dimensions' => 'Footer logo must be max 500x200 pixels.',
            'og_image.dimensions' => 'OG Image must be at least 1200x630 pixels.',
            'tracking_gtm_id.regex' => 'GTM ID must be in format GTM-XXXXXX.',
            'tracking_ga4_id.regex' => 'GA4 ID must be in format G-XXXXXX.',
            'tracking_meta_pixel_id.regex' => 'Meta Pixel ID must be numeric.',
            'twitter_site.regex' => 'Twitter handle must be valid (e.g., @username).',
            'twitter_creator.regex' => 'Twitter handle must be valid (e.g., @username).',
            'hero_slides.max' => 'Maximum 6 hero slides allowed.',
            'hero_slides.*.image_file.dimensions' => 'Hero image must be at least 1600x800 pixels (recommended 1920x960).',
            'hero_slides.*.image_file.max' => 'Hero image must be less than 4MB.',
            'hero_slides.*.h1_key.required_if' => 'H1 title key is required for active slides.',
            'hero_slides.*.p_key.required_if' => 'Paragraph key is required for active slides.',
        ];
    }
}
