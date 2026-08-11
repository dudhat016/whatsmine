<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;

class FunnelPage extends Model
{
    protected $table = 'funnel_pages';

    protected $fillable = [
        'funnel_step_id',
        'variant',
        'is_control',
        'traffic_split',
        'canvas_json',
        'html_cache',
        'css_cache',
        'cache_compiled_at',
        'meta_title',
        'meta_description',
        'og_image_url',
        'no_index',
        'schema_json',
        'views_count',
        'conversions_count',
        'revenue',
    ];

    protected function casts(): array
    {
        return [
            'canvas_json'        => 'array',
            'schema_json'        => 'array',
            'is_control'         => 'boolean',
            'no_index'           => 'boolean',
            'traffic_split'      => 'integer',
            'views_count'        => 'integer',
            'conversions_count'  => 'integer',
            'revenue'            => 'decimal:2',
            'cache_compiled_at'  => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function step()
    {
        return $this->belongsTo(FunnelStep::class, 'funnel_step_id');
    }

    public function popups()
    {
        return $this->hasMany(FunnelPopup::class, 'funnel_page_id');
    }

    public function revisions()
    {
        return $this->hasMany(FunnelPageRevision::class, 'funnel_page_id')->latest();
    }

    public function latestRevision()
    {
        return $this->hasOne(FunnelPageRevision::class, 'funnel_page_id')->latestOfMany();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isCacheStale(): bool
    {
        return is_null($this->cache_compiled_at) || is_null($this->html_cache);
    }

    public function getConversionRateAttribute(): float
    {
        if ($this->views_count === 0) {
            return 0.0;
        }

        return round(($this->conversions_count / $this->views_count) * 100, 2);
    }

    public function getRevenuePerVisitorAttribute(): float
    {
        if ($this->views_count === 0) {
            return 0.0;
        }

        return round($this->revenue / $this->views_count, 2);
    }
}
