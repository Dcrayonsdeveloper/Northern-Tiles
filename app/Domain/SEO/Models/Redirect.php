<?php

namespace App\Domain\SEO\Models;

use Illuminate\Database\Eloquent\Model;

class Redirect extends Model
{
    protected $fillable = [
        'from_path',
        'to_path',
        'status_code',
        'is_active',
        'is_regex',
        'hit_count',
        'last_hit_at',
    ];

    protected $casts = [
        'status_code' => 'integer',
        'is_active' => 'boolean',
        'is_regex' => 'boolean',
        'hit_count' => 'integer',
        'last_hit_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public static function findMatch(string $path): ?self
    {
        $path = '/' . ltrim($path, '/');

        $exact = static::active()
            ->where('is_regex', false)
            ->where('from_path', $path)
            ->first();

        if ($exact) {
            return $exact;
        }

        $regexRedirects = static::active()
            ->where('is_regex', true)
            ->get();

        foreach ($regexRedirects as $redirect) {
            if (preg_match('#' . $redirect->from_path . '#', $path)) {
                return $redirect;
            }
        }

        return null;
    }

    public function recordHit(): void
    {
        $this->increment('hit_count');
        $this->update(['last_hit_at' => now()]);
    }

    public function getDestination(string $originalPath = ''): string
    {
        if (!$this->is_regex) {
            return $this->to_path;
        }

        return preg_replace('#' . $this->from_path . '#', $this->to_path, $originalPath) ?? $this->to_path;
    }

    public static function getStatusCodes(): array
    {
        return [
            301 => '301 - Permanent Redirect',
            302 => '302 - Temporary Redirect',
            307 => '307 - Temporary Redirect (Strict)',
            308 => '308 - Permanent Redirect (Strict)',
        ];
    }
}
