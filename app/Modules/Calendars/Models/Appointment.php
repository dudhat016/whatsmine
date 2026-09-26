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

    public function getGoogleCalendarUrlAttribute(): string
    {
        if (! $this->start_at || ! $this->end_at) {
            return '#';
        }

        $startUtc = $this->start_at->copy()->setTimezone('UTC')->format('Ymd\THis\Z');
        $endUtc = $this->end_at->copy()->setTimezone('UTC')->format('Ymd\THis\Z');
        $title = urlencode($this->title ?: ($this->calendar?->name ?? 'Appointment'));
        $details = urlencode("Meeting Link: " . ($this->meeting_join_url ?: '') . "\n" . ($this->notes ?: ''));
        $location = urlencode($this->location ?: ($this->meeting_join_url ?: 'Online'));

        return "https://calendar.google.com/calendar/render?action=TEMPLATE&text={$title}&dates={$startUtc}/{$endUtc}&details={$details}&location={$location}";
    }

    public function getOutlookCalendarUrlAttribute(): string
    {
        if (! $this->start_at || ! $this->end_at) {
            return '#';
        }

        $start = urlencode($this->start_at->copy()->setTimezone('UTC')->toIso8601String());
        $end = urlencode($this->end_at->copy()->setTimezone('UTC')->toIso8601String());
        $title = urlencode($this->title ?: ($this->calendar?->name ?? 'Appointment'));
        $details = urlencode("Meeting Link: " . ($this->meeting_join_url ?: '') . "\n" . ($this->notes ?: ''));
        $location = urlencode($this->location ?: ($this->meeting_join_url ?: 'Online'));

        return "https://outlook.live.com/calendar/0/deeplink/compose?subject={$title}&startdt={$start}&enddt={$end}&body={$details}&location={$location}";
    }

    public function getIcalUrlAttribute(): string
    {
        return url('/b/appointment/' . ($this->reschedule_token ?: $this->id) . '/invite.ics');
    }

    public function getRescheduleUrlAttribute(): string
    {
        return url('/b/reschedule/' . ($this->reschedule_token ?: $this->id));
    }

    public function getCancelUrlAttribute(): string
    {
        return url('/b/cancel/' . ($this->reschedule_token ?: $this->id));
    }

    public function getCalendarLinksHtml(): string
    {
        $google = htmlspecialchars($this->google_calendar_url, ENT_QUOTES, 'UTF-8');
        $outlook = htmlspecialchars($this->outlook_calendar_url, ENT_QUOTES, 'UTF-8');
        $cancel = htmlspecialchars($this->cancel_url, ENT_QUOTES, 'UTF-8');
        $reschedule = htmlspecialchars($this->reschedule_url, ENT_QUOTES, 'UTF-8');

        return '<a href="' . $google . '" target="_blank" rel="noopener noreferrer">Add to google calendar</a> | <a href="' . $outlook . '" target="_blank" rel="noopener noreferrer">Add to outlook</a><br><a href="' . $cancel . '">Cancel</a> | <a href="' . $reschedule . '">Reschedule</a>';
    }

    public function getCalendarLinksText(): string
    {
        return "Add to Google Calendar: {$this->google_calendar_url}\n"
            . "Add to Outlook: {$this->outlook_calendar_url}\n"
            . "Reschedule: {$this->reschedule_url}\n"
            . "Cancel: {$this->cancel_url}";
    }
}
