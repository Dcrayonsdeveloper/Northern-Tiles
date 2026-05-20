<?php

namespace App\Domain\SEO\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotFoundLog extends Model
{
    protected $fillable = [
        'path',
        'referer',
        'user_agent',
        'ip_address',
        'hit_count',
        'first_hit_at',
        'last_hit_at',
        'is_resolved',
        'is_ignored',
        'redirect_id',
    ];

    protected $casts = [
        'hit_count' => 'integer',
        'first_hit_at' => 'datetime',
        'last_hit_at' => 'datetime',
        'is_resolved' => 'boolean',
        'is_ignored' => 'boolean',
    ];

    protected $appends = ['url', 'referrer', 'last_seen_at', 'redirect_created'];

    public function redirect(): BelongsTo
    {
        return $this->belongsTo(Redirect::class);
    }

    public function scopeUnresolved($query)
    {
        return $query->where('is_resolved', false);
    }

    public function scopeResolved($query)
    {
        return $query->where('is_resolved', true);
    }

    public static function log(string $path, ?string $referer = null, ?string $userAgent = null, ?string $ip = null): self
    {
        $existing = static::where('path', $path)->first();

        if ($existing) {
            $existing->increment('hit_count');
            $existing->update([
                'last_hit_at' => now(),
                'referer' => $referer ?? $existing->referer,
                'user_agent' => $userAgent ?? $existing->user_agent,
                'ip_address' => $ip ?? $existing->ip_address,
            ]);
            return $existing;
        }

        return static::create([
            'path' => $path,
            'referer' => $referer,
            'user_agent' => $userAgent,
            'ip_address' => $ip,
            'hit_count' => 1,
            'first_hit_at' => now(),
            'last_hit_at' => now(),
        ]);
    }

    public function resolve(?Redirect $redirect = null): void
    {
        $this->update([
            'is_resolved' => true,
            'redirect_id' => $redirect?->id,
        ]);
    }

    public function getUrlAttribute(): string
    {
        return $this->path ?? '';
    }

    public function getReferrerAttribute(): ?string
    {
        return $this->referer;
    }

    public function getLastSeenAtAttribute(): mixed
    {
        return $this->last_hit_at;
    }

    public function getRedirectCreatedAttribute(): bool
    {
        return $this->redirect_id !== null || $this->is_resolved;
    }

    public function createRedirect(string $toPath, int $statusCode = 301): Redirect
    {
        $redirect = Redirect::create([
            'from_path' => $this->path,
            'to_path' => $toPath,
            'status_code' => $statusCode,
            'is_active' => true,
        ]);

        $this->resolve($redirect);

        return $redirect;
    }
}
