<?php

namespace App\Domain\SEO\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Cache;

class SeoMeta extends Model
{
    protected $table = 'seo_meta';

    protected $fillable = [
        'model_type',
        'model_id',
        'url_path',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_title',
        'og_description',
        'og_image',
        'og_type',
        'twitter_title',
        'twitter_description',
        'twitter_image',
        'twitter_card',
        'canonical_url',
        'noindex',
        'nofollow',
        'schema_json',
        'custom_meta_json',
    ];

    protected $casts = [
        'noindex' => 'boolean',
        'nofollow' => 'boolean',
        'schema_json' => 'array',
        'custom_meta_json' => 'array',
    ];

    protected $appends = ['robots', 'schema_markup'];

    protected static function booted(): void
    {
        static::saved(function (self $meta) {
            Cache::forget("seo.meta.{$meta->model_type}.{$meta->model_id}");
        });
        static::deleted(function (self $meta) {
            Cache::forget("seo.meta.{$meta->model_type}.{$meta->model_id}");
        });
    }

    public function model(): MorphTo
    {
        return $this->morphTo('model', 'model_type', 'model_id');
    }

    public static function getFor(string $modelType, int $modelId): ?self
    {
        return Cache::remember(
            "seo.meta.{$modelType}.{$modelId}",
            3600,
            fn () => static::where('model_type', $modelType)
                ->where('model_id', $modelId)
                ->first()
        );
    }

    public static function updateFor(string $modelType, int $modelId, array $data): self
    {
        return static::updateOrCreate(
            ['model_type' => $modelType, 'model_id' => $modelId],
            $data
        );
    }

    public function getMetaTitle(?string $default = null): string
    {
        return $this->meta_title ?? $default ?? '';
    }

    public function getMetaDescription(?string $default = null): string
    {
        return $this->meta_description ?? $default ?? '';
    }

    public function getOgTitle(?string $default = null): string
    {
        return $this->og_title ?? $this->meta_title ?? $default ?? '';
    }

    public function getOgDescription(?string $default = null): string
    {
        return $this->og_description ?? $this->meta_description ?? $default ?? '';
    }

    public function getTwitterTitle(?string $default = null): string
    {
        return $this->twitter_title ?? $this->og_title ?? $this->meta_title ?? $default ?? '';
    }

    public function getTwitterDescription(?string $default = null): string
    {
        return $this->twitter_description ?? $this->og_description ?? $this->meta_description ?? $default ?? '';
    }

    public function getRobotsContent(): string
    {
        $parts = [];
        if ($this->noindex) {
            $parts[] = 'noindex';
        }
        if ($this->nofollow) {
            $parts[] = 'nofollow';
        }
        return implode(', ', $parts) ?: 'index, follow';
    }

    public function getSchema(): array
    {
        return $this->schema_json ?? [];
    }

    public function getRobotsAttribute(): string
    {
        $index = $this->noindex ? 'noindex' : 'index';
        $follow = $this->nofollow ? 'nofollow' : 'follow';
        return "{$index}, {$follow}";
    }

    public function getSchemaMarkupAttribute(): string
    {
        return $this->schema_json
            ? json_encode($this->schema_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            : '';
    }
}
