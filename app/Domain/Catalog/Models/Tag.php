<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Tag extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'type',
        'color',
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

    public static function findOrCreateByName(string $name, string $type = 'manual'): self
    {
        $slug = \Illuminate\Support\Str::slug($name);

        return static::firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'type' => $type]
        );
    }
}
