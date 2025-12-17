<?php

namespace App\Domain\Settings\Http\Controllers\Admin;

use App\Domain\Settings\Http\Requests\Admin\ConfigurationRequest;
use App\Domain\Settings\Services\SettingService;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ConfigurationController
{
    public function edit(SettingService $settings): Response
    {
        return Inertia::render('Admin/Configuration', [
            'config' => [
                'site' => [
                    'title' => $settings->getText('site.title', config('app.name')),
                    'description' => $settings->getText('site.description', ''),
                ],
                'social' => [
                    'og_image_url' => $settings->getFileUrl('site.og_image'),
                    'twitter_site' => $settings->getText('twitter.site', ''),
                    'twitter_creator' => $settings->getText('twitter.creator', ''),
                ],
                'menus' => [
                    'header_top' => $settings->getJson('menu.header_top', ['items' => []]),
                    'header_main' => $settings->getJson('menu.header_main', ['items' => []]),
                    'footer' => $settings->getJson('menu.footer', ['items' => []]),
                ],
            ],
        ]);
    }

    public function update(ConfigurationRequest $request, SettingService $settings): RedirectResponse
    {
        $validated = $request->validated();

        $settings->setText('site.title', $validated['site_title'], 'site');
        $settings->setText('site.description', $validated['site_description'] ?? '', 'site');

        $settings->setText('twitter.site', $validated['twitter_site'] ?? '', 'social');
        $settings->setText('twitter.creator', $validated['twitter_creator'] ?? '', 'social');

        $settings->setJson('menu.header_top', ['items' => $validated['menu_header_top'] ?? []], 'menus');
        $settings->setJson('menu.header_main', ['items' => $validated['menu_header_main'] ?? []], 'menus');
        $settings->setJson('menu.footer', ['items' => $validated['menu_footer'] ?? []], 'menus');

        if (($validated['remove_og_image'] ?? false) === true) {
            $settings->removeFile('site.og_image');
        }

        if ($request->hasFile('og_image')) {
            $settings->setFile('site.og_image', $request->file('og_image'), 'site', 'social');
        }

        Setting::forgetCache('site.title');
        Setting::forgetCache('site.description');
        Setting::forgetCache('site.og_image');
        Setting::forgetCache('twitter.site');
        Setting::forgetCache('twitter.creator');
        Setting::forgetCache('menu.header_top');
        Setting::forgetCache('menu.header_main');
        Setting::forgetCache('menu.footer');

        return redirect()->route('admin.configuration.edit')->with('success', 'Configuration updated.');
    }
}
