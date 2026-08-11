<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;

class FunnelSavedSection extends Model
{
    protected $table = 'funnel_saved_sections';

    protected $fillable = [
        'workspace_id',
        'name',
        'thumbnail_url',
        'canvas_json',
        'is_global',
        'usage_count',
    ];

    protected function casts(): array
    {
        return [
            'canvas_json' => 'array',
            'is_global'   => 'boolean',
            'usage_count' => 'integer',
        ];
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForWorkspace($query, int $workspaceId)
    {
        return $query->where('workspace_id', $workspaceId);
    }

    public function scopeGlobal($query)
    {
        return $query->where('is_global', true);
    }
}
