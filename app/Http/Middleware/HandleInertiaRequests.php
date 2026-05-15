<?php

namespace App\Http\Middleware;

use App\Domain\Cart\Services\CartService;
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
        return [
            ...parent::share($request),
            // dictionary: lazy so it's excluded from Inertia partial-reload responses
            'dictionary' => \Inertia\Inertia::lazy(fn () => [
                'locale' => app()->getLocale(),
                'items' => app(DictionaryService::class)->mergedLocale(app()->getLocale()),
            ]),
            // ui.topBar wrapped in fn() — only resolved when Inertia uses it, not on every boot
            'ui' => fn () => [
                'topBar' => Setting::getValue('ui.topBar', config('ui.topBar')),
            ],
            'site' => fn () => app(SiteConfigService::class)->getSiteData(),
            // menus: lazy — sent only on full page loads, not on Inertia navigations
            'menus' => \Inertia\Inertia::lazy(fn () => [
                'header_top' => app(SettingService::class)->menuItems('menu.header_top', []),
                'header_main' => app(MenuService::class)->getTree('header'),
                'footer' => app(MenuService::class)->getTree('footer'),
                'mobile' => app(MenuService::class)->getTree('mobile'),
            ]),
            'auth' => [
                'user' => $request->user(),
            ],
            'cart' => fn () => [
                'count' => app(CartService::class)->getCount(
                    $request->user()?->id,
                    $request->session()->getId()
                ),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            // footerConfig, tracking, org schema, social — lazy on navigations
            'footerConfig' => \Inertia\Inertia::lazy(fn () => app(FooterConfigService::class)->getConfig()),
            'tracking' => \Inertia\Inertia::lazy(fn () => app(SiteConfigService::class)->getTrackingData()),
            'organizationJsonLd' => \Inertia\Inertia::lazy(fn () => app(SiteConfigService::class)->getOrganizationJsonLd()),
            'socialLinks' => \Inertia\Inertia::lazy(fn () => app(SiteConfigService::class)->getSocialLinks()),
        ];
    }
}
