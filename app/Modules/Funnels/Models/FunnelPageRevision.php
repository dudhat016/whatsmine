<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;

class FunnelPageRevision extends Model
{
    protected $table = 'funnel_page_revisions';

    protected $fillable = [
        'funnel_page_id',
        'published_by',
        'canvas_json',
        'html_snapshot',
        'label',
    ];

    protected function casts(): array
    {
        return [
            'canvas_json' => 'array',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function page()
    {
        return $this->belongsTo(FunnelPage::class, 'funnel_page_id');
    }

    public function publishedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'published_by');
    }
}
