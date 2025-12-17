<?php

namespace App\Domain\CMS\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
{
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_ARCHIVED = 'archived';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_PUBLISHED,
        self::STATUS_SCHEDULED,
        self::STATUS_ARCHIVED,
    ];

    protected $fillable = [
        'parent_id',
        'title',
        'slug',
        'full_slug',
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
        'robots_follow',
        'canonical_url',
        'og_image',
        'featured_image',
        'sort',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'body_json' => 'array',
        'reviewed_at' => 'datetime',
        'published_at' => 'datetime',
        'noindex' => 'boolean',
        'robots_follow' => 'boolean',
        'sort' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Page $page) {
            $page->full_slug = $page->buildFullSlug();
            if (auth()->check()) {
                $page->created_by = $page->created_by ?? auth()->id();
            }
        });

        static::updating(function (Page $page) {
            if ($page->isDirty('slug') || $page->isDirty('parent_id')) {
                $page->full_slug = $page->buildFullSlug();
            }
            if (auth()->check()) {
                $page->updated_by = auth()->id();
            }
        });
    }

    // Relationships

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_id')->orderBy('sort');
    }

    public function descendants(): HasMany
    {
        return $this->children()->with('descendants');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(PageSection::class)->orderBy('sort');
    }

    public function activeSections(): HasMany
    {
        return $this->sections()->where('is_active', true);
    }

    public function seoMeta(): MorphMany
    {
        return $this->morphMany(\App\Domain\SEO\Models\SeoMeta::class, 'model');
    }

    // Scopes

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED)
            ->where(function ($q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
            ->where('published_at', '>', now());
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeArchived($query)
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeByFullSlug($query, string $fullSlug)
    {
        return $query->where('full_slug', $fullSlug);
    }

    // Helpers

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED
            && ($this->published_at === null || $this->published_at <= now());
    }

    public function isScheduled(): bool
    {
        return $this->status === self::STATUS_SCHEDULED
            && $this->published_at !== null
            && $this->published_at > now();
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    public function publish(): void
    {
        $this->update([
            'status' => self::STATUS_PUBLISHED,
            'published_at' => $this->published_at ?? now(),
        ]);
    }

    public function unpublish(): void
    {
        $this->update(['status' => self::STATUS_DRAFT]);
    }

    public function archive(): void
    {
        $this->update(['status' => self::STATUS_ARCHIVED]);
    }

    public function schedule(\DateTimeInterface $date): void
    {
        $this->update([
            'status' => self::STATUS_SCHEDULED,
            'published_at' => $date,
        ]);
    }

    public function buildFullSlug(): string
    {
        if ($this->parent_id && $this->parent) {
            return trim($this->parent->full_slug, '/') . '/' . $this->slug;
        }

        return $this->slug;
    }

    public function getAncestors(): array
    {
        $ancestors = [];
        $page = $this->parent;

        while ($page) {
            array_unshift($ancestors, $page);
            $page = $page->parent;
        }

        return $ancestors;
    }

    public function getDepth(): int
    {
        return count($this->getAncestors());
    }

    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }

    public function getUrl(): string
    {
        return url('/pages/' . $this->full_slug);
    }

    public function getPreviewUrl(): string
    {
        return url()->signedRoute('pages.preview', ['page' => $this->id], now()->addHours(24));
    }

    public function getMetaTitleAttribute($value): string
    {
        return $value ?? $this->title;
    }

    public function shouldIndex(): bool
    {
        return $this->isPublished() && !$this->noindex;
    }

    public function shouldFollow(): bool
    {
        return $this->robots_follow;
    }
}
