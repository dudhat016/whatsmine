<?php

namespace App\Modules\Calendars\Models;

use App\Modules\Shared\Models\Contact;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    protected $table = 'appointments';

    protected $fillable = [
        'workspace_id',
        'calendar_id',
        'contact_id',
        'parent_appointment_id',
        'recurring_sequence',
        'assigned_user_id',
        'title',
        'start_at',
        'end_at',
        'timezone',
        'status',
        'location',
        'meeting_join_url',
        'payment_status',
        'payment_amount',
        'payment_reference',
        'notes',
        'cancellation_reason',
        'reschedule_token',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'payment_amount' => 'decimal:2',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function calendar(): BelongsTo
    {
        return $this->belongsTo(BookingCalendar::class, 'calendar_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'parent_appointment_id');
    }

    public function recurringChildren()
    {
        return $this->hasMany(Appointment::class, 'parent_appointment_id');
    }
}
