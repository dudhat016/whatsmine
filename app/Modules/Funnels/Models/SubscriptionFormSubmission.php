<?php

namespace App\Modules\Funnels\Models;

use App\Modules\Shared\Models\Contact;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionFormSubmission extends Model
{
    use HasFactory;

    protected $table = 'subscription_form_submissions';

    protected $fillable = [
        'workspace_id',
        'form_id',
        'contact_id',
        'submitted_data',
        'otp_code',
        'otp_expires_at',
        'is_verified',
        'verified_at',
        'ip_address',
        'user_agent',
        'referrer_url',
    ];

    protected function casts(): array
    {
        return [
            'submitted_data' => 'array',
            'otp_expires_at' => 'datetime',
            'is_verified'    => 'boolean',
            'verified_at'    => 'datetime',
        ];
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(SubscriptionForm::class, 'form_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }
}
