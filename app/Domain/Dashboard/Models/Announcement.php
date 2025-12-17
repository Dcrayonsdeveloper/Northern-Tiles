<?php

namespace App\Domain\Dashboard\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $table = 'announcements';

    protected $fillable = [
        'title',
        'body_html',
        'audience',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected $casts = [
        'audience' => 'array',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];
}
