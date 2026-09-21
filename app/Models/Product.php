<?php

namespace App\Models;

use App\Domain\Catalog\Jobs\ReindexCollectionsForProductJob;
use App\Domain\Catalog\Models\AttributeSet;
use App\Domain\Catalog\Models\AttributeValue;
use App\Domain\Catalog\Models\Collection;
use App\Domain\Catalog\Models\Favorite;
use App\Domain\Catalog\Models\ProductContentBlock;
use App\Domain\Catalog\Models\ProductDigitalFile;
use App\Domain\Catalog\Models\ProductMedia;
use App\Domain\Catalog\Models\ProductOption;
use App\Domain\Catalog\Models\ProductReview;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Catalog\Models\Tag;
use App\Domain\Catalog\Models\VariantFamily;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Cache;

class Product extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'category_id',
        'variant_family_id',
        'variant_family_position',
        'seller_id',
        'attribute_set_id',
        'created_by',
        'updated_by',
        'name',
        'name_key',
        'slug',
        'sku',
        'short_description',
        'short_description_key',
        'description',
        'description_json',
        'brand',
        'product_type',
        'is_digital',
        'default_currency',
        'meta_title',
        'meta_description',
        'canonical_url',
        'seo_title_key',
        'seo_description_key',
        'og_image_path',
        'price',
        'compare_at_price',
        'cost',
        'inventory_quantity',
        'inventory_policy',
        'weight',
        'length_mm',
        'width_mm',
        'height_mm',
        'sqm_per_box',
        'requires_shipping',
        'image_url',
        'lifestyle_image_url',
        'specifications',
        'stock',
        'is_active',
        'is_featured',
        'status',
        'published_at',
        'noindex',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'cost' => 'decimal:2',
        'weight' => 'decimal:2',
        'inventory_quantity' => 'integer',
        'length_mm' => 'integer',
        'width_mm' => 'integer',
        'height_mm' => 'integer',
        'sqm_per_box' => 'decimal:4',
        'is_active' => 'boolean',
        'is_digital' => 'boolean',
        'requires_shipping' => 'boolean',
        'noindex' => 'boolean',
        'is_featured' => 'boolean',
        'specifications' => 'array',
        'description_json' => 'array',
        'published_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        // One control, two columns. The editor offers Active or Draft, but the
        // storefront gates on is_active in most places and on status in a few
        // (the range selector, for one). Kept in lockstep here rather than in
        // the form, so a bulk action, an import or an older screen cannot
        // leave a product half-hidden — as one already had: a draft that was
        // still is_active and therefore still listed and sellable.
        static::saving(function (self $product) {
            if ($product->isDirty('status')) {
                $product->is_active = $product->status === self::STATUS_PUBLISHED;
            } elseif ($product->isDirty('is_active')) {
                $product->status = $product->is_active
                    ? self::STATUS_PUBLISHED
                    : self::STATUS_DRAFT;
            }
        });

        static::saved(function (self $product) {
            Cache::forget("product.{$product->slug}");
            // Reindex automated collections when product attributes change
            ReindexCollectionsForProductJob::dispatch($product->id)->onQueue('collections');
        });

        static::deleted(function (self $product) {
            Cache::forget("product.{$product->slug}");
            // Remove from all collections when deleted
            $product->collections()->detach();
        });
    }

    // Relationships
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'product_category');
    }

    public function variantFamily(): BelongsTo
    {
        return $this->belongsTo(VariantFamily::class);
    }

    /**
     * This product's entry in the trade (builder) catalogue, if the admin has
     * listed it. Null for the vast majority of products.
     */
    public function builderListing(): HasOne
    {
        return $this->hasOne(\App\Domain\Builder\Models\BuilderProduct::class);
    }

    /** Per-account trade listings; a product may be offered to several accounts. */
    public function builderAccountListings(): HasMany
    {
        return $this->hasMany(\App\Domain\Builder\Models\BuilderAccountProduct::class);
    }

    /**
     * Products this trade account may see.
     *
     * An account with its own catalogue sees only that; everyone else sees the
     * shared one. Kept as a scope so the portal's listing, its related-products
     * query and the single-product page cannot drift apart — one of them
     * forgetting the account gate would leak another builder's product list.
     */
    public function scopeBuilderVisibleTo($query, ?\App\Models\User $user)
    {
        $hasOwn = $user && \App\Domain\Builder\Models\BuilderAccountProduct::live()
            ->forAccount($user)
            ->exists();

        if ($hasOwn) {
            return $query->whereHas(
                'builderAccountListings',
                fn ($q) => $q->where('user_id', $user->id)->where('is_active', true),
            );
        }

        return $query->whereHas('builderListing', fn ($q) => $q->where('is_active', true));
    }

    /**
     * Products in a category, including everything under its children.
     *
     * Matching the slug alone made a root category an empty page: since the
     * category rebuild every product hangs off a sub-category, so /shop?category=tiles
     * returned nothing while Tiles' five children held hundreds. Roots are no
     * longer linked in the nav, but a bookmark, a search result or a typed URL
     * still lands here and must show the range rather than "0 products".
     */
    public function scopeInCategoryTree($query, ?string $slug)
    {
        if (! $slug) {
            return $query;
        }

        $slugs = [$slug];

        $category = \App\Models\Category::where('slug', $slug)->first(['id']);
        if ($category) {
            $slugs = array_merge(
                $slugs,
                \App\Models\Category::where('parent_id', $category->id)->pluck('slug')->all(),
            );
        }

        return $query->where(function ($q) use ($slugs) {
            $q->whereHas('category', fn ($inner) => $inner->whereIn('slug', $slugs))
                ->orWhereHas('categories', fn ($inner) => $inner->whereIn('slug', $slugs));
        });
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function attributeSet(): BelongsTo
    {
        return $this->belongsTo(AttributeSet::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order');
    }

    public function attributeValues(): BelongsToMany
    {
        return $this->belongsToMany(AttributeValue::class, 'product_attribute_value');
    }

    public function defaultVariant(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->where('is_default', true);
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProductMedia::class)->orderBy('sort');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductMedia::class)->where('type', 'image')->orderBy('sort');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(ProductMedia::class)->where('type', 'video')->orderBy('sort');
    }

    public function primaryImage(): HasMany
    {
        return $this->hasMany(ProductMedia::class)->where('is_primary', true)->where('type', 'image');
    }

    public function options(): HasMany
    {
        return $this->hasMany(ProductOption::class)->orderBy('position');
    }

    public function digitalFiles(): HasMany
    {
        return $this->hasMany(ProductDigitalFile::class);
    }

    public function contentBlocks(): HasMany
    {
        return $this->hasMany(ProductContentBlock::class)->orderBy('sort_order');
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable')
            ->withPivot('metadata_json')
            ->withTimestamps();
    }

    public function productTags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'product_tag')
            ->withPivot(['source', 'confidence', 'created_at']);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function approvedReviews(): HasMany
    {
        return $this->hasMany(ProductReview::class)->where('status', 'approved');
    }

    public function updateRatingCache(): void
    {
        $stats = $this->approvedReviews()
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as review_count')
            ->first();

        $this->update([
            'average_rating' => round($stats->avg_rating ?? 0, 1),
            'review_count' => $stats->review_count ?? 0,
        ]);
    }

    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class, 'collection_products')
            ->withPivot(['sort_order', 'source', 'computed_at'])
            ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED)
            ->where(function ($q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
            ->where('published_at', '>', now());
    }

    public function scopeForSeller($query, int $sellerId)
    {
        return $query->where('seller_id', $sellerId);
    }

    public function scopeInStock($query)
    {
        return $query->where(function ($q) {
            $q->where('inventory_quantity', '>', 0)
                ->orWhere('inventory_policy', 'continue');
        });
    }

    public function scopeDigital($query)
    {
        return $query->where('is_digital', true);
    }

    public function scopePhysical($query)
    {
        return $query->where('is_digital', false);
    }

    // Route key - use slug for storefront, but allow ID resolution for admin
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Resolve the model for route binding - supports both ID and slug.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        // If field is explicitly set, use it
        if ($field) {
            return $this->where($field, $value)->first();
        }

        // Try ID first (for admin routes), then slug (for storefront)
        if (is_numeric($value)) {
            $product = $this->where('id', $value)->first();
            if ($product) {
                return $product;
            }
        }

        // Fall back to slug
        return $this->where('slug', $value)->first();
    }

    // Helpers
    public function isInStock(): bool
    {
        if ((float) $this->price <= 0) {
            return false;
        }
        if ($this->variants()->exists()) {
            return $this->variants()->active()->inStock()->exists();
        }
        return $this->inventory_quantity > 0 || $this->inventory_policy === 'continue';
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED
            && ($this->published_at === null || $this->published_at->isPast());
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isScheduled(): bool
    {
        return $this->status === self::STATUS_SCHEDULED
            && $this->published_at?->isFuture();
    }

    public function getMetaTitleAttribute($value): string
    {
        return $value ?? $this->name;
    }

    public function getSalePercentage(): ?int
    {
        if (!$this->compare_at_price || $this->compare_at_price <= $this->price) {
            return null;
        }
        return (int) round((($this->compare_at_price - $this->price) / $this->compare_at_price) * 100);
    }

    public function getPrimaryImageUrl(): ?string
    {
        $primary = $this->media()->where('is_primary', true)->where('type', 'image')->first();
        if ($primary) {
            return $primary->url;
        }
        $first = $this->media()->where('type', 'image')->first();
        return $first?->url ?? $this->image_url;
    }

    public function isFavoritedBy(?User $user): bool
    {
        if (!$user) {
            return false;
        }
        return Favorite::isFavorite($user->id, $this->id);
    }

    public function syncTags(array $tagNames): void
    {
        $tagIds = collect($tagNames)->map(function ($name) {
            return Tag::findOrCreateByName($name)->id;
        });

        $this->tags()->sync($tagIds);
    }

    public function syncProductTags(array $tags, string $source = 'user'): void
    {
        $syncData = [];
        foreach ($tags as $tag) {
            $tagModel = is_array($tag)
                ? Tag::findOrCreateByName($tag['name'])
                : Tag::findOrCreateByName($tag);

            $syncData[$tagModel->id] = [
                'source' => $source,
                'confidence' => is_array($tag) ? ($tag['confidence'] ?? null) : null,
            ];
        }

        $this->productTags()->sync($syncData);
    }

    public function getActiveContentBlocks()
    {
        return $this->contentBlocks()->active()->ordered()->get();
    }

    public function hasVariants(): bool
    {
        return $this->variants()->count() > 1;
    }

    public function getDefaultVariant(): ?ProductVariant
    {
        return $this->variants()->where('is_default', true)->first()
            ?? $this->variants()->first();
    }
}
