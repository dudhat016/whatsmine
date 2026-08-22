<?php

namespace App\Modules\Calendars\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Calendars\Models\Appointment;
use App\Modules\Calendars\Models\BookingCalendar;
use App\Modules\Calendars\Services\AppointmentService;
use App\Modules\Calendars\Services\CalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicBookingController extends Controller
{
    protected CalendarService $calendarService;
    protected AppointmentService $appointmentService;

    public function __construct(CalendarService $calendarService, AppointmentService $appointmentService)
    {
        $this->calendarService = $calendarService;
        $this->appointmentService = $appointmentService;
    }

    /**
     * Render the public booking widget.
     */
    public function showWidget(string $slug): Response
    {
        $calendar = BookingCalendar::where('slug', $slug)
            ->where('is_active', true)
            ->with(['workspace:id,name', 'teamMembers.user:id,name'])
            ->firstOrFail();

        // Load the attached custom intake form fields if any
        $customFormFields = [];
        if ($calendar->custom_form_id) {
            $form = \App\Modules\Funnels\Models\SubscriptionForm::find($calendar->custom_form_id);
            if ($form) {
                $customFormFields = is_array($form->fields) ? $form->fields : json_decode($form->fields ?? '[]', true);
            }
        }

        return Inertia::render('Public/Booking/Widget', [
            'calendar' => $calendar,
            'customFormFields' => $customFormFields,
        ]);
    }

    /**
     * Get available time slots for a specific date (JSON API).
     */
    public function getSlots(Request $request, string $slug): JsonResponse
    {
        $calendar = BookingCalendar::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $dateStr = $request->input('date', now()->format('Y-m-d'));
        $timezone = $request->input('timezone', 'UTC');

        $slots = $this->calendarService->getAvailableSlots($calendar, $dateStr, $timezone);

        return response()->json([
            'date' => $dateStr,
            'timezone' => $timezone,
            'slots' => $slots,
        ]);
    }

    /**
     * Process booking submission.
     */
    public function processBooking(Request $request, string $slug): JsonResponse
    {
        $calendar = BookingCalendar::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'email' => 'required|email|max:150',
            'phone' => 'required|string|max:30',
            'start_at' => 'required|date',
            'timezone' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'assigned_user_id' => 'nullable|integer',
            'additional_guests' => 'nullable|array',
            'additional_guests.*' => 'email|max:150',
            'custom_fields' => 'nullable|array',
        ]);

        $appointment = $this->appointmentService->createAppointment($calendar, $validated);

        return response()->json([
            'success' => true,
            'appointment' => $appointment,
            'redirect_url' => $calendar->redirect_url ?: null,
        ]);
    }

    /**
     * Render public appointment rescheduling view.
     */
    public function showReschedule(string $token): Response
    {
        $appointment = Appointment::where('reschedule_token', $token)
            ->with(['calendar', 'contact'])
            ->firstOrFail();

        return Inertia::render('Public/Booking/Reschedule', [
            'appointment' => $appointment,
            'calendar' => $appointment->calendar,
        ]);
    }

    /**
     * Process appointment rescheduling submission.
     */
    public function processReschedule(Request $request, string $token): JsonResponse
    {
        $appointment = Appointment::where('reschedule_token', $token)->firstOrFail();

        $validated = $request->validate([
            'start_at' => 'required|date',
            'timezone' => 'nullable|string|max:50',
        ]);

        $timezone = $validated['timezone'] ?? $appointment->timezone ?? 'UTC';
        $updatedAppointment = $this->appointmentService->reschedule($appointment, $validated['start_at'], $timezone);

        return response()->json([
            'success' => true,
            'message' => 'Appointment rescheduled successfully.',
            'appointment' => $updatedAppointment,
        ]);
    }

    /**
     * Process appointment cancellation self-service.
     */
    public function processCancel(string $token): Response
    {
        $appointment = Appointment::where('reschedule_token', $token)
            ->with(['calendar', 'contact'])
            ->firstOrFail();

        $appointment->update(['status' => 'cancelled']);

        return Inertia::render('Public/Booking/Cancelled', [
            'appointment' => $appointment,
            'calendar' => $appointment->calendar,
        ]);
    }
}
