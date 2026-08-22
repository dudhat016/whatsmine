<?php

namespace App\Modules\Calendars\Models;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingCalendar extends Model
{
    use HasFactory;

    protected $table = 'booking_calendars';

    protected $fillable = [
        'workspace_id',
        'slug',
        'name',
        'description',
        'type',
        'round_robin_mode',
        'allow_staff_selection',
        'duration_minutes',
        'slot_interval_minutes',
        'pre_buffer_minutes',
        'post_buffer_minutes',
        'min_notice_hours',
        'look_ahead_days',
        'max_bookings_per_day',
        'max_capacity',
        'is_recurring',
        'recurring_frequency',
        'recurring_count',
        'look_busy_percent',
        'location_type',
        'location_custom',
        'redirect_url',
        'requires_payment',
        'amount',
        'currency',
        'custom_form_id',
        'is_active',
    ];

    protected $casts = [
        'allow_staff_selection' => 'boolean',
        'requires_payment' => 'boolean',
        'is_recurring' => 'boolean',
        'is_active' => 'boolean',
        'amount' => 'decimal:2',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function teamMembers(): HasMany
    {
        return $this->hasMany(CalendarTeamMember::class, 'calendar_id');
    }

    public function availabilitySlots(): HasMany
    {
        return $this->hasMany(CalendarAvailabilitySlot::class, 'calendar_id');
    }

    public function dateOverrides(): HasMany
    {
        return $this->hasMany(CalendarDateOverride::class, 'calendar_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'calendar_id');
    }
}
