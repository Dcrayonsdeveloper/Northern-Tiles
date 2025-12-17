<?php

namespace App\Http\Middleware;

use App\Domain\Dictionary\Services\DictionaryService;
use App\Domain\Menu\Services\MenuService;
use App\Domain\Settings\Models\Setting;
use App\Domain\Settings\Services\FooterConfigService;
use App\Domain\Settings\Services\SettingService;
use App\Domain\Settings\Services\SiteConfigService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $cart = $request->session()->get('cart', []);

        return [
            ...parent::share($request),
            'dictionary' => fn () => [
                'locale' => app()->getLocale(),
                'items' => app(DictionaryService::class)->mergedLocale(app()->getLocale()),
            ],
            'ui' => [
                'topBar' => Setting::getValue('ui.topBar', config('ui.topBar')),
            ],
            'site' => fn () => app(SiteConfigService::class)->getSiteData(),
            'menus' => fn () => [
                'header_top' => app(SettingService::class)->menuItems('menu.header_top', []),
                'header_main' => app(MenuService::class)->getTree('header'),
                'footer' => app(MenuService::class)->getTree('footer'),
                'mobile' => app(MenuService::class)->getTree('mobile'),
            ],
            'auth' => [
                'user' => $request->user(),
            ],
            'cart' => [
                'count' => array_sum(array_map('intval', $cart)),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'footerConfig' => fn () => app(FooterConfigService::class)->getConfig(),
            'tracking' => fn () => app(SiteConfigService::class)->getTrackingData(),
            'organizationJsonLd' => fn () => app(SiteConfigService::class)->getOrganizationJsonLd(),
            'socialLinks' => fn () => app(SiteConfigService::class)->getSocialLinks(),
        ];
    }
}
