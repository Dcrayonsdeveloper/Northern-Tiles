<?php

namespace App\Domain\Marketing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AbandonedCartFlow extends Model
{
    protected $fillable = [
        'vendor_id',
        'name',
        'is_active',
        'delays_json',
        'template_keys_json',
        'min_cart_value',
        'abandon_threshold_minutes',
        'require_email',
        'respect_opt_in',
        'max_emails_per_cart',
    ];

    protected $casts = [
        'delays_json' => 'array',
        'template_keys_json' => 'array',
        'is_active' => 'boolean',
        'require_email' => 'boolean',
        'respect_opt_in' => 'boolean',
        'min_cart_value' => 'decimal:2',
        'abandon_threshold_minutes' => 'integer',
        'max_emails_per_cart' => 'integer',
    ];

    // Default flow configuration
    public const DEFAULT_DELAYS = [60, 1440, 4320]; // 1h, 24h, 72h in minutes
    public const DEFAULT_TEMPLATES = ['abandon_1', 'abandon_2', 'abandon_3'];

    // Relationships
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AbandonedCartMessage::class, 'flow_id');
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

    // Helpers
    public function getDelays(): array
    {
        return $this->delays_json ?? self::DEFAULT_DELAYS;
    }

    public function getTemplateKeys(): array
    {
        return $this->template_keys_json ?? self::DEFAULT_TEMPLATES;
    }

    public function getStepCount(): int
    {
        return count($this->getDelays());
    }

    public function getDelayForStep(int $step): ?int
    {
        $delays = $this->getDelays();
        return $delays[$step - 1] ?? null;
    }

    public function getTemplateKeyForStep(int $step): ?string
    {
        $keys = $this->getTemplateKeys();
        return $keys[$step - 1] ?? null;
    }

    public function getScheduledTimeForStep(int $step, \DateTimeInterface $abandonedAt): ?\DateTimeInterface
    {
        $delay = $this->getDelayForStep($step);
        if ($delay === null) {
            return null;
        }

        return \Carbon\Carbon::parse($abandonedAt)->addMinutes($delay);
    }

    public function meetsMinimumValue(float $cartValue): bool
    {
        if ($this->min_cart_value === null) {
            return true;
        }
        return $cartValue >= $this->min_cart_value;
    }

    public function getAbandonThreshold(): int
    {
        return $this->abandon_threshold_minutes ?? 60;
    }

    public static function getDefaultFlow(): array
    {
        return [
            'name' => 'Default Abandoned Cart Flow',
            'is_active' => false,
            'delays_json' => self::DEFAULT_DELAYS,
            'template_keys_json' => self::DEFAULT_TEMPLATES,
            'abandon_threshold_minutes' => 60,
            'require_email' => true,
            'respect_opt_in' => true,
            'max_emails_per_cart' => 3,
        ];
    }
}
