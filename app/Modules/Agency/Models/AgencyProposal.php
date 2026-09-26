<?php

namespace App\Modules\Agency\Models;

use App\Models\Workspace;
use App\Modules\Pipelines\Models\Deal;
use App\Modules\Shared\Models\Contact;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class AgencyProposal extends Model
{
    protected $table = 'agency_proposals';

    protected $fillable = [
        'uuid',
        'workspace_id',
        'contact_id',
        'deal_id',
        'title',
        'status',
        'pricing_type',
        'line_items',
        'subtotal',
        'discount_amount',
        'tax_rate',
        'tax_amount',
        'total',
        'currency',
        'valid_until',
        'viewed_at',
        'accepted_at',
        'declined_at',
        'contract_terms',
        'raw',
    ];

    protected $casts = [
        'line_items' => 'array',
        'raw' => 'array',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'valid_until' => 'datetime',
        'viewed_at' => 'datetime',
        'accepted_at' => 'datetime',
        'declined_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function contract(): HasOne
    {
        return $this->hasOne(AgencyContract::class, 'proposal_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(AgencyInvoice::class, 'proposal_id');
    }
}
