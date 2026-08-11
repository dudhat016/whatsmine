<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class FunnelAffiliate extends Model
{
    protected $table = 'funnel_affiliates';

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (self $model) {
            if (empty($model->ref_code)) {
                // Generate a unique 8-char alphanumeric affiliate ref code
                $model->ref_code = strtolower(Str::random(8));
            }
        });
    }

    protected $fillable = [
        'funnel_id',
        'workspace_id',
        'name',
        'email',
        'ref_code',
        'commission_rate',
        'status',
        'clicks_count',
        'leads_count',
        'conversions_count',
        'total_earned',
        'total_paid',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate'   => 'decimal:2',
            'total_earned'      => 'decimal:2',
            'total_paid'        => 'decimal:2',
            'clicks_count'      => 'integer',
            'leads_count'       => 'integer',
            'conversions_count' => 'integer',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function funnel()
    {
        return $this->belongsTo(Funnel::class, 'funnel_id');
    }

    public function commissions()
    {
        return $this->hasMany(FunnelAffiliateCommission::class, 'funnel_affiliate_id');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function getPendingBalanceAttribute(): float
    {
        return round($this->total_earned - $this->total_paid, 2);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
