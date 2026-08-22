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
     * Dispatch automation engine triggers for appointment events.
     */
    public function dispatchAutomationTrigger(Appointment $appointment, string $triggerType): void
    {
        try {
            $engine = app(\App\Modules\Automation\Services\AutomationEngine::class);
            $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $appointment->workspace_id)
                ->where('status', 'active')
                ->where('trigger_type', $triggerType)
                ->get();

            foreach ($automations as $automation) {
                $engine->triggerForContact($automation, (int) $appointment->contact_id, [
                    'appointment_id' => $appointment->id,
                    'appointment_title' => $appointment->title,
                    'appointment_start_at' => $appointment->start_at->toIso8601String(),
                    'meeting_join_url' => $appointment->meeting_join_url,
                    'calendar_id' => $appointment->calendar_id,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error("Failed to dispatch appointment automation [{$triggerType}]: " . $e->getMessage());
        }
    }
}
