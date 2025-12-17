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
        'is_active',
    ];

    protected $casts = [
        'bio_json' => 'array',
        'social_json' => 'array',
        'is_active' => 'boolean',
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
}
