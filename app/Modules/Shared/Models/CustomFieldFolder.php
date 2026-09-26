<?php

namespace App\Modules\Shared\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomFieldFolder extends Model
{
    use SoftDeletes;

    protected $table = 'custom_field_folders';

    protected $fillable = [
        'workspace_id',
        'name',
        'key',
        'object_target',
        'sort_order',
        'is_system',
        'source_type',
        'source_id',
    ];

    protected $casts = [
        'is_system'  => 'boolean',
        'sort_order' => 'integer',
    ];

    /** Fields belonging to this folder */
    public function fields()
    {
        return $this->hasMany(CustomField::class, 'field_group', 'key')
            ->where('workspace_id', $this->workspace_id);
    }
}
