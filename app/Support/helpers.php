<?php

use App\Domain\Dictionary\Services\DictionaryService;

if (!function_exists('d')) {
    function d(string $key, array $params = [], ?string $locale = null, mixed $default = null): string
    {
        return app(DictionaryService::class)->get($key, $params, $locale, $default);
    }
}
