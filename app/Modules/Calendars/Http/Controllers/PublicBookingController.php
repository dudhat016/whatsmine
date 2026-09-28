<?php

namespace App\Modules\Calendars\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Calendars\Models\Appointment;
use App\Modules\Calendars\Models\BookingCalendar;
use App\Modules\Calendars\Services\AppointmentService;
use App\Modules\Calendars\Services\CalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Stripe\StripeClient;

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

    private function resolveStripeSecretKey(int $workspaceId): ?string
    {
        $store = \App\Modules\Ecommerce\Models\EcommerceStore::where('workspace_id', $workspaceId)->where('is_active', true)->first();
        if ($store && !empty($store->credentials['stripe_secret_key'])) {
            return $store->credentials['stripe_secret_key'];
        }

        return config('billing.gateways.stripe.secret_key') ?: env('STRIPE_SECRET');
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

        // If this calendar requires payment, initiate Stripe Checkout
        if ($calendar->requires_payment && (float) $calendar->amount > 0) {
            $stripeSecret = $this->resolveStripeSecretKey((int) $calendar->workspace_id);

            if (!$stripeSecret || strlen($stripeSecret) < 8) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment gateway is not configured for this calendar. Please contact support.',
                ], 422);
            }

            try {
                $stripe = new StripeClient($stripeSecret);

                $session = $stripe->checkout->sessions->create([
                    'payment_method_types' => ['card'],
                    'customer_email' => $validated['email'],
                    'line_items' => [[
                        'price_data' => [
                            'currency' => strtolower($calendar->currency ?? 'usd'),
                            'unit_amount' => (int) round(((float) $calendar->amount) * 100),
                            'product_data' => [
                                'name' => "Appointment: {$calendar->name}",
                                'description' => "Scheduled session on {$appointment->start_at->format('M d, Y @ h:i A')}",
                            ],
                        ],
                        'quantity' => 1,
                    ]],
                    'mode' => 'payment',
                    'client_reference_id' => 'APT-' . $appointment->id,
                    'metadata' => [
                        'appointment_id' => (string) $appointment->id,
                        'calendar_id' => (string) $calendar->id,
                        'reschedule_token' => $appointment->reschedule_token,
                        'workspace_id' => (string) $calendar->workspace_id,
                        'type' => 'calendar_booking',
                    ],
                    'success_url' => route('public.booking.payment.success', $appointment->reschedule_token) . '?session_id={CHECKOUT_SESSION_ID}',
                    'cancel_url' => route('public.booking.widget', $calendar->slug) . '?payment_status=cancelled',
                ]);

                $appointment->update([
                    'payment_reference' => $session->id,
                ]);

                return response()->json([
                    'success' => true,
                    'requires_payment' => true,
                    'appointment' => $appointment,
                    'redirect_url' => $session->url,
                    'message' => 'Redirecting to payment checkout...',
                ]);
            } catch (\Throwable $e) {
                Log::error('PublicBookingController: Stripe checkout session creation failed', ['error' => $e->getMessage()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to initialize payment gateway: ' . $e->getMessage(),
                ], 422);
            }
        }

        return response()->json([
            'success' => true,
            'requires_payment' => false,
            'appointment' => $appointment,
            'redirect_url' => $calendar->redirect_url ?: null,
        ]);
    }

    /**
     * Handle return redirect from payment gateway after checkout.
     */
    public function paymentSuccess(Request $request, string $token)
    {
        $appointment = Appointment::where('reschedule_token', $token)
            ->with(['calendar', 'contact'])
            ->firstOrFail();

        $sessionId = $request->query('session_id');
        if ($sessionId && $appointment->payment_status !== 'paid') {
            $stripeSecret = $this->resolveStripeSecretKey((int) $appointment->workspace_id);
            if ($stripeSecret) {
                try {
                    $stripe = new StripeClient($stripeSecret);
                    $session = $stripe->checkout->sessions->retrieve($sessionId);
                    if ($session && $session->payment_status === 'paid') {
                        $this->appointmentService->markAsPaidAndConfirmed($appointment, $session->payment_intent ?? $session->id);
                    }
                } catch (\Throwable $e) {
                    Log::warning('PublicBookingController: Failed verifying Stripe session', ['session' => $sessionId, 'error' => $e->getMessage()]);
                }
            }
        }

        if ($appointment->calendar?->redirect_url) {
            return redirect($appointment->calendar->redirect_url);
        }

        return redirect()->route('public.booking.reschedule.show', $token)->with('success', 'Appointment confirmed and payment received!');
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
    public function processCancel(Request $request, string $token): Response
    {
        $appointment = Appointment::where('reschedule_token', $token)
            ->with(['calendar', 'contact'])
            ->firstOrFail();

        $this->appointmentService->cancel($appointment, $request->input('reason'));

        return Inertia::render('Public/Booking/Cancelled', [
            'appointment' => $appointment,
            'calendar' => $appointment->calendar,
        ]);
    }

    /**
     * Download an .ics calendar file for the appointment.
     */
    public function downloadIcs(string $token): \Illuminate\Http\Response
    {
        $appointment = Appointment::where('reschedule_token', $token)
            ->with(['calendar', 'contact'])
            ->firstOrFail();

        $startUtc = $appointment->start_at->copy()->setTimezone('UTC')->format('Ymd\THis\Z');
        $endUtc = $appointment->end_at->copy()->setTimezone('UTC')->format('Ymd\THis\Z');
        $nowUtc = now('UTC')->format('Ymd\THis\Z');

        $summary = $this->escapeIcsString($appointment->title ?: ($appointment->calendar?->name ?? 'Appointment'));
        $location = $this->escapeIcsString($appointment->location ?: ($appointment->meeting_join_url ?: 'Online'));
        $description = $this->escapeIcsString("Meeting with: " . ($appointment->calendar?->name ?? 'WhatsMine') . "\nJoin link: " . ($appointment->meeting_join_url ?? ''));

        $ics = "BEGIN:VCALENDAR\r\n" .
            "VERSION:2.0\r\n" .
            "PRODID:-//WhatsMine//Appointment Booking//EN\r\n" .
            "CALSCALE:GREGORIAN\r\n" .
            "METHOD:REQUEST\r\n" .
            "BEGIN:VEVENT\r\n" .
            "UID:appt-{$appointment->id}-{$appointment->reschedule_token}@whatsmine.com\r\n" .
            "DTSTAMP:{$nowUtc}\r\n" .
            "DTSTART:{$startUtc}\r\n" .
            "DTEND:{$endUtc}\r\n" .
            "SUMMARY:{$summary}\r\n" .
            "DESCRIPTION:{$description}\r\n" .
            "LOCATION:{$location}\r\n" .
            "STATUS:CONFIRMED\r\n" .
            "BEGIN:VALARM\r\n" .
            "TRIGGER:-PT15M\r\n" .
            "ACTION:DISPLAY\r\n" .
            "DESCRIPTION:Reminder: {$summary}\r\n" .
            "END:VALARM\r\n" .
            "END:VEVENT\r\n" .
            "END:VCALENDAR\r\n";

        return response($ics, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="invite-' . $appointment->id . '.ics"',
        ]);
    }

    private function escapeIcsString(string $text): string
    {
        return str_replace(["\\", ";", ",", "\n", "\r"], ["\\\\", "\\;", "\\,", "\\n", ""], $text);
    }
}
