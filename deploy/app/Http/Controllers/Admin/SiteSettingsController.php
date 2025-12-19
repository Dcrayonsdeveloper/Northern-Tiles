<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SiteSettingsController extends Controller
{
    public function edit(): Response
    {
        $settings = Setting::getValue('site', [
            'name' => config('app.name'),
            'seo' => [
                'title' => config('app.name'),
                'description' => '',
            ],
            'home' => [
                'hero_title' => 'Jikra',
                'hero_subtitle' => '',
            ],
        ]);

        return Inertia::render('Admin/Settings/Site', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'seo' => ['nullable', 'array'],
            'seo.title' => ['nullable', 'string', 'max:255'],
            'seo.description' => ['nullable', 'string', 'max:500'],
            'home' => ['nullable', 'array'],
            'home.hero_title' => ['nullable', 'string', 'max:255'],
            'home.hero_subtitle' => ['nullable', 'string', 'max:500'],
        ]);

        Setting::setValue('site', $validated);

        return redirect()->route('admin.settings.site.edit');
    }
}
