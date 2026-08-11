<?php

namespace App\Modules\Funnels\Models;

use Illuminate\Database\Eloquent\Model;

class FunnelSubmission extends Model
{
    protected $table = 'funnel_submissions';

    protected $fillable = [
        'funnel_step_id',
        'funnel_id',
        'workspace_id',
        'contact_id',
        'email',
        'phone',
        'first_name',
        'last_name',
        'form_data',
        'ref_code',
        'visitor_ip',
        'visitor_country',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'status',
        'order_amount',
        'payment_gateway',
        'transaction_id',
        'is_partial',
    ];

    protected function casts(): array
    {
        return [
            'form_data'    => 'array',
            'order_amount' => 'decimal:2',
            'is_partial'   => 'boolean',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function funnel()
    {
        return $this->belongsTo(Funnel::class, 'funnel_id');
    }

    public function step()
    {
        return $this->belongsTo(FunnelStep::class, 'funnel_step_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeLeads($query)
    {
        return $query->where('status', 'lead');
    }

    public function scopeCustomers($query)
    {
        return $query->where('status', 'customer');
    }

    public function scopePartial($query)
    {
        return $query->where('is_partial', true);
    }

    public function scopeForWorkspace($query, int $workspaceId)
    {
        return $query->where('workspace_id', $workspaceId);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}
