<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;

class FunnelPopup extends Model
{
    protected $table = 'funnel_popups';

    protected $fillable = [
        'funnel_page_id',
        'name',
        'trigger_type',
        'trigger_value',
        'trigger_selector',
        'canvas_json',
        'frequency',
        'has_countdown',
        'countdown_seconds',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'canvas_json'        => 'array',
            'has_countdown'      => 'boolean',
            'is_active'          => 'boolean',
            'trigger_value'      => 'integer',
            'countdown_seconds'  => 'integer',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function page()
    {
        return $this->belongsTo(FunnelPage::class, 'funnel_page_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
