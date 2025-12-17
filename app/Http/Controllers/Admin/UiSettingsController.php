<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class UiSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Admin/UiSettings', [
            'topBar' => Setting::getValue('ui.topBar', config('ui.topBar')),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'backgroundColor' => ['required', 'string', 'max:32'],
            'textColor' => ['required', 'string', 'max:32'],
            'message' => ['required', 'string', 'max:255'],
            'linkLabel' => ['nullable', 'string', 'max:64'],
            'linkRoute' => ['nullable', 'string', 'max:100'],
        ]);

        $topBar = [
            'enabled' => (bool) $data['enabled'],
            'backgroundColor' => $data['backgroundColor'],
            'textColor' => $data['textColor'],
            'message' => $data['message'],
            'link' => (
                filled($data['linkLabel'] ?? null) && filled($data['linkRoute'] ?? null)
            ) ? [
                'label' => $data['linkLabel'],
                'route' => $data['linkRoute'],
            ] : null,
        ];

        Setting::setValue('ui.topBar', $topBar);

        return Redirect::route('admin.settings.ui.edit')->with('success', 'UI settings updated.');
    }
}
