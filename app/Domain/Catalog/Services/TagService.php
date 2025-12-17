<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Models\Tag;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class TagService
{
    public function attachTags($model, array $tags, ?array $metadata = null): void
    {
        $tagIds = [];

        foreach ($tags as $tagName) {
            $tag = Tag::findOrCreateByName($tagName);
            $tagIds[$tag->id] = ['metadata_json' => $metadata];
        }

        $model->tags()->sync($tagIds);
    }

    public function detachTags($model, array $tagIds): void
    {
        $model->tags()->detach($tagIds);
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
