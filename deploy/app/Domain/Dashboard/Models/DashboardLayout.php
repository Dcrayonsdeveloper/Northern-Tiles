<?php

namespace App\Domain\Dashboard\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardLayout extends Model
{
    protected $table = 'dashboard_layouts';

    protected $fillable = [
        'scope_type',
        'scope_id',
        'layout_json',
    ];

    protected $casts = [
        'layout_json' => 'array',
    ];
}
