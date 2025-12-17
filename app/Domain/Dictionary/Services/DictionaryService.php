<?php

namespace App\Domain\Dictionary\Services;

use App\Domain\Dictionary\Models\Dictionary;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;

class DictionaryService
{
    public function get(string $key, array $params = [], ?string $locale = null, mixed $default = null): string
    {
        $locale = $locale ?: app()->getLocale();
        $fallbackLocale = config('app.dictionary.fallback_locale', config('app.fallback_locale', 'en'));
        $defaultLocale = config('app.dictionary.default_locale', 'en');

        $value = $this->getRaw($locale, $key);

        if ($value === null && $fallbackLocale && $fallbackLocale !== $locale) {
            $value = $this->getRaw($fallbackLocale, $key);
        }

        if (
            $value === null &&
            $defaultLocale &&
            $defaultLocale !== $locale &&
            $defaultLocale !== $fallbackLocale
        ) {
            $value = $this->getRaw($defaultLocale, $key);
        }

        $value = $value ?? $default ?? $key;

        return $this->replacePlaceholders((string) $value, $params);
    }

    public function mergedLocale(string $locale): array
    {
        $fallbackLocale = config('app.dictionary.fallback_locale', config('app.fallback_locale', 'en'));
        $defaultLocale = config('app.dictionary.default_locale', 'en');

        $cacheKey = 'dictionary:merged:' . $locale;

        return Cache::rememberForever($cacheKey, function () use ($locale, $fallbackLocale, $defaultLocale) {
            $items = [];

            if ($defaultLocale) {
                $items = array_merge($items, $this->items($defaultLocale));
            }

            if ($fallbackLocale && $fallbackLocale !== $defaultLocale) {
                $items = array_merge($items, $this->items($fallbackLocale));
            }

            if ($locale !== $fallbackLocale && $locale !== $defaultLocale) {
                $items = array_merge($items, $this->items($locale));
            }

            if ($locale === $defaultLocale) {
                $items = array_merge($items, $this->items($locale));
            }

            return $items;
        });
    }

    public function clearCache(string $locale): void
    {
        Cache::forget('dictionary:items:' . $locale);
        Cache::forget('dictionary:merged:' . $locale);

        $fallbackLocale = config('app.dictionary.fallback_locale', config('app.fallback_locale', 'en'));
        $defaultLocale = config('app.dictionary.default_locale', 'en');

        Cache::forget('dictionary:merged:' . $fallbackLocale);
        Cache::forget('dictionary:merged:' . $defaultLocale);
    }

    private function getRaw(string $locale, string $key): ?string
    {
        $items = $this->items($locale);

        return $items[$key] ?? null;
    }

    private function items(string $locale): array
    {
        $cacheKey = 'dictionary:items:' . $locale;

        try {
            return Cache::rememberForever($cacheKey, function () use ($locale) {
                return Dictionary::query()
                    ->where('locale', $locale)
                    ->where('is_active', true)
                    ->pluck('value_text', 'dkey')
                    ->map(fn ($v) => (string) $v)
                    ->toArray();
            });
        } catch (QueryException) {
            return [];
        }
    }

    private function replacePlaceholders(string $value, array $params): string
    {
        if (empty($params)) {
            return $value;
        }

        $replacements = [];

        foreach ($params as $k => $v) {
            $replacements[':' . $k] = (string) $v;
        }

        return strtr($value, $replacements);
    }
}
