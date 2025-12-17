<?php

namespace App\Domain\Settings\Http\Controllers\Admin;

use App\Domain\Menu\Models\Menu;
use App\Domain\Settings\Http\Requests\Admin\ConfigurationRequest;
use App\Domain\Settings\Models\Setting;
use App\Domain\Settings\Services\SettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ConfigurationController
{
    public function edit(SettingService $settings): Response
    {
        return Inertia::render('Admin/Configuration', [
            'config' => [
                // Home tab
                'home' => [
                    'hero_slides' => $settings->getJson('home.hero_slides', []),
                ],

                // Identity tab
                'identity' => [
                    'site_title' => $settings->getText('site.title', config('app.name')),
                    'site_tagline' => $settings->getText('site.tagline', ''),
                    'logo_url' => $settings->getFileUrl('site.logo'),
                    'logo_dark_url' => $settings->getFileUrl('site.logo_dark'),
                    'favicon_url' => $settings->getFileUrl('site.favicon'),
                    'footer_logo_url' => $settings->getFileUrl('footer.logo'),
                ],

                // Company tab
                'company' => [
                    'legal_name' => $settings->getText('company.legal_name', ''),
                    'address' => $settings->getText('company.address', ''),
                    'city' => $settings->getText('company.city', ''),
                    'state' => $settings->getText('company.state', ''),
                    'postal_code' => $settings->getText('company.postal_code', ''),
                    'country' => $settings->getText('company.country', ''),
                    'email' => $settings->getText('company.email', ''),
                    'phone' => $settings->getText('company.phone', ''),
                    'vat_number' => $settings->getText('company.vat_number', ''),
                ],

                // Social tab
                'social' => [
                    'facebook_url' => $settings->getText('social.facebook_url', ''),
                    'twitter_url' => $settings->getText('social.twitter_url', ''),
                    'instagram_url' => $settings->getText('social.instagram_url', ''),
                    'youtube_url' => $settings->getText('social.youtube_url', ''),
                    'linkedin_url' => $settings->getText('social.linkedin_url', ''),
                    'tiktok_url' => $settings->getText('social.tiktok_url', ''),
                    'twitter_site' => $settings->getText('twitter.site', ''),
                    'twitter_creator' => $settings->getText('twitter.creator', ''),
                ],

                // SEO tab
                'seo' => [
                    'meta_title' => $settings->getText('seo.meta_title', ''),
                    'meta_description' => $settings->getText('seo.meta_description', ''),
                    'og_image_url' => $settings->getFileUrl('site.og_image'),
                ],

                // Tracking tab
                'tracking' => [
                    'gtm_id' => $settings->getText('tracking.gtm_id', ''),
                    'ga4_id' => $settings->getText('tracking.ga4_id', ''),
                    'meta_pixel_id' => $settings->getText('tracking.meta_pixel_id', ''),
                ],

                // Menus tab
                'menus' => [
                    'header_top' => $settings->getJson('menu.header_top', ['items' => []]),
                    'header_main' => $settings->getJson('menu.header_main', ['items' => []]),
                    'footer_shop' => $settings->getJson('menu.footer_shop', ['items' => []]),
                    'footer_company' => $settings->getJson('menu.footer_company', ['items' => []]),
                    'footer_help' => $settings->getJson('menu.footer_help', ['items' => []]),
                    'footer_policies' => $settings->getJson('menu.footer_policies', ['items' => []]),
                ],
            ],

            'availableMenus' => Menu::query()
                ->select(['id', 'name', 'slug', 'location'])
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function update(ConfigurationRequest $request, SettingService $settings): RedirectResponse
    {
        $validated = $request->validated();

        // Home - Hero slides
        $this->handleHeroSlides($request, $settings, $validated['hero_slides'] ?? []);

        // Identity
        $settings->setText('site.title', $validated['site_title'] ?? '', 'identity');
        $settings->setText('site.tagline', $validated['site_tagline'] ?? '', 'identity');

        $this->handleFileUpload($request, $settings, 'logo', 'site.logo', 'logos', 'identity');
        $this->handleFileUpload($request, $settings, 'logo_dark', 'site.logo_dark', 'logos', 'identity');
        $this->handleFileUpload($request, $settings, 'favicon', 'site.favicon', 'logos', 'identity');
        $this->handleFileUpload($request, $settings, 'footer_logo', 'footer.logo', 'logos', 'identity');

        // Company
        $settings->setText('company.legal_name', $validated['company_legal_name'] ?? '', 'company');
        $settings->setText('company.address', $validated['company_address'] ?? '', 'company');
        $settings->setText('company.city', $validated['company_city'] ?? '', 'company');
        $settings->setText('company.state', $validated['company_state'] ?? '', 'company');
        $settings->setText('company.postal_code', $validated['company_postal_code'] ?? '', 'company');
        $settings->setText('company.country', $validated['company_country'] ?? '', 'company');
        $settings->setText('company.email', $validated['company_email'] ?? '', 'company');
        $settings->setText('company.phone', $validated['company_phone'] ?? '', 'company');
        $settings->setText('company.vat_number', $validated['company_vat_number'] ?? '', 'company');

        // Social
        $settings->setText('social.facebook_url', $validated['social_facebook_url'] ?? '', 'social');
        $settings->setText('social.twitter_url', $validated['social_twitter_url'] ?? '', 'social');
        $settings->setText('social.instagram_url', $validated['social_instagram_url'] ?? '', 'social');
        $settings->setText('social.youtube_url', $validated['social_youtube_url'] ?? '', 'social');
        $settings->setText('social.linkedin_url', $validated['social_linkedin_url'] ?? '', 'social');
        $settings->setText('social.tiktok_url', $validated['social_tiktok_url'] ?? '', 'social');
        $settings->setText('twitter.site', $validated['twitter_site'] ?? '', 'social');
        $settings->setText('twitter.creator', $validated['twitter_creator'] ?? '', 'social');

        // SEO
        $settings->setText('seo.meta_title', $validated['seo_meta_title'] ?? '', 'seo');
        $settings->setText('seo.meta_description', $validated['seo_meta_description'] ?? '', 'seo');
        $this->handleFileUpload($request, $settings, 'og_image', 'site.og_image', 'seo', 'seo');

        // Tracking
        $settings->setText('tracking.gtm_id', $validated['tracking_gtm_id'] ?? '', 'tracking');
        $settings->setText('tracking.ga4_id', $validated['tracking_ga4_id'] ?? '', 'tracking');
        $settings->setText('tracking.meta_pixel_id', $validated['tracking_meta_pixel_id'] ?? '', 'tracking');

        // Menus
        $settings->setJson('menu.header_top', ['items' => $validated['menu_header_top'] ?? []], 'menus');
        $settings->setJson('menu.header_main', ['items' => $validated['menu_header_main'] ?? []], 'menus');
        $settings->setJson('menu.footer_shop', ['items' => $validated['menu_footer_shop'] ?? []], 'menus');
        $settings->setJson('menu.footer_company', ['items' => $validated['menu_footer_company'] ?? []], 'menus');
        $settings->setJson('menu.footer_help', ['items' => $validated['menu_footer_help'] ?? []], 'menus');
        $settings->setJson('menu.footer_policies', ['items' => $validated['menu_footer_policies'] ?? []], 'menus');

        // Clear all relevant caches
        $this->clearCaches();

        return redirect()->route('admin.configuration.edit')->with('success', 'Configuration updated.');
    }

    protected function handleFileUpload(
        ConfigurationRequest $request,
        SettingService $settings,
        string $fieldName,
        string $settingKey,
        string $directory,
        string $group
    ): void {
        $removeKey = 'remove_' . $fieldName;

        if (($request->validated()[$removeKey] ?? false) === true) {
            $settings->removeFile($settingKey);
        }

        if ($request->hasFile($fieldName)) {
            $settings->setFile($settingKey, $request->file($fieldName), $directory, $group);
        }
    }

    protected function handleHeroSlides(
        ConfigurationRequest $request,
        SettingService $settings,
        array $slides
    ): void {
        $existingSlides = $settings->getJson('home.hero_slides', []);
        $processedSlides = [];

        foreach ($slides as $index => $slide) {
            $processedSlide = [
                'is_active' => $slide['is_active'] ?? true,
                'sort' => $slide['sort'] ?? $index,
                'image_path' => $slide['image_path'] ?? null,
                'image_alt_key' => $slide['image_alt_key'] ?? null,
                'h1_key' => $slide['h1_key'] ?? null,
                'p_key' => $slide['p_key'] ?? null,
                'cta_primary_label_key' => $slide['cta_primary_label_key'] ?? null,
                'cta_primary_href' => $slide['cta_primary_href'] ?? null,
                'cta_secondary_label_key' => $slide['cta_secondary_label_key'] ?? null,
                'cta_secondary_href' => $slide['cta_secondary_href'] ?? null,
                'overlay_style' => $slide['overlay_style'] ?? 'dark',
                'align' => $slide['align'] ?? 'left',
            ];

            // Handle new image upload
            $fileKey = "hero_slides.{$index}.image_file";
            if ($request->hasFile($fileKey)) {
                // Delete old image if exists
                if (!empty($existingSlides[$index]['image_path'])) {
                    Storage::disk('public')->delete($existingSlides[$index]['image_path']);
                }

                // Store new image
                $file = $request->file($fileKey);
                $path = $file->store('hero', 'public');
                $processedSlide['image_path'] = $path;
            }

            $processedSlides[] = $processedSlide;
        }

        // Clean up images from deleted slides
        foreach ($existingSlides as $index => $existingSlide) {
            if (!isset($slides[$index]) && !empty($existingSlide['image_path'])) {
                Storage::disk('public')->delete($existingSlide['image_path']);
            }
        }

        $settings->setJson('home.hero_slides', $processedSlides, 'home');
    }

    protected function clearCaches(): void
    {
        $keys = [
            'home.hero_slides',
            'site.title', 'site.tagline', 'site.logo', 'site.logo_dark', 'site.favicon',
            'footer.logo', 'company.legal_name', 'company.address', 'company.city',
            'company.state', 'company.postal_code', 'company.country', 'company.email',
            'company.phone', 'company.vat_number', 'social.facebook_url', 'social.twitter_url',
            'social.instagram_url', 'social.youtube_url', 'social.linkedin_url', 'social.tiktok_url',
            'twitter.site', 'twitter.creator', 'seo.meta_title', 'seo.meta_description',
            'site.og_image', 'tracking.gtm_id', 'tracking.ga4_id', 'tracking.meta_pixel_id',
            'menu.header_top', 'menu.header_main', 'menu.footer_shop', 'menu.footer_company',
            'menu.footer_help', 'menu.footer_policies',
        ];

        foreach ($keys as $key) {
            Setting::forgetCache($key);
        }
    }
}
