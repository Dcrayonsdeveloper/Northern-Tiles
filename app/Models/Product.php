<?php

namespace App\Models;

use App\Domain\Catalog\Models\AttributeSet;
use App\Domain\Catalog\Models\Favorite;
use App\Domain\Catalog\Models\ProductContentBlock;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Catalog\Models\Tag;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Support\Facades\Cache;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'seller_id',
        'attribute_set_id',
        'name',
        'slug',
        'sku',
        'short_description',
        'description',
        'brand',
        'meta_title',
        'meta_description',
        'canonical_url',
        'price',
        'compare_at_price',
        'cost',
        'inventory_quantity',
        'inventory_policy',
        'weight',
        'image_url',
        'stock',
        'is_active',
        'noindex',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'cost' => 'decimal:2',
        'weight' => 'decimal:2',
        'inventory_quantity' => 'integer',
        'is_active' => 'boolean',
        'noindex' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(fn (self $product) => Cache::forget("product.{$product->slug}"));
        static::deleted(fn (self $product) => Cache::forget("product.{$product->slug}"));
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function attributeSet(): BelongsTo
    {
        return $this->belongsTo(AttributeSet::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order');
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

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
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

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function isInStock(): bool
    {
        if ($this->variants()->exists()) {
            return $this->variants()->active()->inStock()->exists();
        }
        return $this->inventory_quantity > 0 || $this->inventory_policy === 'continue';
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

    public function getActiveContentBlocks()
    {
        return $this->contentBlocks()->active()->ordered()->get();
    }
}
