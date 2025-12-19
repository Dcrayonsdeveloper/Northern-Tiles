<?php

namespace App\Domain\Marketing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ContentChecklist extends Model
{
    protected $fillable = [
        'content_type',
        'content_id',
        'checklist_json',
        'score',
        'max_score',
        'last_checked_at',
    ];

    protected $casts = [
        'checklist_json' => 'array',
        'score' => 'integer',
        'max_score' => 'integer',
        'last_checked_at' => 'datetime',
    ];

    public function content(): MorphTo
    {
        return $this->morphTo('content', 'content_type', 'content_id');
    }

    public function getChecklist(): array
    {
        return $this->checklist_json ?? [];
    }

    public function updateChecklist(array $items): void
    {
        $score = 0;
        $maxScore = 0;

        foreach ($items as $item) {
            $maxScore += ($item['weight'] ?? 1);
            if ($item['completed'] ?? false) {
                $score += ($item['weight'] ?? 1);
            }
        }

        $this->update([
            'checklist_json' => $items,
            'score' => $score,
            'max_score' => $maxScore,
            'last_checked_at' => now(),
        ]);
    }

    public function getScorePercentage(): int
    {
        if ($this->max_score === 0) {
            return 0;
        }
        return (int) round(($this->score / $this->max_score) * 100);
    }

    public static function getDefaultItems(string $contentType): array
    {
        $items = [
            'product' => [
                ['key' => 'has_title', 'label' => 'Has descriptive title', 'weight' => 1, 'completed' => false],
                ['key' => 'has_description', 'label' => 'Has product description', 'weight' => 2, 'completed' => false],
                ['key' => 'has_meta_title', 'label' => 'Has meta title', 'weight' => 1, 'completed' => false],
                ['key' => 'has_meta_description', 'label' => 'Has meta description', 'weight' => 1, 'completed' => false],
                ['key' => 'has_images', 'label' => 'Has product images', 'weight' => 2, 'completed' => false],
                ['key' => 'has_price', 'label' => 'Has price set', 'weight' => 1, 'completed' => false],
                ['key' => 'has_category', 'label' => 'Assigned to category', 'weight' => 1, 'completed' => false],
                ['key' => 'has_tags', 'label' => 'Has tags', 'weight' => 1, 'completed' => false],
                ['key' => 'has_content_blocks', 'label' => 'Has A+ content blocks', 'weight' => 2, 'completed' => false],
            ],
            'post' => [
                ['key' => 'has_title', 'label' => 'Has title', 'weight' => 1, 'completed' => false],
                ['key' => 'has_excerpt', 'label' => 'Has excerpt', 'weight' => 1, 'completed' => false],
                ['key' => 'has_content', 'label' => 'Has content', 'weight' => 2, 'completed' => false],
                ['key' => 'has_meta_title', 'label' => 'Has meta title', 'weight' => 1, 'completed' => false],
                ['key' => 'has_meta_description', 'label' => 'Has meta description', 'weight' => 1, 'completed' => false],
                ['key' => 'has_featured_image', 'label' => 'Has featured image', 'weight' => 1, 'completed' => false],
                ['key' => 'has_author', 'label' => 'Has author assigned', 'weight' => 1, 'completed' => false],
                ['key' => 'has_category', 'label' => 'Has category', 'weight' => 1, 'completed' => false],
                ['key' => 'has_sources', 'label' => 'Has sources/citations', 'weight' => 1, 'completed' => false],
            ],
            'page' => [
                ['key' => 'has_title', 'label' => 'Has title', 'weight' => 1, 'completed' => false],
                ['key' => 'has_content', 'label' => 'Has content', 'weight' => 2, 'completed' => false],
                ['key' => 'has_meta_title', 'label' => 'Has meta title', 'weight' => 1, 'completed' => false],
                ['key' => 'has_meta_description', 'label' => 'Has meta description', 'weight' => 1, 'completed' => false],
            ],
        ];

        return $items[$contentType] ?? [];
    }
}
