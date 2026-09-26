<?php

namespace App\Modules\Agency\Models;

use App\Models\Workspace;
use App\Modules\Shared\Models\Contact;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class AgencyContract extends Model
{
    protected $table = 'agency_contracts';

    protected $fillable = [
        'uuid',
        'workspace_id',
        'proposal_id',
        'contact_id',
        'title',
        'content',
        'status',
        'client_signature',
        'counter_signature',
        'audit_log',
        'document_checksum',
        'signed_at',
        'viewed_at',
        'raw',
    ];

    protected $casts = [
        'client_signature' => 'array',
        'counter_signature' => 'array',
        'audit_log' => 'array',
        'raw' => 'array',
        'signed_at' => 'datetime',
        'viewed_at' => 'datetime',
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

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(AgencyProposal::class, 'proposal_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(AgencyInvoice::class, 'contract_id');
    }
}
