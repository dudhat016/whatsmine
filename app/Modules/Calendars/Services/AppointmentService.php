<?php

namespace App\Modules\Calendars\Services;

use App\Modules\Shared\Models\Contact;
use App\Modules\Calendars\Models\Appointment;
use App\Modules\Calendars\Models\BookingCalendar;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AppointmentService
{
    protected CalendarService $calendarService;

    public function __construct(CalendarService $calendarService)
    {
        $this->calendarService = $calendarService;
    }

    /**
     * Process a public or internal appointment booking transaction.
     */
    public function createAppointment(BookingCalendar $calendar, array $payload): Appointment
    {
        return DB::transaction(function () use ($calendar, $payload) {
            $workspaceId = $calendar->workspace_id;

            // Find or create Contact
            $contact = Contact::firstOrCreate(
                [
                    'workspace_id' => $workspaceId,
                    'phone_e164' => $payload['phone'] ?? null,
                ],
                [
                    'first_name' => $payload['first_name'] ?? 'Lead',
                    'last_name' => $payload['last_name'] ?? '',
                    'email' => $payload['email'] ?? null,
                ]
            );

            // Assign staff host
            $assignedUserId = $payload['assigned_user_id'] ?? $this->calendarService->assignStaffMember($calendar);

            $startAt = Carbon::parse($payload['start_at']);
            $endAt = $startAt->copy()->addMinutes($calendar->duration_minutes);

            // Generate joining credentials
            $joinUrl = match ($calendar->location_type) {
                'google_meet' => 'https://meet.google.com/' . Str::random(3) . '-' . Str::random(4) . '-' . Str::random(3),
                'zoom' => 'https://zoom.us/j/' . rand(100000000, 999999999),
                'whatsapp' => 'https://wa.me/' . preg_replace('/\D/', '', $contact->phone_e164 ?? ''),
                default => $calendar->location_custom,
            };

            $appointment = Appointment::create([
                'workspace_id' => $workspaceId,
                'calendar_id' => $calendar->id,
                'contact_id' => $contact->id,
                'assigned_user_id' => $assignedUserId,
                'title' => $calendar->name . ' - ' . $contact->full_name,
                'start_at' => $startAt,
                'end_at' => $endAt,
                'timezone' => $payload['timezone'] ?? 'UTC',
                'status' => 'confirmed',
                'location' => $calendar->location_type,
                'meeting_join_url' => $joinUrl,
                'payment_status' => $calendar->requires_payment ? (!empty($payload['payment_token']) || !empty($payload['paid']) ? 'paid' : 'unpaid') : 'paid',
                'payment_amount' => $calendar->requires_payment ? $calendar->amount : 0.00,
                'reschedule_token' => Str::random(40),
                'notes' => $payload['notes'] ?? null,
            ]);

            // Generate recurring session series if calendar is set to recurring
            if ($calendar->is_recurring && $calendar->recurring_count > 1) {
                $totalSessions = min($calendar->recurring_count, 12);
                for ($seq = 2; $seq <= $totalSessions; $seq++) {
                    $nextStartAt = match ($calendar->recurring_frequency) {
                        'daily' => $startAt->copy()->addDays($seq - 1),
                        'monthly' => $startAt->copy()->addMonths($seq - 1),
                        default => $startAt->copy()->addWeeks($seq - 1),
                    };
                    $nextEndAt = $nextStartAt->copy()->addMinutes($calendar->duration_minutes);

                    Appointment::create([
                        'workspace_id' => $workspaceId,
                        'calendar_id' => $calendar->id,
                        'contact_id' => $contact->id,
                        'parent_appointment_id' => $appointment->id,
                        'recurring_sequence' => $seq,
                        'assigned_user_id' => $assignedUserId,
                        'title' => $calendar->name . ' - ' . $contact->full_name . " (#{$seq}/{$totalSessions})",
                        'start_at' => $nextStartAt,
                        'end_at' => $nextEndAt,
                        'timezone' => $payload['timezone'] ?? 'UTC',
                        'status' => 'confirmed',
                        'location' => $calendar->location_type,
                        'meeting_join_url' => $joinUrl,
                        'payment_status' => 'paid',
                        'payment_amount' => 0.00,
                        'reschedule_token' => Str::random(40),
                        'notes' => $payload['notes'] ?? null,
                    ]);
                }
            }

            // Trigger automation workflows
            $this->dispatchAutomationTrigger($appointment, 'appointment.created');

            return $appointment;
        });
    }

    /**
     * Reschedule an appointment.
     */
    public function reschedule(Appointment $appointment, string $newStartAt, string $timezone = 'UTC'): Appointment
    {
        $startAt = Carbon::parse($newStartAt, $timezone);
        $duration = $appointment->calendar->duration_minutes ?? 30;
        $endAt = $startAt->copy()->addMinutes($duration);

        $appointment->update([
            'start_at' => $startAt,
            'end_at' => $endAt,
            'timezone' => $timezone,
            'status' => 'rescheduled',
        ]);

        $this->dispatchAutomationTrigger($appointment, 'appointment.rescheduled');

        return $appointment;
    }

    /**
     * Cancel an appointment.
     */
    public function cancel(Appointment $appointment, ?string $reason = null): Appointment
    {
        $appointment->update([
            'status' => 'cancelled',
            'cancellation_reason' => $reason,
        ]);

        $this->dispatchAutomationTrigger($appointment, 'appointment.cancelled');

        return $appointment;
    }

    /**
     * Update appointment status (e.g. showed, no_show, completed, cancelled) and fire triggers.
     */
    public function updateStatus(Appointment $appointment, string $status): Appointment
    {
        $appointment->update(['status' => $status]);

        // Dispatch general appointment status trigger
        $this->dispatchAutomationTrigger($appointment, 'appointment.status');

        if ($status === 'cancelled') {
            $this->dispatchAutomationTrigger($appointment, 'appointment.cancelled');
        } elseif ($status === 'rescheduled') {
            $this->dispatchAutomationTrigger($appointment, 'appointment.rescheduled');
        }

        return $appointment;
    }

    /**
     * Dispatch automation engine triggers for appointment events.
     */
    public function dispatchAutomationTrigger(Appointment $appointment, string $triggerType): void
    {
        try {
            $appointment->loadMissing(['calendar', 'contact.tags', 'assignedUser']);
            $engine = app(\App\Modules\Automation\Services\AutomationEngine::class);

            $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $appointment->workspace_id)
                ->where('status', 'active')
                ->get();

            $contact = $appointment->contact;
            $calendar = $appointment->calendar;

            foreach ($automations as $automation) {
                foreach ($engine->getAutomationTriggers($automation) as $tr) {
                    $trType = $tr['trigger_type'] ?? '';

                    // Match exact trigger type or general 'appointment.status'
                    if ($trType !== $triggerType && $trType !== 'appointment.status') {
                        continue;
                    }

                    $config = $tr['trigger_config'] ?? [];
                    $filters = $config['filters'] ?? [];

                    // 1. Calendar filter
                    $calendarFilter = $config['calendar_id'] ?? null;
                    if (! $calendarFilter && ! empty($filters)) {
                        $fCal = collect($filters)->firstWhere('type', 'calendar_is');
                        if ($fCal && ! empty($fCal['value'])) {
                            $calendarFilter = $fCal['value'];
                        }
                    }
                    if ($calendarFilter && (int) $calendarFilter !== (int) $appointment->calendar_id) {
                        continue;
                    }

                    // 2. Appointment status filter
                    $statusFilter = $config['appointment_status'] ?? null;
                    if (! $statusFilter && ! empty($filters)) {
                        $fStat = collect($filters)->firstWhere('type', 'appointment_status_is');
                        if ($fStat && ! empty($fStat['value'])) {
                            $statusFilter = $fStat['value'];
                        }
                    }
                    if ($statusFilter) {
                        $currentStatus = strtolower(trim((string) $appointment->status));
                        $targetStatus = strtolower(trim((string) $statusFilter));

                        // Treat 'completed' and 'showed' as interchangeable
                        $isStatusMatch = ($currentStatus === $targetStatus)
                            || ($currentStatus === 'completed' && $targetStatus === 'showed')
                            || ($currentStatus === 'showed' && $targetStatus === 'completed');

                        if (! $isStatusMatch) {
                            continue;
                        }
                    }

                    // 3. Event type filter (personal, team, round_robin, class)
                    $eventTypeFilter = $config['event_type'] ?? null;
                    if (! $eventTypeFilter && ! empty($filters)) {
                        $fType = collect($filters)->firstWhere('type', 'event_type_is');
                        if ($fType && ! empty($fType['value'])) {
                            $eventTypeFilter = $fType['value'];
                        }
                    }
                    if ($eventTypeFilter && $calendar && strtolower((string) $calendar->type) !== strtolower((string) $eventTypeFilter)) {
                        continue;
                    }

                    // 4. Assigned staff filter
                    $staffFilter = $config['assigned_user_id'] ?? null;
                    if (! $staffFilter && ! empty($filters)) {
                        $fStaff = collect($filters)->firstWhere('type', 'assigned_user_is');
                        if ($fStaff && ! empty($fStaff['value'])) {
                            $staffFilter = $fStaff['value'];
                        }
                    }
                    if ($staffFilter && (int) $staffFilter !== (int) $appointment->assigned_user_id) {
                        continue;
                    }

                    // 5. Contact tag filters
                    if (! empty($filters) && $contact) {
                        $tagIs = collect($filters)->firstWhere('type', 'tag_is');
                        if ($tagIs && ! empty($tagIs['value'])) {
                            if (! $contact->tags->contains('name', $tagIs['value'])) {
                                continue;
                            }
                        }

                        $tagIsNot = collect($filters)->firstWhere('type', 'tag_is_not');
                        if ($tagIsNot && ! empty($tagIsNot['value'])) {
                            if ($contact->tags->contains('name', $tagIsNot['value'])) {
                                continue;
                            }
                        }
                    }

                    // Prepare enriched appointment context
                    $context = [
                        'appointment_id' => $appointment->id,
                        'appointment_title' => $appointment->title,
                        'appointment_start_at' => $appointment->start_at->toIso8601String(),
                        'appointment_end_at' => $appointment->end_at->toIso8601String(),
                        'appointment_date' => $appointment->start_at->format('Y-m-d'),
                        'appointment_time' => $appointment->start_at->format('g:i A'),
                        'appointment_end_time' => $appointment->end_at->format('g:i A'),
                        'appointment_timezone' => $appointment->timezone ?? 'UTC',
                        'appointment_location' => $appointment->location ?? 'Online',
                        'meeting_join_url' => $appointment->meeting_join_url ?? '#',
                        'calendar_id' => $appointment->calendar_id,
                        'calendar_name' => $calendar?->name ?? 'Calendar',
                        'reschedule_url' => $appointment->reschedule_url,
                        'reschedule_link' => $appointment->reschedule_url,
                        'cancel_url' => $appointment->cancel_url,
                        'cancel_link' => $appointment->cancel_url,
                        'add_to_google_calendar' => $appointment->google_calendar_url,
                        'google_calendar_url' => $appointment->google_calendar_url,
                        'add_to_outlook' => $appointment->outlook_calendar_url,
                        'outlook_calendar_url' => $appointment->outlook_calendar_url,
                        'add_to_ical' => $appointment->ical_url,
                        'ical_url' => $appointment->ical_url,
                        'calendar_links_html' => $appointment->getCalendarLinksHtml(),
                        'calendar_links_text' => $appointment->getCalendarLinksText(),
                        'host_staff_name' => $appointment->assignedUser?->name ?? 'Host Staff',
                        'appointment_status' => $appointment->status,
                        'trigger_name' => $tr['trigger_name'],
                        'trigger_type' => $tr['trigger_type'],
                        '_matched_trigger_id' => $tr['id'],
                    ];

                    $audience = $config['enroll_audience'] ?? 'contact';
                    if ($audience === 'contact' || $audience === 'both') {
                        $engine->triggerForContact($automation, (int) $appointment->contact_id, $context);
                    }

                    break; // Triggered once per automation
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to dispatch appointment automation [{$triggerType}]: " . $e->getMessage());
        }
    }
}
