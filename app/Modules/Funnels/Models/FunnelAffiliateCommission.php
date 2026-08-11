<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;

class FunnelAffiliateCommission extends Model
{
    protected $table = 'funnel_affiliate_commissions';

    protected $fillable = [
        'funnel_affiliate_id',
        'funnel_id',
        'order_amount',
        'commission_amount',
        'commission_rate',
        'status',
        'order_reference',
        'attributed_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'order_amount'      => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'commission_rate'   => 'decimal:2',
            'attributed_at'     => 'datetime',
            'paid_at'           => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function affiliate()
    {
        return $this->belongsTo(FunnelAffiliate::class, 'funnel_affiliate_id');
    }

    public function funnel()
    {
        return $this->belongsTo(Funnel::class, 'funnel_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
