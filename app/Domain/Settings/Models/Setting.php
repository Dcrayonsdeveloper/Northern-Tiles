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

    /** In-memory per-request cache — eliminates repeated DB/cache hits for the same key. */
    private static array $requestCache = [];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        // Serve from request-level memory first (zero cost on repeated lookups)
        if (array_key_exists($key, self::$requestCache)) {
            $cached = self::$requestCache[$key];
            return $cached === null ? $default : $cached;
        }

        $cacheKey = 'settings:' . $key;

        try {
            $value = Cache::rememberForever($cacheKey, function () use ($key) {
                /** @var self|null $row */
                $row = static::query()->where('key', $key)->first();

                if (!$row) {
                    return null;
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

                return $row->value;
            });

            self::$requestCache[$key] = $value;
            return $value ?? $default;
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
        unset(self::$requestCache[$key]);
    }

    public static function forgetCache(string $key): void
    {
        Cache::forget('settings:' . $key);
        unset(self::$requestCache[$key]);
    }
}
