<?php

namespace App\Domain\CMS\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Page extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'meta_title',
        'meta_description',
        'body_json',
        'template',
        'status',
        'author_id',
        'reviewed_by',
        'reviewed_at',
        'published_at',
        'noindex',
        'canonical_url',
        'featured_image',
    ];

    protected $casts = [
        'body_json' => 'array',
        'reviewed_at' => 'datetime',
        'published_at' => 'datetime',
        'noindex' => 'boolean',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function seoMeta(): MorphMany
    {
        return $this->morphMany(\App\Domain\SEO\Models\SeoMeta::class, 'model');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function isPublished(): bool
    {
        return $this->status === 'published'
            && ($this->published_at === null || $this->published_at <= now());
    }

    public function publish(): void
    {
        $this->update([
            'status' => 'published',
            'published_at' => $this->published_at ?? now(),
        ]);
    }

    public function unpublish(): void
    {
        $this->update(['status' => 'draft']);
    }

    public function getMetaTitleAttribute($value): string
    {
        return $value ?? $this->title;
    }
}
