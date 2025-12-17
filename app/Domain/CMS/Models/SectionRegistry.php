<?php

namespace App\Domain\CMS\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SectionRegistry extends Model
{
    protected $table = 'section_registry';

    protected $fillable = [
        'section_key',
        'title_key',
        'description_key',
        'icon',
        'category',
        'schema_json',
        'default_data',
        'role_scope',
        'is_active',
        'sort',
    ];

    protected $casts = [
        'schema_json' => 'array',
        'default_data' => 'array',
        'role_scope' => 'array',
        'is_active' => 'boolean',
        'sort' => 'integer',
    ];

    public const CATEGORY_CONTENT = 'content';
    public const CATEGORY_MEDIA = 'media';
    public const CATEGORY_LAYOUT = 'layout';
    public const CATEGORY_COMMERCE = 'commerce';
    public const CATEGORY_ADVANCED = 'advanced';

    public const CATEGORIES = [
        self::CATEGORY_CONTENT,
        self::CATEGORY_MEDIA,
        self::CATEGORY_LAYOUT,
        self::CATEGORY_COMMERCE,
        self::CATEGORY_ADVANCED,
    ];

    public function pageSections(): HasMany
    {
        return $this->hasMany(PageSection::class, 'section_key', 'section_key');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('category')->orderBy('sort')->orderBy('title_key');
    }

    public function getSchemaFields(): array
    {
        return $this->schema_json['fields'] ?? [];
    }

    public function getValidationRules(): array
    {
        return $this->schema_json['validation'] ?? [];
    }

    public function isAvailableForRole(string $role): bool
    {
        if (empty($this->role_scope)) {
            return true;
        }

        return in_array($role, $this->role_scope, true);
    }
}
