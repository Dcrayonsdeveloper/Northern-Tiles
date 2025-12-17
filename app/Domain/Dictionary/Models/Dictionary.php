<?php

namespace App\Domain\Dictionary\Models;

use Illuminate\Database\Eloquent\Model;

class Dictionary extends Model
{
    protected $table = 'dictionaries';

    protected $fillable = [
        'locale',
        'dkey',
        'value_text',
        'group',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
