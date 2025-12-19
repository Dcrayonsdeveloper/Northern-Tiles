<?php

namespace App\Domain\Settings\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $table = 'settings';

    protected $fillable = [
        'key',
        'group',
        'value',
        'value_text',
        'value_json',
        'value_file',
    ];

    protected $casts = [
        'value' => 'array',
        'value_json' => 'array',
    ];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $cacheKey = 'settings:' . $key;

        try {
            return Cache::rememberForever($cacheKey, function () use ($key, $default) {
                /** @var self|null $row */
                $row = static::query()->where('key', $key)->first();

                if (!$row) {
                    return $default;
                }

                if ($row->value_text !== null) {
                    return $row->value_text;
                }

                if ($row->value_file !== null) {
                    return $row->value_file;
                }

                if ($row->value_json !== null) {
                    return $row->value_json;
                }

                return $row->value ?? $default;
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

    public static function forgetCache(string $key): void
    {
        Cache::forget('settings:' . $key);
    }
}
