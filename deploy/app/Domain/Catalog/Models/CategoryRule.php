<?php

namespace App\Domain\Catalog\Models;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryRule extends Model
{
    protected $fillable = [
        'category_id',
        'vendor_id',
        'rules_json',
        'match_type',
        'is_active',
        'priority',
        'last_run_at',
        'matched_count',
    ];

    protected $casts = [
        'rules_json' => 'array',
        'is_active' => 'boolean',
        'priority' => 'integer',
        'matched_count' => 'integer',
        'last_run_at' => 'datetime',
    ];

    // Relationships
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForVendor($query, ?int $vendorId)
    {
        if ($vendorId) {
            return $query->where('vendor_id', $vendorId);
        }
        return $query->whereNull('vendor_id');
    }

    public function scopeOrdered($query)
    {
        return $query->orderByDesc('priority')->orderBy('id');
    }

    // Helpers
    public function matchesAll(): bool
    {
        return $this->match_type === 'all';
    }

    public function matchesAny(): bool
    {
        return $this->match_type === 'any';
    }

    public function getRules(): array
    {
        return $this->rules_json ?? [];
    }

    public function markAsRun(int $matchedCount): void
    {
        $this->update([
            'last_run_at' => now(),
            'matched_count' => $matchedCount,
        ]);
    }
}
