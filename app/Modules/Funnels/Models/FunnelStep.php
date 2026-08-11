<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;

class FunnelStep extends Model
{
    protected $table = 'funnel_steps';

    protected $fillable = [
        'funnel_id',
        'name',
        'type',
        'sort_order',
        'views_count',
        'conversions_count',
    ];

    protected function casts(): array
    {
        return [
            'sort_order'        => 'integer',
            'views_count'       => 'integer',
            'conversions_count' => 'integer',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function funnel()
    {
        return $this->belongsTo(Funnel::class, 'funnel_id');
    }

    public function pages()
    {
        return $this->hasMany(FunnelPage::class, 'funnel_step_id');
    }

    public function controlPage()
    {
        return $this->hasOne(FunnelPage::class, 'funnel_step_id')->where('is_control', true);
    }

    public function submissions()
    {
        return $this->hasMany(FunnelSubmission::class, 'funnel_step_id');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function getConversionRateAttribute(): float
    {
        if ($this->views_count === 0) {
            return 0.0;
        }

        return round(($this->conversions_count / $this->views_count) * 100, 2);
    }

    public function isCheckoutType(): bool
    {
        return in_array($this->type, ['checkout', 'upsell', 'downsell', 'order_bump']);
    }

    public function requiresPaymentGateway(): bool
    {
        return in_array($this->type, ['checkout', 'upsell', 'downsell']);
    }
}
