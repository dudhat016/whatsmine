<?php

namespace App\Modules\Shared\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomField extends Model
{
    use SoftDeletes;

    protected $table = 'custom_fields';

    protected $fillable = [
        'workspace_id',
        'name',
        'key',
        'type',
        'object_target',
        'field_group',
        'folder_order',
        'options',
        'placeholder',
        'is_required',
        'is_active',
    ];

    protected $casts = [
        'options'      => 'array',
        'is_required'  => 'boolean',
        'is_active'    => 'boolean',
        'folder_order' => 'integer',
    ];
}
