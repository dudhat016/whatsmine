<?php

namespace App\Modules\Shared\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TriggerLinkClick extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'trigger_link_id',
        'contact_id',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function triggerLink(): BelongsTo
    {
        return $this->belongsTo(TriggerLink::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
