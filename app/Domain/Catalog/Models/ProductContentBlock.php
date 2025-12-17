<?php

namespace App\Domain\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductContentBlock extends Model
{
    protected $fillable = [
        'product_id',
        'type',
        'content_json',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'content_json' => 'array',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public const TYPE_IMAGE_TEXT = 'image_text';
    public const TYPE_COMPARISON = 'comparison';
    public const TYPE_FAQ = 'faq';
    public const TYPE_SPEC_TABLE = 'spec_table';
    public const TYPE_VIDEO = 'video';
    public const TYPE_QUOTE = 'quote';
    public const TYPE_GALLERY = 'gallery';
    public const TYPE_FEATURES = 'features';

    public static function getTypes(): array
    {
        return [
            self::TYPE_IMAGE_TEXT => 'Image + Text',
            self::TYPE_COMPARISON => 'Comparison Table',
            self::TYPE_FAQ => 'FAQ',
            self::TYPE_SPEC_TABLE => 'Specifications Table',
            self::TYPE_VIDEO => 'Video',
            self::TYPE_QUOTE => 'Quote/Testimonial',
            self::TYPE_GALLERY => 'Image Gallery',
            self::TYPE_FEATURES => 'Features List',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function getContent(): array
    {
        return $this->content_json ?? [];
    }

    public function setContent(array $content): void
    {
        $this->update(['content_json' => $content]);
    }
}
