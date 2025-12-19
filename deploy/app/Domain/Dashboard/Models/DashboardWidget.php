<?php

namespace App\Domain\Dashboard\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardWidget extends Model
{
    protected $table = 'dashboard_widgets';

    protected $fillable = [
        'widget_key',
        'role_scope',
        'title_key',
        'description_key',
        'component_view',
        'permissions',
        'default_enabled',
        'default_sort',
        'supports_date_range',
        'cache_ttl_seconds',
    ];

    protected $casts = [
        'role_scope' => 'array',
        'default_enabled' => 'boolean',
        'default_sort' => 'integer',
        'supports_date_range' => 'boolean',
        'cache_ttl_seconds' => 'integer',
    ];
}
