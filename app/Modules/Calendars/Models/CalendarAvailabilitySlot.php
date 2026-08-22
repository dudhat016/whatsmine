<?php

namespace App\Modules\Calendars\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarAvailabilitySlot extends Model
{
    use HasFactory;

    protected $table = 'calendar_availability_slots';

    protected $fillable = [
        'calendar_id',
        'user_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function calendar(): BelongsTo
    {
        return $this->belongsTo(BookingCalendar::class, 'calendar_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
