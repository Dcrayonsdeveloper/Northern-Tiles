<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Tag extends Model
{
    public const TYPE_MANUAL = 'manual';
    public const TYPE_GENERATED = 'generated';
    public const TYPE_SYSTEM = 'system';

    protected $fillable = [
        'name',
        'slug',
        'type',
        'color',
        'source',
        'confidence',
        'created_by',
    ];

    public function products(): MorphToMany
    {
        return $this->morphedByMany(\App\Models\Product::class, 'taggable')
            ->withPivot('metadata_json')
            ->withTimestamps();
    }

    public function posts(): MorphToMany
    {
        return $this->morphedByMany(\App\Domain\CMS\Models\Post::class, 'taggable')
            ->withPivot('metadata_json')
            ->withTimestamps();
    }

    public function scopeManual($query)
    {
        return $query->where('type', 'manual');
    }

    public function scopeAuto($query)
    {
        return $query->where('type', 'auto');
    }

    public function scopeGenerated($query)
    {
        return $query->where('type', self::TYPE_GENERATED);
    }

    public function scopeSystem($query)
    {
        return $query->where('type', self::TYPE_SYSTEM);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public static function findOrCreateByName(string $name, string $type = 'manual'): self
    {
        $slug = \Illuminate\Support\Str::slug($name);

        return static::firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'type' => $type]
        );
    }
}
