<?php

namespace App\Http\Middleware;

use App\Domain\Dictionary\Services\DictionaryService;
use App\Domain\Settings\Services\SettingService;
use App\Models\Setting;
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
            'site' => fn () => [
                'title' => app(SettingService::class)->getText('site.title', config('app.name')),
                'description' => app(SettingService::class)->getText('site.description', ''),
                'og_image_url' => app(SettingService::class)->getFileUrl('site.og_image'),
                'twitter_site' => app(SettingService::class)->getText('twitter.site', ''),
                'twitter_creator' => app(SettingService::class)->getText('twitter.creator', ''),
            ],
            'menus' => fn () => [
                'header_top' => app(SettingService::class)->menuItems('menu.header_top', []),
                'header_main' => app(SettingService::class)->menuItems('menu.header_main', []),
                'footer' => app(SettingService::class)->menuItems('menu.footer', []),
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
        ];
    }
}
