<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Funnel extends Model
{
    use SoftDeletes;

    protected $table = 'funnels';

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (self $model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->share_token)) {
                $model->share_token = Str::random(32);
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected $fillable = [
        'workspace_id',
        'name',
        'slug',
        'theme_color',
        'meta_title',
        'meta_description',
        'og_image_url',
        'no_index',
        'share_token',
        'is_shareable',
        'is_system_template',
        'status',
        'is_ready',
        'validation_warnings',
        'views_count',
        'conversions_count',
        'total_revenue',
    ];

    protected function casts(): array
    {
        return [
            'validation_warnings' => 'array',
            'no_index'            => 'boolean',
            'is_shareable'        => 'boolean',
            'is_system_template'  => 'boolean',
            'is_ready'            => 'boolean',
            'views_count'         => 'integer',
            'conversions_count'   => 'integer',
            'total_revenue'       => 'decimal:2',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function steps()
    {
        return $this->hasMany(FunnelStep::class, 'funnel_id')->orderBy('sort_order');
    }

    public function affiliates()
    {
        return $this->hasMany(FunnelAffiliate::class, 'funnel_id');
    }

    public function submissions()
    {
        return $this->hasMany(FunnelSubmission::class, 'funnel_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForWorkspace($query, int $workspaceId)
    {
        return $query->where('workspace_id', $workspaceId);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function getConversionRateAttribute(): float
    {
        if ($this->views_count === 0) {
            return 0.0;
        }

        return round(($this->conversions_count / $this->views_count) * 100, 2);
    }
}
