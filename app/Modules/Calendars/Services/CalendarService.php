<?php

namespace App\Modules\Calendars\Services;

use App\Modules\Calendars\Models\Appointment;
use App\Modules\Calendars\Models\BookingCalendar;
use App\Modules\Calendars\Models\CalendarAvailabilitySlot;
use App\Modules\Calendars\Models\CalendarDateOverride;
use App\Modules\Calendars\Models\CalendarTeamMember;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CalendarService
{
    /**
     * Compute available time slots for a given date string (YYYY-MM-DD) and target timezone.
     */
    public function getAvailableSlots(BookingCalendar $calendar, string $dateStr, string $timezone = 'UTC'): array
    {
        $targetDate = Carbon::parse($dateStr, $timezone)->startOfDay();
        $dayOfWeek = $targetDate->dayOfWeek; // 0=Sunday, 1=Monday, etc.

        // 1. Check Date Overrides / Holiday Block-outs for this specific date
        $dateOverride = CalendarDateOverride::where('calendar_id', $calendar->id)
            ->where('override_date', $targetDate->format('Y-m-d'))
            ->first();

        if ($dateOverride && $dateOverride->is_unavailable) {
            return [];
        }

        // Fetch configured availability slots for this calendar & day
        $hasConfiguredSlots = CalendarAvailabilitySlot::where('calendar_id', $calendar->id)->exists();

        if ($hasConfiguredSlots) {
            $slots = CalendarAvailabilitySlot::where('calendar_id', $calendar->id)
                ->where('day_of_week', $dayOfWeek)
                ->where('is_active', true)
                ->get();
        } else {
            // Default Mon-Fri 9 AM to 5 PM if calendar has no explicit availability slots configured
            if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                $slots = collect([
                    (object) ['start_time' => '09:00:00', 'end_time' => '17:00:00']
                ]);
            } else {
                $slots = collect();
            }
        }

        // Existing confirmed appointments on target date
        $existingAppointments = Appointment::where('calendar_id', $calendar->id)
            ->whereIn('status', ['confirmed', 'rescheduled'])
            ->whereDate('start_at', $targetDate->format('Y-m-d'))
            ->get();

        // 2. Check Daily Maximum Bookings Cap
        if ($calendar->max_bookings_per_day && $existingAppointments->count() >= $calendar->max_bookings_per_day) {
            return [];
        }

        $duration = max(5, (int) ($calendar->duration_minutes ?: 30));
        $interval = max(5, (int) ($calendar->slot_interval_minutes ?: $duration));
        $preBuffer = max(0, (int) ($calendar->pre_buffer_minutes ?: 0));
        $postBuffer = max(0, (int) ($calendar->post_buffer_minutes ?: 0));

        $availableSlots = [];

        foreach ($slots as $slot) {
            $slotStart = Carbon::parse($targetDate->format('Y-m-d') . ' ' . $slot->start_time, $timezone);
            $slotEnd = Carbon::parse($targetDate->format('Y-m-d') . ' ' . $slot->end_time, $timezone);

            $current = $slotStart->copy();

            while ($current->copy()->addMinutes($duration)->lte($slotEnd)) {
                $candStart = $current->copy();
                $candEnd = $current->copy()->addMinutes($duration);

                // Candidate's full required window including pre and post buffers
                $candBufferedStart = $candStart->copy()->subMinutes($preBuffer);
                $candBufferedEnd = $candEnd->copy()->addMinutes($postBuffer);

                $hasConflict = false;

                // 1. Operating hours boundary check with pre/post buffer
                if ($candBufferedStart->lt($slotStart) || $candBufferedEnd->gt($slotEnd)) {
                    $hasConflict = true;
                }

                // 2. Existing appointments conflict check with pre/post buffer & group/class capacity
                if (! $hasConflict) {
                    $overlappingCount = 0;
                    $maxCap = max(1, (int) ($calendar->max_capacity ?: 1));

                    foreach ($existingAppointments as $app) {
                        $appBufferedStart = Carbon::parse($app->start_at)->subMinutes($preBuffer);
                        $appBufferedEnd = Carbon::parse($app->end_at)->addMinutes($postBuffer);

                        if ($candBufferedStart->lt($appBufferedEnd) && $candBufferedEnd->gt($appBufferedStart)) {
                            $overlappingCount++;
                        }
                    }

                    if ($overlappingCount >= $maxCap) {
                        $hasConflict = true;
                    }
                }

                // 3. Minimum notice boundary check for today / past dates
                if (! $hasConflict) {
                    $nowInTimezone = Carbon::now($timezone);
                    if ($candStart->lt($nowInTimezone)) {
                        $hasConflict = true;
                    } elseif ($candStart->isSameDay($nowInTimezone) && $candStart->lt($nowInTimezone->copy()->addHours($calendar->min_notice_hours))) {
                        $hasConflict = true;
                    }
                }

                if (! $hasConflict) {
                    $availableSlots[] = [
                        'time' => $candStart->format('H:i'),
                        'label' => $candStart->format('g:i A'),
                        'start_at' => $candStart->toIso8601String(),
                        'end_at' => $candEnd->toIso8601String(),
                    ];
                }

                $current->addMinutes($interval);
            }
        }

        // Apply "Look Busy" urgency engine if enabled
        if ($calendar->look_busy_percent > 0 && count($availableSlots) > 3) {
            $removeCount = (int) round(count($availableSlots) * ($calendar->look_busy_percent / 100));
            $availableSlots = array_slice($availableSlots, 0, count($availableSlots) - $removeCount);
        }

        return $availableSlots;
    }

    /**
     * Assign host staff member for Round-Robin calendars.
     */
    public function assignStaffMember(BookingCalendar $calendar): ?int
    {
        $members = CalendarTeamMember::where('calendar_id', $calendar->id)
            ->where('is_active', true)
            ->orderBy('priority', 'desc')
            ->get();

        if ($members->isEmpty()) {
            return null;
        }

        if ($calendar->round_robin_mode === 'equal_distribution') {
            // Pick team member with lowest total appointments
            $memberUserIds = $members->pluck('user_id')->toArray();
            $counts = Appointment::whereIn('assigned_user_id', $memberUserIds)
                ->whereIn('status', ['confirmed', 'completed'])
                ->selectRaw('assigned_user_id, count(*) as total')
                ->groupBy('assigned_user_id')
                ->pluck('total', 'assigned_user_id');

            $selectedUserId = $members->first()->user_id;
            $minCount = PHP_INT_MAX;

            foreach ($members as $m) {
                $c = $counts[$m->user_id] ?? 0;
                if ($c < $minCount) {
                    $minCount = $c;
                    $selectedUserId = $m->user_id;
                }
            }

            return $selectedUserId;
        }

        // Availability / priority mode: return top priority member
        return $members->first()->user_id;
    }
}
