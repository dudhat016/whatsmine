<?php

namespace App\Modules\Funnels\Models;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FunnelFolder extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'funnel_folders';

    protected $fillable = [
        'workspace_id',
        'name',
        'color',
        'sort_order',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    public function funnels(): HasMany
    {
        return $this->hasMany(Funnel::class, 'folder_id');
    }
}
