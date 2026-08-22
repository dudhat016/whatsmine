<?php

namespace App\Modules\Calendars\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCalendarConnection extends Model
{
    use HasFactory;

    protected $table = 'user_calendar_connections';

    protected $fillable = [
        'user_id',
        'provider',
        'external_calendar_id',
        'access_token',
        'refresh_token',
        'expires_at',
        'sync_enabled',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'sync_enabled' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
