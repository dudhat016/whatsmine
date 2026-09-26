<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;

class FunnelStep extends Model
{
    protected $table = 'funnel_steps';

    protected $fillable = [
        'funnel_id',
        'name',
        'slug',
        'type',
        'sort_order',
        'views_count',
        'conversions_count',
    ];

    protected static function booted(): void
    {
        static::saving(function (FunnelStep $step) {
            if (empty($step->slug) && ! empty($step->name)) {
                $step->slug = \Illuminate\Support\Str::slug($step->name);
            }
        });
    }

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

    public function products()
    {
        return $this->hasMany(FunnelStepProduct::class, 'funnel_step_id')->orderBy('sort_order');
    }

    public function mainProducts()
    {
        return $this->hasMany(FunnelStepProduct::class, 'funnel_step_id')->where('type', 'main')->orderBy('sort_order');
    }

    public function orderBumps()
    {
        return $this->hasMany(FunnelStepProduct::class, 'funnel_step_id')->where('type', 'bump')->orderBy('sort_order');
    }

    public function upsellProducts()
    {
        return $this->hasMany(FunnelStepProduct::class, 'funnel_step_id')->where('type', 'upsell')->orderBy('sort_order');
    }

    public function downsellProducts()
    {
        return $this->hasMany(FunnelStepProduct::class, 'funnel_step_id')->where('type', 'downsell')->orderBy('sort_order');
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
