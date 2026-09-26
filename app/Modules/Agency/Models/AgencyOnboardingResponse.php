<?php

namespace App\Modules\Agency\Models;

use App\Models\Workspace;
use App\Modules\Shared\Models\Contact;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AgencyOnboardingResponse extends Model
{
    protected $table = 'agency_onboarding_responses';

    protected $fillable = [
        'uuid',
        'workspace_id',
        'contact_id',
        'invoice_id',
        'form_data',
        'files',
        'status',
        'completed_at',
    ];

    protected $casts = [
        'form_data' => 'array',
        'files' => 'array',
        'completed_at' => 'datetime',
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

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(AgencyInvoice::class, 'invoice_id');
    }
}
