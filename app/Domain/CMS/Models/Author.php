<?php

namespace App\Domain\CMS\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Author extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'bio_json',
        'avatar_file',
        'social_json',
        'job_title',
        'credentials',
        'expertise_json',
        'is_verified',
        'is_active',
    ];

    /**
     * Serialised with the model so the admin editor can populate its fields.
     */
    protected $appends = ['avatar_url', 'bio', 'social_links', 'expertise_areas'];

    protected $casts = [
        'bio_json' => 'array',
        'social_json' => 'array',
        'is_active' => 'boolean',
        'is_verified' => 'boolean',
        'expertise_json' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar_file
            ? Storage::disk('public')->url($this->avatar_file)
            : null;
    }

    public function getBioAttribute(): ?string
    {
        return $this->bio_json['content'] ?? null;
    }

    public function getSocialLinks(): array
    {
        return $this->social_json ?? [];
    }

    /**
     * The edit form reads bio, social_links, expertise_areas and avatar_url.
     * They are accessors over the json columns, and without $appends none of
     * them reach the page — which is why the form opened blank however much
     * had been saved.
     */
    public function getSocialLinksAttribute(): array
    {
        return $this->social_json ?? ['twitter' => '', 'linkedin' => '', 'website' => ''];
    }

    public function getExpertiseAreasAttribute(): array
    {
        return $this->expertise_json ?? [];
    }
}
