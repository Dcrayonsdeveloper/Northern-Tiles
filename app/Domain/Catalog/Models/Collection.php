<?php

namespace App\Domain\Catalog\Models;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Collection extends Model
{
    public const TYPE_MANUAL = 'manual';
    public const TYPE_AUTOMATED = 'automated';

    public const SORT_MANUAL = 'manual';
    public const SORT_NEWEST = 'newest';
    public const SORT_OLDEST = 'oldest';
    public const SORT_PRICE_ASC = 'price_asc';
    public const SORT_PRICE_DESC = 'price_desc';
    public const SORT_BEST_SELLING = 'best_selling';
    public const SORT_DISCOUNT_DESC = 'discount_desc';
    public const SORT_TITLE_ASC = 'title_asc';
    public const SORT_TITLE_DESC = 'title_desc';

    protected $fillable = [
        'vendor_id',
        'title',
        'title_key',
        'handle',
        'description',
        'description_key',
        'image_path',
        'brochure_path',
        'type',
        'rules_json',
        'sort_mode',
        'is_active',
        'is_featured',
        'meta_title',
        'meta_description',
        'last_indexed_at',
    ];

    protected $casts = [
        'rules_json' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'last_indexed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Collection $collection) {
            if (empty($collection->handle)) {
                $collection->handle = Str::slug($collection->title);
            }
        });
    }

    // Relationships
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'collection_products')
            ->withPivot(['source', 'sort_order', 'computed_at'])
            ->withTimestamps();
    }

    public function manualProducts(): BelongsToMany
    {
        return $this->products()->wherePivot('source', 'manual');
    }

    public function autoProducts(): BelongsToMany
    {
        return $this->products()->wherePivot('source', 'auto');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeManual($query)
    {
        return $query->where('type', self::TYPE_MANUAL);
    }

    public function scopeAutomated($query)
    {
        return $query->where('type', self::TYPE_AUTOMATED);
    }

    public function scopeForVendor($query, ?int $vendorId)
    {
        if ($vendorId) {
            return $query->where('vendor_id', $vendorId);
        }
        return $query->whereNull('vendor_id');
    }

    // Helpers
    public function isManual(): bool
    {
        return $this->type === self::TYPE_MANUAL;
    }

    public function isAutomated(): bool
    {
        return $this->type === self::TYPE_AUTOMATED;
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path
            ? Storage::disk('public')->url($this->image_path)
            : null;
    }

    public function getBrochureUrlAttribute(): ?string
    {
        return $this->brochure_path
            ? Storage::disk('public')->url($this->brochure_path)
            : null;
    }

    public function getDisplayTitleAttribute(): string
    {
        if ($this->title_key) {
            return d($this->title_key) ?? $this->title;
        }
        return $this->title;
    }

    public function getDisplayDescriptionAttribute(): ?string
    {
        if ($this->description_key) {
            return d($this->description_key) ?? $this->description;
        }
        return $this->description;
    }

    public function getSortedProducts()
    {
        $query = $this->products()->active();

        return match ($this->sort_mode) {
            self::SORT_NEWEST => $query->orderByDesc('products.created_at'),
            self::SORT_OLDEST => $query->orderBy('products.created_at'),
            self::SORT_PRICE_ASC => $query->orderBy('products.price'),
            self::SORT_PRICE_DESC => $query->orderByDesc('products.price'),
            self::SORT_TITLE_ASC => $query->orderBy('products.name'),
            self::SORT_TITLE_DESC => $query->orderByDesc('products.name'),
            self::SORT_DISCOUNT_DESC => $query->orderByRaw('(products.compare_at_price - products.price) DESC'),
            self::SORT_BEST_SELLING => $query->orderByDesc('products.sales_count'),
            default => $query->orderBy('collection_products.sort_order'),
        };
    }

    public function needsReindex(): bool
    {
        if ($this->isManual()) {
            return false;
        }

        if (!$this->last_indexed_at) {
            return true;
        }

        // Reindex if not indexed in the last hour
        return $this->last_indexed_at->lt(now()->subHour());
    }

    public function getProductCount(): int
    {
        return $this->products()->count();
    }

    public static function getSortModes(): array
    {
        return [
            self::SORT_MANUAL => 'Manual',
            self::SORT_NEWEST => 'Newest First',
            self::SORT_OLDEST => 'Oldest First',
            self::SORT_PRICE_ASC => 'Price: Low to High',
            self::SORT_PRICE_DESC => 'Price: High to Low',
            self::SORT_TITLE_ASC => 'Title: A-Z',
            self::SORT_TITLE_DESC => 'Title: Z-A',
            self::SORT_DISCOUNT_DESC => 'Biggest Discount',
            self::SORT_BEST_SELLING => 'Best Selling',
        ];
    }
}
