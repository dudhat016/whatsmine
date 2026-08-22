<?php

namespace App\Modules\Calendars\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarDateOverride extends Model
{
    use HasFactory;

    protected $table = 'calendar_date_overrides';

    protected $fillable = [
        'calendar_id',
        'override_date',
        'is_unavailable',
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'is_unavailable' => 'boolean',
    ];

    public function calendar(): BelongsTo
    {
        return $this->belongsTo(BookingCalendar::class, 'calendar_id');
    }
}
