<?php

namespace App\Domain\Dictionary\Http\Controllers\Admin;

use App\Domain\Dictionary\Http\Requests\Admin\DictionaryRequest;
use App\Domain\Dictionary\Models\Dictionary;
use App\Domain\Dictionary\Services\DictionaryService;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class DictionaryController
{
    public function index(Request $request): Response
    {
        $locale = $request->string('locale')->toString() ?: config('app.dictionary.default_locale', 'en');
        $group = $request->string('group')->toString() ?: null;
        $q = $request->string('q')->toString() ?: null;

        try {
            $query = Dictionary::query()->where('locale', $locale);

            if ($group) {
                $query->where('group', $group);
            }

            if ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('dkey', 'like', "%{$q}%")
                        ->orWhere('value_text', 'like', "%{$q}%");
                });
            }

            $items = $query
                ->orderBy('group')
                ->orderBy('dkey')
                ->paginate(25)
                ->withQueryString();

            $groups = Dictionary::query()
                ->whereNotNull('group')
                ->distinct()
                ->orderBy('group')
                ->pluck('group')
                ->values();

            $locales = Dictionary::query()
                ->distinct()
                ->orderBy('locale')
                ->pluck('locale')
                ->values();

            if ($locales->isEmpty()) {
                $locales = collect([config('app.dictionary.default_locale', 'en')]);
            }
        } catch (QueryException) {
            $items = new LengthAwarePaginator([], 0, 25, 1, [
                'path' => $request->url(),
                'query' => $request->query(),
            ]);
            $groups = collect();
            $locales = collect([config('app.dictionary.default_locale', 'en')]);
        }

        return Inertia::render('Admin/Dictionary/Index', [
            'items' => $items,
            'filters' => [
                'locale' => $locale,
                'group' => $group,
                'q' => $q,
            ],
            'groups' => $groups,
            'locales' => $locales,
        ]);
    }

    public function create(Request $request): Response
    {
        $locale = $request->string('locale')->toString() ?: config('app.dictionary.default_locale', 'en');

        return Inertia::render('Admin/Dictionary/Create', [
            'locale' => $locale,
        ]);
    }

    public function store(DictionaryRequest $request, DictionaryService $dictionary): RedirectResponse
    {
        $validated = $request->validated();

        Dictionary::query()->updateOrCreate(
            ['locale' => $validated['locale'], 'dkey' => $validated['dkey']],
            [
                'value_text' => $validated['value_text'] ?? null,
                'group' => $validated['group'] ?? null,
                'is_active' => (bool) $validated['is_active'],
            ],
        );

        $dictionary->clearCache($validated['locale']);

        return redirect()->route('admin.dictionary.index', [
            'locale' => $validated['locale'],
        ]);
    }

    public function edit(Dictionary $dictionaryEntry): Response
    {
        return Inertia::render('Admin/Dictionary/Edit', [
            'entry' => $dictionaryEntry,
        ]);
    }

    public function update(DictionaryRequest $request, Dictionary $dictionaryEntry, DictionaryService $dictionary): RedirectResponse
    {
        $validated = $request->validated();

        $oldLocale = $dictionaryEntry->locale;

        $dictionaryEntry->update($validated);

        $dictionary->clearCache($oldLocale);
        if ($validated['locale'] !== $oldLocale) {
            $dictionary->clearCache($validated['locale']);
        }

        return redirect()->route('admin.dictionary.index', [
            'locale' => $validated['locale'],
        ]);
    }

    public function destroy(Dictionary $dictionaryEntry, DictionaryService $dictionary): RedirectResponse
    {
        $locale = $dictionaryEntry->locale;

        $dictionaryEntry->delete();

        $dictionary->clearCache($locale);

        return redirect()->route('admin.dictionary.index', [
            'locale' => $locale,
        ]);
    }

    public function export(Request $request): HttpResponse
    {
        $locale = $request->string('locale')->toString() ?: config('app.dictionary.default_locale', 'en');

        $items = Dictionary::query()
            ->where('locale', $locale)
            ->orderBy('dkey')
            ->get(['dkey', 'value_text', 'group', 'is_active']);

        $payload = $items->map(fn ($i) => [
            'dkey' => $i->dkey,
            'value_text' => $i->value_text,
            'group' => $i->group,
            'is_active' => (bool) $i->is_active,
        ])->all();

        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return new HttpResponse($json, 200, [
            'Content-Type' => 'application/json; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="dictionary.' . $locale . '.json"',
        ]);
    }

    public function import(Request $request, DictionaryService $dictionary): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'max:10'],
            'json' => ['required', 'string'],
        ]);

        $locale = $validated['locale'];

        $decoded = json_decode($validated['json'], true);

        if (!is_array($decoded)) {
            return redirect()->back()->with('error', 'Invalid JSON.');
        }

        foreach ($decoded as $row) {
            if (!is_array($row)) {
                continue;
            }

            $dkey = (string) ($row['dkey'] ?? '');

            if ($dkey === '') {
                continue;
            }

            Dictionary::query()->updateOrCreate(
                ['locale' => $locale, 'dkey' => $dkey],
                [
                    'value_text' => $row['value_text'] ?? null,
                    'group' => $row['group'] ?? null,
                    'is_active' => array_key_exists('is_active', $row) ? (bool) $row['is_active'] : true,
                ],
            );
        }

        $dictionary->clearCache($locale);

        return redirect()->route('admin.dictionary.index', [
            'locale' => $locale,
        ])->with('success', 'Dictionary imported.');
    }
}
