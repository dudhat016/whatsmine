<?php

namespace App\Modules\Funnels\Models;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionFormView extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'subscription_form_views';

    protected $fillable = [
        'workspace_id',
        'form_id',
        'ip_address',
        'user_agent',
        'device_type',
        'referrer_url',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(SubscriptionForm::class, 'form_id');
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }
}
