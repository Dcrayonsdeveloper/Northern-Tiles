<?php

namespace App\Domain\CMS\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Post extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'meta_title',
        'meta_description',
        'body_json',
        'featured_image',
        'category_id',
        'author_id',
        'reviewed_by',
        'reviewed_at',
        'sources_json',
        'status',
        'published_at',
        'noindex',
        'canonical_url',
        'is_featured',
        'view_count',
    ];

    protected $casts = [
        'body_json' => 'array',
        'sources_json' => 'array',
        'reviewed_at' => 'datetime',
        'published_at' => 'datetime',
        'noindex' => 'boolean',
        'is_featured' => 'boolean',
        'view_count' => 'integer',
    ];

    protected $appends = ['featured_image_url', 'content'];

    public function getFeaturedImageUrlAttribute(): ?string
    {
        return $this->featured_image
            ? \Illuminate\Support\Facades\Storage::url($this->featured_image)
            : null;
    }

    /**
     * Get the HTML content from body_json for display.
     */
    public function getContentAttribute(): ?string
    {
        $bodyJson = $this->body_json;
        
        if (!$bodyJson) {
            return null;
        }
        
        // If it's a string, return as-is
        if (is_string($bodyJson)) {
            return $bodyJson;
        }
        
        // If it's an array with 'content' key (old format)
        if (is_array($bodyJson) && isset($bodyJson[0]['content'])) {
            return $bodyJson[0]['content'];
        }
        
        // If it has 'description' key
        if (is_array($bodyJson) && isset($bodyJson['description'])) {
            return $bodyJson['description'];
        }
        
        // If it has 'blocks' key, concatenate block contents
        if (is_array($bodyJson) && isset($bodyJson['blocks'])) {
            return collect($bodyJson['blocks'])
                ->pluck('content')
                ->filter()
                ->implode("\n");
        }
        
        return null;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PostCategory::class, 'category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(\App\Domain\Catalog\Models\Tag::class, 'taggable')
            ->withPivot('metadata_json')
            ->withTimestamps();
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

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
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

    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }

    public function getMetaTitleAttribute($value): string
    {
        return $value ?? $this->title;
    }

    public function getSources(): array
    {
        return $this->sources_json ?? [];
    }
}
