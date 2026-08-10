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
            // dictionary: shared on every response (closure = resolved only when
            // Inertia serialises props). It powers the d()/useD() translator used
            // for all UI labels — including the auth pages, which have no fallback
            // text — so it must always be present, not lazy. It was previously
            // Inertia::lazy(), which is sent ONLY on explicit partial reloads and
            // is therefore absent on normal page loads; that made every d() key
            // render as its raw string (e.g. "auth.sign_in.title"). The payload is
            // ~77 short rows, so always sharing it is negligible.
            'dictionary' => fn () => [
                'locale' => app()->getLocale(),
                'items' => app(DictionaryService::class)->mergedLocale(app()->getLocale()),
            ],
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
                'success'     => fn () => $request->session()->get('success'),
                'error'       => fn () => $request->session()->get('error'),
                // Forwarded by AuthenticatedSessionController on account lockout.
                // The frontend reads this to start a countdown timer and disable
                // the submit button until the lockout window expires.
                'retry_after' => fn () => $request->session()->get('retry_after'),
            ],
            // footerConfig, tracking, org schema, social — lazy on navigations
            'footerConfig' => \Inertia\Inertia::lazy(fn () => app(FooterConfigService::class)->getConfig()),
            'tracking' => \Inertia\Inertia::lazy(fn () => app(SiteConfigService::class)->getTrackingData()),
            'organizationJsonLd' => \Inertia\Inertia::lazy(fn () => app(SiteConfigService::class)->getOrganizationJsonLd()),
            'socialLinks' => \Inertia\Inertia::lazy(fn () => app(SiteConfigService::class)->getSocialLinks()),
        ];
    }
}
