<?php

namespace App\Modules\Shared\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomValue extends Model
{
    use HasFactory;

    protected $table = 'custom_values';

    protected $fillable = [
        'workspace_id',
        'name',
        'key',
        'value',
    ];

    /**
     * Get the standardized merge tag for this custom value.
     */
    public function getMergeTagAttribute(): string
    {
        return '{{ custom_values.' . $this->key . ' }}';
    }
}
