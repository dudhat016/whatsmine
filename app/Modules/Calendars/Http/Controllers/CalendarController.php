<?php

namespace App\Modules\Calendars\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Calendars\Models\Appointment;
use App\Modules\Calendars\Models\BookingCalendar;
use App\Modules\Calendars\Models\CalendarAvailabilitySlot;
use App\Modules\Calendars\Models\CalendarDateOverride;
use App\Modules\Calendars\Models\CalendarTeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    /**
     * Display Calendars & Appointments management hub.
     */
    public function index(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);

        $calendars = BookingCalendar::where('workspace_id', $workspaceId)
            ->with(['teamMembers.user:id,name,email', 'availabilitySlots', 'dateOverrides'])
            ->orderBy('id', 'desc')
            ->get();

        $appointments = Appointment::where('workspace_id', $workspaceId)
            ->with(['calendar:id,name,slug', 'contact:id,first_name,last_name,phone_e164,email', 'assignedUser:id,name'])
            ->orderBy('start_at', 'desc')
            ->limit(100)
            ->get();

        $users = User::select('id', 'name', 'email')->get();
        $forms = \App\Modules\Funnels\Models\SubscriptionForm::where('workspace_id', $workspaceId)
            ->select('id', 'name', 'title')
            ->get();

        $stats = [
            'total_calendars' => $calendars->count(),
            'total_appointments' => $appointments->count(),
            'upcoming_appointments' => $appointments->where('start_at', '>=', now())->where('status', 'confirmed')->count(),
            'completed_appointments' => $appointments->where('status', 'completed')->count(),
        ];

        return Inertia::render('Calendars/Index', [
            'calendars' => $calendars,
            'appointments' => $appointments,
            'workspaceUsers' => $users,
            'workspaceForms' => $forms,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a new booking calendar.
     */
    public function store(Request $request)
    {
        $workspaceId = $this->workspaceId($request);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'type' => 'required|in:personal,round_robin,class,collective',
            'round_robin_mode' => 'nullable|in:optimize_for_availability,equal_distribution',
            'duration_minutes' => 'required|integer|min:5|max:480',
            'slot_interval_minutes' => 'required|integer|min:5|max:240',
            'pre_buffer_minutes' => 'nullable|integer|min:0|max:120',
            'post_buffer_minutes' => 'nullable|integer|min:0|max:120',
            'min_notice_hours' => 'nullable|integer|min:0|max:72',
            'look_ahead_days' => 'nullable|integer|min:1|max:90',
            'max_bookings_per_day' => 'nullable|integer|min:1|max:100',
            'max_capacity' => 'nullable|integer|min:1|max:500',
            'custom_form_id' => 'nullable|integer',
            'allow_additional_guests' => 'boolean',
            'location_type' => 'required|in:google_meet,zoom,whatsapp,phone,address,custom',
            'location_custom' => 'nullable|string|max:255',
            'requires_payment' => 'boolean',
            'amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'is_recurring' => 'boolean',
            'recurring_frequency' => 'nullable|in:daily,weekly,monthly',
            'recurring_count' => 'nullable|integer|min:1|max:52',
            'team_members' => 'nullable|array',
            'availability' => 'nullable|array',
            'date_overrides' => 'nullable|array',
        ]);

        $slug = Str::slug($validated['name']) . '-' . Str::random(4);

        $calendarData = $validated;
        unset($calendarData['availability'], $calendarData['team_members'], $calendarData['date_overrides']);

        $calendar = BookingCalendar::create(array_merge($calendarData, [
            'workspace_id' => $workspaceId,
            'slug' => $slug,
            'is_active' => true,
        ]));

        if (! empty($validated['team_members'])) {
            foreach ($validated['team_members'] as $userId) {
                CalendarTeamMember::create([
                    'calendar_id' => $calendar->id,
                    'user_id' => $userId,
                    'priority' => 1,
                    'is_active' => true,
                ]);
            }
        }

        // Save custom availability slots if provided, else seed default (Mon-Fri 9AM-5PM)
        if (! empty($validated['availability'])) {
            foreach ($validated['availability'] as $slot) {
                if (! empty($slot['is_active'])) {
                    CalendarAvailabilitySlot::create([
                        'calendar_id' => $calendar->id,
                        'day_of_week' => $slot['day_of_week'],
                        'start_time' => strlen($slot['start_time']) === 5 ? $slot['start_time'] . ':00' : $slot['start_time'],
                        'end_time' => strlen($slot['end_time']) === 5 ? $slot['end_time'] . ':00' : $slot['end_time'],
                        'is_active' => true,
                    ]);
                }
            }
        } else {
            for ($day = 1; $day <= 5; $day++) {
                CalendarAvailabilitySlot::create([
                    'calendar_id' => $calendar->id,
                    'day_of_week' => $day,
                    'start_time' => '09:00:00',
                    'end_time' => '17:00:00',
                    'is_active' => true,
                ]);
            }
        }

        return redirect()->back()->with('flash.banner', 'Calendar created successfully.');
    }

    /**
     * Update an existing calendar.
     */
    public function update(Request $request, BookingCalendar $calendar)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'type' => 'required|in:personal,round_robin,class,collective',
            'round_robin_mode' => 'nullable|in:optimize_for_availability,equal_distribution',
            'duration_minutes' => 'required|integer|min:5|max:480',
            'slot_interval_minutes' => 'required|integer|min:5|max:240',
            'pre_buffer_minutes' => 'nullable|integer|min:0|max:120',
            'post_buffer_minutes' => 'nullable|integer|min:0|max:120',
            'min_notice_hours' => 'nullable|integer|min:0|max:72',
            'look_ahead_days' => 'nullable|integer|min:1|max:90',
            'max_bookings_per_day' => 'nullable|integer|min:1|max:100',
            'max_capacity' => 'nullable|integer|min:1|max:500',
            'custom_form_id' => 'nullable|integer',
            'allow_additional_guests' => 'boolean',
            'location_type' => 'required|in:google_meet,zoom,whatsapp,phone,address,custom',
            'location_custom' => 'nullable|string|max:255',
            'redirect_url' => 'nullable|url|max:255',
            'requires_payment' => 'boolean',
            'amount' => 'nullable|numeric|min:0',
            'is_recurring' => 'boolean',
            'recurring_frequency' => 'nullable|in:daily,weekly,monthly',
            'recurring_count' => 'nullable|integer|min:1|max:52',
            'team_members' => 'nullable|array',
            'is_active' => 'boolean',
            'availability' => 'nullable|array',
            'date_overrides' => 'nullable|array',
        ]);

        $calendarData = $validated;
        unset($calendarData['availability'], $calendarData['team_members'], $calendarData['date_overrides']);

        $calendar->update($calendarData);

        if (isset($validated['team_members'])) {
            $calendar->teamMembers()->delete();
            foreach ($validated['team_members'] as $userId) {
                CalendarTeamMember::create([
                    'calendar_id' => $calendar->id,
                    'user_id' => $userId,
                    'priority' => 1,
                    'is_active' => true,
                ]);
            }
        }

        if (isset($validated['availability'])) {
            $calendar->availabilitySlots()->delete();
            foreach ($validated['availability'] as $slot) {
                if (! empty($slot['is_active'])) {
                    CalendarAvailabilitySlot::create([
                        'calendar_id' => $calendar->id,
                        'day_of_week' => $slot['day_of_week'],
                        'start_time' => strlen($slot['start_time']) === 5 ? $slot['start_time'] . ':00' : $slot['start_time'],
                        'end_time' => strlen($slot['end_time']) === 5 ? $slot['end_time'] . ':00' : $slot['end_time'],
                        'is_active' => true,
                    ]);
                }
            }
        }

        if (isset($validated['date_overrides'])) {
            $calendar->dateOverrides()->delete();
            foreach ($validated['date_overrides'] as $override) {
                if (! empty($override['override_date'])) {
                    CalendarDateOverride::create([
                        'calendar_id' => $calendar->id,
                        'override_date' => $override['override_date'],
                        'is_unavailable' => true,
                    ]);
                }
            }
        }

        return redirect()->back()->with('flash.banner', 'Calendar updated successfully.');
    }

    /**
     * Delete a calendar.
     */
    public function destroy(BookingCalendar $calendar)
    {
        $calendar->delete();
        return redirect()->back()->with('flash.banner', 'Calendar deleted successfully.');
    }

    /**
     * Update appointment status.
     */
    public function updateAppointmentStatus(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'status' => 'required|in:confirmed,rescheduled,cancelled,no_show,completed',
        ]);

        $appointment->update($validated);

        return redirect()->back()->with('flash.banner', 'Appointment status updated.');
    }

    /**
     * Staff manual appointment creation for a customer.
     */
    public function bookManualAppointment(Request $request)
    {
        $validated = $request->validate([
            'calendar_id' => 'required|exists:booking_calendars,id',
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'email' => 'required|email|max:150',
            'phone' => 'nullable|string|max:30',
            'start_at' => 'required|date',
            'assigned_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $calendar = BookingCalendar::findOrFail($validated['calendar_id']);

        $appointmentService = app(\App\Modules\Calendars\Services\AppointmentService::class);
        $appointment = $appointmentService->createAppointment($calendar, $validated);

        return redirect()->back()->with('flash.banner', "Appointment manually booked successfully for {$appointment->first_name}.");
    }
}
