<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\Tag;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TagService
{
    /**
     * Attach tags to a model using morphToMany relationship.
     */
    public function attachTags($model, array $tags, ?array $metadata = null): void
    {
        $tagIds = [];

        foreach ($tags as $tagName) {
            $tag = Tag::findOrCreateByName($tagName);
            $tagIds[$tag->id] = ['metadata_json' => $metadata];
        }

        $model->tags()->sync($tagIds);
    }

    /**
     * Detach tags from a model.
     */
    public function detachTags($model, array $tagIds): void
    {
        $model->tags()->detach($tagIds);
    }

    /**
     * Get or create tags by names.
     */
    public function getOrCreateTags(array $tagNames, ?User $user = null): Collection
    {
        $tags = collect();

        foreach ($tagNames as $name) {
            $name = trim($name);
            if (empty($name)) {
                continue;
            }

            $tag = Tag::firstOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'type' => Tag::TYPE_MANUAL,
                    'created_by' => $user?->id,
                ]
            );

            $tags->push($tag);
        }

        return $tags;
    }

    /**
     * Sync product tags with source and confidence (using product_tag pivot).
     */
    public function syncProductTags(Product $product, array $tagData, string $source = 'manual', ?float $confidence = null): void
    {
        $syncData = [];

        foreach ($tagData as $item) {
            if (is_array($item)) {
                $tagId = $item['id'] ?? null;
                $tagName = $item['name'] ?? null;
                $itemSource = $item['source'] ?? $source;
                $itemConfidence = $item['confidence'] ?? $confidence;
            } else {
                $tagId = is_numeric($item) ? $item : null;
                $tagName = is_string($item) && !is_numeric($item) ? $item : null;
                $itemSource = $source;
                $itemConfidence = $confidence;
            }

            if ($tagId) {
                $syncData[$tagId] = [
                    'source' => $itemSource,
                    'confidence' => $itemConfidence,
                ];
            } elseif ($tagName) {
                $tag = Tag::firstOrCreate(
                    ['slug' => Str::slug($tagName)],
                    [
                        'name' => $tagName,
                        'type' => Tag::TYPE_MANUAL,
                    ]
                );
                $syncData[$tag->id] = [
                    'source' => $itemSource,
                    'confidence' => $itemConfidence,
                ];
            }
        }

        $product->productTags()->sync($syncData);
    }

    /**
     * Add tags to product without removing existing (using product_tag pivot).
     */
    public function addProductTags(Product $product, array $tagNames, string $source = 'manual', ?float $confidence = null): void
    {
        $tags = $this->getOrCreateTags($tagNames);

        $attachData = [];
        foreach ($tags as $tag) {
            $attachData[$tag->id] = [
                'source' => $source,
                'confidence' => $confidence,
            ];
        }

        $product->productTags()->syncWithoutDetaching($attachData);
    }

    /**
     * Remove specific tags from product.
     */
    public function removeProductTags(Product $product, array $tagIds): void
    {
        $product->productTags()->detach($tagIds);
    }

    /**
     * Get product tags grouped by source.
     */
    public function getProductTagsBySource(Product $product): array
    {
        $tags = $product->productTags()->get();

        return [
            'manual' => $tags->where('pivot.source', 'manual')->values(),
            'generated' => $tags->where('pivot.source', 'generated')->values(),
            'system' => $tags->where('pivot.source', 'system')->values(),
        ];
    }

    /**
     * Search tags by name.
     */
    public function searchTags(string $query, int $limit = 20): Collection
    {
        return Tag::where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->limit($limit)
            ->get();
    }

    /**
     * Get tags used by a specific vendor.
     */
    public function getVendorTags(int $vendorId, int $limit = 100): Collection
    {
        return Tag::whereHas('products', function ($q) use ($vendorId) {
            $q->where('seller_id', $vendorId);
        })
            ->withCount(['products' => fn ($q) => $q->where('seller_id', $vendorId)])
            ->orderByDesc('products_count')
            ->limit($limit)
            ->get();
    }

    /**
     * Delete tags that are not attached to any products.
     */
    public function deleteUnusedTags(): int
    {
        return Tag::whereDoesntHave('products')->delete();
    }

    public function generateTags(Product $product): array
    {
        $generatedTags = [];

        if ($product->brand) {
            $generatedTags[] = $product->brand;
        }

        if ($product->category) {
            $generatedTags[] = $product->category->name;
        }

        $keywords = $this->extractKeywords($product->name . ' ' . $product->description);
        $generatedTags = array_merge($generatedTags, $keywords);

        if ($product->attributeSet) {
            foreach ($product->attributeSet->attributes as $attribute) {
                if ($attribute->is_filterable) {
                    $values = $attribute->getValues();
                    $generatedTags = array_merge($generatedTags, array_slice($values, 0, 3));
                }
            }
        }

        $generatedTags = array_unique(array_filter($generatedTags));
        $generatedTags = array_slice($generatedTags, 0, 15);

        foreach ($generatedTags as $tagName) {
            Tag::firstOrCreate(
                ['slug' => Str::slug($tagName)],
                ['name' => $tagName, 'type' => 'auto']
            );
        }

        return $generatedTags;
    }

    protected function extractKeywords(string $text): array
    {
        $stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'with', 'for', 'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'of', 'in', 'on', 'by', 'about', 'against', 'between', 'under', 'again', 'further', 'then', 'once'];

        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9\s]/', '', $text);
        $words = explode(' ', $text);

        $keywords = [];
        foreach ($words as $word) {
            $word = trim($word);
            if (strlen($word) > 3 && !in_array($word, $stopWords)) {
                $keywords[] = ucfirst($word);
            }
        }

        $wordCounts = array_count_values($keywords);
        arsort($wordCounts);

        return array_slice(array_keys($wordCounts), 0, 5);
    }

    public function getTags(?string $type = null): Collection
    {
        $query = Tag::query();

        if ($type) {
            $query->where('type', $type);
        }

        return $query->orderBy('name')->get();
    }

    public function getPopularTags(int $limit = 20): Collection
    {
        return Tag::withCount('products')
            ->orderBy('products_count', 'desc')
            ->limit($limit)
            ->get();
    }

    public function mergeTags(Tag $sourceTag, Tag $targetTag): void
    {
        $sourceTag->products()->each(function ($product) use ($targetTag) {
            if (!$product->tags->contains($targetTag->id)) {
                $product->tags()->attach($targetTag->id);
            }
        });

        $sourceTag->posts()->each(function ($post) use ($targetTag) {
            if (!$post->tags->contains($targetTag->id)) {
                $post->tags()->attach($targetTag->id);
            }
        });

        $sourceTag->delete();
    }
}
