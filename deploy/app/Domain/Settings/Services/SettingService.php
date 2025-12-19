<?php

namespace App\Domain\Settings\Services;

use App\Domain\Settings\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class SettingService
{
    public function getText(string $key, ?string $default = null): ?string
    {
        $v = Setting::getValue($key, $default);

        if ($v === null) {
            return $default;
        }

        if (is_array($v)) {
            return $default;
        }

        return (string) $v;
    }

    public function getJson(string $key, array $default = []): array
    {
        $v = Setting::getValue($key, $default);

        return is_array($v) ? $v : $default;
    }

    public function getFilePath(string $key): ?string
    {
        $v = Setting::getValue($key);
        return is_string($v) && $v !== '' ? $v : null;
    }

    public function getFileUrl(string $key): ?string
    {
        $path = $this->getFilePath($key);

        if (!$path) {
            return null;
        }

        return asset('storage/' . ltrim($path, '/'));
    }

    public function setText(string $key, ?string $value, ?string $group = null): void
    {
        Setting::query()->updateOrCreate(
            ['key' => $key],
            ['group' => $group, 'value_text' => $value, 'value_json' => null, 'value_file' => null],
        );

        Setting::forgetCache($key);
    }

    public function setJson(string $key, array $value, ?string $group = null): void
    {
        Setting::query()->updateOrCreate(
            ['key' => $key],
            ['group' => $group, 'value_json' => $value, 'value_text' => null, 'value_file' => null],
        );

        Setting::forgetCache($key);
    }

    public function setFile(string $key, UploadedFile $file, string $dir, ?string $group = null): string
    {
        $old = Setting::query()->where('key', $key)->value('value_file');

        $path = $file->store($dir, 'public');

        Setting::query()->updateOrCreate(
            ['key' => $key],
            ['group' => $group, 'value_file' => $path, 'value_text' => null, 'value_json' => null],
        );

        Setting::forgetCache($key);

        if (is_string($old) && $old !== '' && $old !== $path) {
            Storage::disk('public')->delete($old);
        }

        return $path;
    }

    public function removeFile(string $key): void
    {
        $old = Setting::query()->where('key', $key)->value('value_file');

        Setting::query()->updateOrCreate(
            ['key' => $key],
            ['value_file' => null],
        );

        Setting::forgetCache($key);

        if (is_string($old) && $old !== '') {
            Storage::disk('public')->delete($old);
        }
    }

    public function menuItems(string $key, array $defaultItems = []): array
    {
        $menu = $this->getJson($key, ['items' => $defaultItems]);
        $items = Arr::get($menu, 'items', []);

        if (!is_array($items)) {
            $items = [];
        }

        $items = collect($items)
            ->filter(fn ($i) => is_array($i))
            ->filter(fn ($i) => (bool) ($i['is_active'] ?? true))
            ->sortBy(fn ($i) => (int) ($i['sort'] ?? 100))
            ->values()
            ->all();

        return $items;
    }
}
