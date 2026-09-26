<?php

namespace App\Modules\Agency\Models;

use App\Models\Workspace;
use App\Modules\Shared\Models\Contact;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class AgencyInvoice extends Model
{
    protected $table = 'agency_invoices';

    protected $fillable = [
        'uuid',
        'workspace_id',
        'proposal_id',
        'contract_id',
        'contact_id',
        'invoice_number',
        'status',
        'billing_type',
        'due_date',
        'line_items',
        'installments',
        'subtotal',
        'discount_amount',
        'tax_rate',
        'tax_amount',
        'total',
        'amount_paid',
        'balance_due',
        'currency',
        'paid_at',
        'viewed_at',
        'raw',
    ];

    protected $casts = [
        'line_items' => 'array',
        'installments' => 'array',
        'raw' => 'array',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'due_date' => 'datetime',
        'paid_at' => 'datetime',
        'viewed_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->invoice_number)) {
                $model->invoice_number = 'INV-' . strtoupper(Str::random(8));
            }
            if (is_null($model->balance_due)) {
                $model->balance_due = $model->total ?? 0.00;
            }
        });
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(AgencyProposal::class, 'proposal_id');
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(AgencyContract::class, 'contract_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function onboardingResponse(): HasOne
    {
        return $this->hasOne(AgencyOnboardingResponse::class, 'invoice_id');
    }
}
