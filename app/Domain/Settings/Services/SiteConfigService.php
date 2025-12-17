<?php

namespace App\Domain\Settings\Services;

class SiteConfigService
{
    public function __construct(
        protected SettingService $settings,
    ) {}

    public function getSiteData(): array
    {
        return [
            'title' => $this->settings->getText('site.title', config('app.name')),
            'tagline' => $this->settings->getText('site.tagline', ''),
            'description' => $this->settings->getText('seo.meta_description', ''),
            'og_image_url' => $this->settings->getFileUrl('site.og_image'),
            'twitter_site' => $this->settings->getText('twitter.site', ''),
            'twitter_creator' => $this->settings->getText('twitter.creator', ''),
            'logo_url' => $this->settings->getFileUrl('site.logo'),
            'favicon_url' => $this->settings->getFileUrl('site.favicon'),
        ];
    }

    public function getTrackingData(): array
    {
        return [
            'gtm_id' => $this->settings->getText('tracking.gtm_id', ''),
            'ga4_id' => $this->settings->getText('tracking.ga4_id', ''),
            'meta_pixel_id' => $this->settings->getText('tracking.meta_pixel_id', ''),
        ];
    }

    public function getCompanyData(): array
    {
        return [
            'legal_name' => $this->settings->getText('company.legal_name', ''),
            'address' => $this->settings->getText('company.address', ''),
            'city' => $this->settings->getText('company.city', ''),
            'state' => $this->settings->getText('company.state', ''),
            'postal_code' => $this->settings->getText('company.postal_code', ''),
            'country' => $this->settings->getText('company.country', ''),
            'email' => $this->settings->getText('company.email', ''),
            'phone' => $this->settings->getText('company.phone', ''),
            'vat_number' => $this->settings->getText('company.vat_number', ''),
        ];
    }

    public function getSocialLinks(): array
    {
        return array_filter([
            'facebook' => $this->settings->getText('social.facebook_url', ''),
            'twitter' => $this->settings->getText('social.twitter_url', ''),
            'instagram' => $this->settings->getText('social.instagram_url', ''),
            'youtube' => $this->settings->getText('social.youtube_url', ''),
            'linkedin' => $this->settings->getText('social.linkedin_url', ''),
            'tiktok' => $this->settings->getText('social.tiktok_url', ''),
        ]);
    }

    public function getOrganizationJsonLd(): ?array
    {
        $company = $this->getCompanyData();
        $site = $this->getSiteData();
        $social = $this->getSocialLinks();

        if (empty($company['legal_name']) && empty($site['title'])) {
            return null;
        }

        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $company['legal_name'] ?: $site['title'],
            'url' => config('app.url'),
        ];

        if ($site['logo_url']) {
            $jsonLd['logo'] = $site['logo_url'];
        }

        if ($company['email']) {
            $jsonLd['email'] = $company['email'];
        }

        if ($company['phone']) {
            $jsonLd['telephone'] = $company['phone'];
        }

        if ($company['address'] || $company['city'] || $company['country']) {
            $jsonLd['address'] = [
                '@type' => 'PostalAddress',
            ];

            if ($company['address']) {
                $jsonLd['address']['streetAddress'] = $company['address'];
            }
            if ($company['city']) {
                $jsonLd['address']['addressLocality'] = $company['city'];
            }
            if ($company['state']) {
                $jsonLd['address']['addressRegion'] = $company['state'];
            }
            if ($company['postal_code']) {
                $jsonLd['address']['postalCode'] = $company['postal_code'];
            }
            if ($company['country']) {
                $jsonLd['address']['addressCountry'] = $company['country'];
            }
        }

        if (!empty($social)) {
            $jsonLd['sameAs'] = array_values($social);
        }

        if ($company['vat_number']) {
            $jsonLd['vatID'] = $company['vat_number'];
        }

        return $jsonLd;
    }

    /**
     * Get hero slides for the home page carousel.
     * Returns active slides sorted by sort order with resolved image URLs.
     */
    public function getHomeHeroSlides(): array
    {
        $slides = $this->settings->getJson('home.hero_slides', []);

        if (empty($slides)) {
            return [];
        }

        // Filter active slides and sort by sort order
        $activeSlides = array_filter($slides, fn($slide) => ($slide['is_active'] ?? true));
        usort($activeSlides, fn($a, $b) => ($a['sort'] ?? 0) - ($b['sort'] ?? 0));

        // Resolve image URLs for each slide
        return array_map(function ($slide, $index) {
            // If image_path is set, resolve the full URL (uploaded local file takes priority)
            if (!empty($slide['image_path'])) {
                $slide['image_url'] = asset('storage/' . $slide['image_path']);
            }
            // Otherwise keep the existing image_url if set (external/placeholder URL)

            // Add an ID for React key
            $slide['id'] = $index + 1;

            return $slide;
        }, $activeSlides, array_keys($activeSlides));
    }
}
