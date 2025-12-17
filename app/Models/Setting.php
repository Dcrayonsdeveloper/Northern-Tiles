<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $cacheKey = 'settings:' . $key;

        try {
            return Cache::rememberForever($cacheKey, function () use ($key, $default) {
                $value = static::query()->where('key', $key)->value('value');

                return $value ?? $default;
            });
        } catch (QueryException) {
            return $default;
        }
    }

    public static function setValue(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value],
        );

        Cache::forget('settings:' . $key);
    }
}
