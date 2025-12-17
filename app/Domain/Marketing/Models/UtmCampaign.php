<?php

namespace App\Domain\Marketing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UtmCampaign extends Model
{
    protected $fillable = [
        'name',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'landing_url',
        'generated_url',
        'created_by',
        'click_count',
        'is_active',
    ];

    protected $casts = [
        'click_count' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $campaign) {
            $campaign->generated_url = $campaign->buildUrl();
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function buildUrl(): string
    {
        $params = array_filter([
            'utm_source' => $this->utm_source,
            'utm_medium' => $this->utm_medium,
            'utm_campaign' => $this->utm_campaign,
            'utm_term' => $this->utm_term,
            'utm_content' => $this->utm_content,
        ]);

        $separator = str_contains($this->landing_url, '?') ? '&' : '?';

        return $this->landing_url . $separator . http_build_query($params);
    }

    public function incrementClicks(): void
    {
        $this->increment('click_count');
    }

    public function getUrl(): string
    {
        return $this->generated_url ?? $this->buildUrl();
    }
}
