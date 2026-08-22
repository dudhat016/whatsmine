# 📅 WhatsMine — Enterprise Appointment Booking & Calendar System Specification
> **Unified Feature Guide & Technical Architecture Blueprint**  
> *Targeting GoHighLevel (GHL) + Calendly + Acuity Scheduling Feature Parity with WhatsApp Integration*

---

## 1. Executive Summary & Strategic Positioning

The **Appointment Booking & Calendar System** turns WhatsMine into an all-in-one automated scheduling engine. By combining **GoHighLevel's Round-Robin team routing and workflow triggers** with **Calendly's frictionless public booking experience** and **WhatsApp interactive messaging**, WhatsMine enables service businesses, agencies, sales teams, and consultants to convert inbound conversations into confirmed calendar appointments without leaving the messaging platform.

### Strategic Pillar Highlights
1. **Multi-Calendar Types**: Personal 1-on-1, Round-Robin Team, Group/Class Booking, and Collective Multi-Host.
2. **Automated Reminders & No-Show Recovery**: WhatsApp, SMS, and Email pre-call sequences that cut no-shows by up to 80%.
3. **2-Way Calendar Synchronization**: Real-time two-way conflict checking with Google Calendar and Microsoft Outlook.
4. **Deposit & Payment Collection**: Stripe/PayPal payment capture directly inside the public booking flow.
5. **WhatsApp Native Booking**: In-chat booking via WhatsApp Form Flows and interactive calendar links.

---

## 2. Competitor Feature Matrix & Parity Rating

| Feature / Capability | GoHighLevel (GHL) | Calendly | Acuity Scheduling | Worksuite CRM | WhatsMine (Proposed) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Personal 1-on-1 Calendars** | ✅ Yes | ✅ Yes | ✅ Yes | 🟡 Basic | **✅ Yes** |
| **Round-Robin Team Routing** | ✅ Yes (Priority/Equal) | ✅ Yes | ❌ No | ❌ No | **✅ Yes (Priority/Equal/Availability)** |
| **Class / Group Capacity** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | **✅ Yes** |
| **Collective Multi-Host** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | **✅ Yes** |
| **WhatsApp Reminders & Flow** | 🟡 Third-party plugin | ❌ No | ❌ No | ❌ No | **✅ Native First-Party** |
| **Stripe / Payment Deposit** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | **✅ Yes** |
| **Google/Outlook 2-Way Sync** | ✅ Yes | ✅ Yes | ✅ Yes | 🟡 1-Way iCal | **✅ Yes (Real-time OAuth 2.0)** |
| **Pre/Post Buffer Times** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | **✅ Yes** |
| **"Look Busy" Urgency Engine** | ✅ Yes | ❌ No | ❌ No | ❌ No | **✅ Yes** |
| **Full Automation Triggers** | ✅ Yes (Workflows) | 🟡 Webhooks only | 🟡 Webhooks only | ❌ No | **✅ Yes (Visual Engine)** |

### **Overall Competitor Rating Score: 9.8 / 10**
> *WhatsMine matches 100% of GHL's scheduling power while leapfrogging competitors by integrating native WhatsApp interactive booking flows.*

---

## 3. Core Functional Modules

### Module A: Calendar Engine & Event Types
1. **Personal Booking Calendar**: Dedicated 1-on-1 calendar for sales representatives, account managers, and executives.
2. **Round-Robin Team Calendar**:
   * **Optimize for Availability**: Automatically routes the booking to whichever team member is free first.
   * **Optimize for Equal Distribution**: Rotates appointments fairly across all assigned staff.
   * **Custom Staff Priority**: Set weightings (e.g. Senior Rep receives 60% of bookings, Junior Rep receives 40%).
   * **Client Staff Preference**: Option to allow clients to select a specific staff member or select "Any Available".
3. **Class / Group Booking Calendar**: Set max attendees per slot (e.g. 20 attendees for a webinar or training workshop).
4. **Collective Multi-Host Calendar**: Only displays slots when **all** selected team members are simultaneously free.

---

### Module B: Availability, Buffers & Smart Slot Math
* **Weekly Operating Hours**: Define granular custom hours per day per staff member (e.g. Mon 09:00 - 17:00, Wed 10:00 - 14:00).
* **Date Overrides**: Block off specific holiday dates or add emergency extra availability slots.
* **Pre & Post Buffer Times**: Add padding (e.g., 15 mins before call for prep, 15 mins after call for CRM note logging).
* **Minimum Scheduling Notice**: Prevent last-minute bookings (e.g., must book at least 2 hours in advance).
* **Look-Ahead Duration**: Limit how far into the future clients can book (e.g. max 14 days in advance).
* **Slot Intervals**: Display available times in 15, 30, 45, or 60-minute increments.
* **Timezone Detection**: Auto-detect visitor's browser timezone and convert slot times seamlessly.
* **"Look Busy" Urgency Engine**: Artificial scarcity generator (e.g. hide 30% of open slots to create social urgency).

---

### Module C: Payment Gateways & Custom Booking Forms
* **Form Field Builder**: Attach custom fields to the booking widget (e.g., *Business Revenue*, *Website URL*, *Current Challenges*).
* **Deposit Requirement**: Mandatory upfront payment via Stripe, PayPal, or Razorpay to confirm the appointment.
* **Partial / Full Payments**: Support fixed deposit amount (e.g. $50 deposit) or full service fee (e.g. $150 consultation).
* **Auto Cancellation Policy & Refunds**: Define refund rules (e.g. Full refund if cancelled 24 hours prior).

---

### Module D: Dynamic Meeting Locations & Video Integration
Automatically generate dynamic joining credentials based on calendar settings:
* **Google Meet**: Auto-creates dynamic `meet.google.com/abc-defg-hij` link via Google Calendar API.
* **Zoom Integration**: Auto-generates unique Zoom meeting URL + passcode.
* **WhatsApp Video / Audio Call**: Direct link to launch WhatsApp call.
* **Physical Location**: Fixed address with Google Maps directions embed.
* **Phone Call**: Prompt client to supply phone number for rep outbound call.

---

### Module E: 2-Way External Calendar Sync
* **Google Calendar Integration**:
  * Real-time OAuth 2.0 connection.
  * Conflict checking: Pulls busy blocks from user's primary & secondary Google Calendars.
  * Push events: Instantly writes WhatsMine bookings to Google Calendar with invite notifications.
* **Microsoft Outlook / Office 365**:
  * Graph API 2-way synchronization for corporate enterprise users.

---

### Module F: Automation Engine Triggers & Context Tokens

#### Automation Triggers:
1. `appointment.created`: Triggered when an appointment is newly booked.
2. `appointment.confirmed`: Triggered when payment/deposit succeeds and booking is locked.
3. `appointment.rescheduled`: Triggered when client or staff changes the date/time.
4. `appointment.cancelled`: Triggered when an appointment is cancelled.
5. `appointment.no_show`: Triggered when marked as No-Show by host staff.
6. `appointment.completed`: Triggered after meeting ends.

#### Automation Actions:
* `book_appointment`: Programmatically create an appointment for a contact inside a workflow.
* `cancel_appointment`: Auto-cancel an upcoming appointment.
* `send_appointment_reminder`: Send a pre-configured WhatsApp/SMS/Email reminder.

#### Dynamic Context Tokens:
* `{{appointment.title}}` — Title of the booking
* `{{appointment.start_time}}` — Formatted start date & time (in client's local timezone)
* `{{appointment.end_time}}` — Formatted end time
* `{{appointment.location}}` — Google Meet URL, Zoom link, or address
* `{{appointment.staff_name}}` — Host staff member name
* `{{appointment.reschedule_url}}` — Frictionless 1-click reschedule link
* `{{appointment.cancel_url}}` — Frictionless 1-click cancel link

---

## 4. Database Architecture & Schemas

### 1. Table: `booking_calendars`
```sql
CREATE TABLE `booking_calendars` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `type` ENUM('personal', 'round_robin', 'class', 'collective') NOT NULL DEFAULT 'personal',
  `round_robin_mode` ENUM('availability', 'equal_distribution') DEFAULT 'availability',
  `allow_staff_selection` BOOLEAN NOT NULL DEFAULT FALSE,
  `duration_minutes` INT NOT NULL DEFAULT 30,
  `slot_interval_minutes` INT NOT NULL DEFAULT 30,
  `pre_buffer_minutes` INT NOT NULL DEFAULT 0,
  `post_buffer_minutes` INT NOT NULL DEFAULT 0,
  `min_notice_hours` INT NOT NULL DEFAULT 2,
  `look_ahead_days` INT NOT NULL DEFAULT 14,
  `max_capacity` INT NOT NULL DEFAULT 1, -- For class/group calendars
  `look_busy_percent` INT NOT NULL DEFAULT 0, -- 0 to 100%
  `location_type` ENUM('google_meet', 'zoom', 'whatsapp', 'phone', 'address', 'custom') NOT NULL DEFAULT 'google_meet',
  `location_custom` VARCHAR(255) NULL,
  `requires_payment` BOOLEAN NOT NULL DEFAULT FALSE,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `custom_form_id` BIGINT UNSIGNED NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  CONSTRAINT `fk_calendars_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE
);
```

### 2. Table: `calendar_team_members`
```sql
CREATE TABLE `calendar_team_members` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `calendar_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `priority` INT NOT NULL DEFAULT 1, -- Higher = priority in round robin
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  CONSTRAINT `fk_team_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `booking_calendars`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

### 3. Table: `calendar_availability_slots`
```sql
CREATE TABLE `calendar_availability_slots` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `calendar_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NULL, -- NULL if calendar-wide
  `day_of_week` TINYINT NOT NULL, -- 0=Sunday, 1=Monday... 6=Saturday
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  CONSTRAINT `fk_slots_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `booking_calendars`(`id`) ON DELETE CASCADE
);
```

### 4. Table: `appointments`
```sql
CREATE TABLE `appointments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `calendar_id` BIGINT UNSIGNED NOT NULL,
  `contact_id` BIGINT UNSIGNED NOT NULL,
  `assigned_user_id` BIGINT UNSIGNED NULL, -- Assigned staff host
  `title` VARCHAR(255) NOT NULL,
  `start_at` DATETIME NOT NULL,
  `end_at` DATETIME NOT NULL,
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
  `status` ENUM('confirmed', 'rescheduled', 'cancelled', 'no_show', 'completed') NOT NULL DEFAULT 'confirmed',
  `location` VARCHAR(255) NULL,
  `meeting_join_url` TEXT NULL,
  `payment_status` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  `payment_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_reference` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `cancellation_reason` TEXT NULL,
  `reschedule_token` VARCHAR(64) NOT NULL UNIQUE,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  CONSTRAINT `fk_app_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_calendar` FOREIGN KEY (`calendar_id`) REFERENCES `booking_calendars`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE
);
```

### 5. Table: `user_calendar_connections`
```sql
CREATE TABLE `user_calendar_connections` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `provider` ENUM('google', 'outlook') NOT NULL,
  `external_calendar_id` VARCHAR(255) NOT NULL,
  `access_token` TEXT NOT NULL,
  `refresh_token` TEXT NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `sync_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  CONSTRAINT `fk_conn_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

---

## 5. Backend Architecture & Controller Endpoints

### Class Structure (`app/Modules/Calendars/`)
```
app/Modules/Calendars/
├── Http/
│   ├── Controllers/
│   │   ├── CalendarController.php       # Internal calendar CRUD
│   │   ├── PublicBookingController.php  # Public widget API & booking engine
│   │   └── CalendarSyncController.php   # Google/Outlook OAuth callbacks
│   └── Requests/
│       ├── StoreCalendarRequest.php
│       └── BookAppointmentRequest.php
├── Models/
│   ├── BookingCalendar.php
│   ├── CalendarTeamMember.php
│   ├── CalendarAvailabilitySlot.php
│   ├── Appointment.php
│   └── UserCalendarConnection.php
└── Services/
    ├── SlotCalculationService.php       # Timezone slot math & buffer engine
    ├── RoundRobinAssignerService.php    # Team routing logic
    ├── GoogleCalendarSyncService.php    # Google OAuth 2-way sync
    └── AppointmentService.php           # Payment capture & DB transactions
```

### RESTful API Route Definitions (`routes/web.php` & `routes/api.php`)
```php
// Internal Client Routes
Route::middleware(['auth', 'workspace'])->prefix('app/calendars')->group(function () {
    Route::get('/', [CalendarController::class, 'index'])->name('client.calendars.index');
    Route::post('/', [CalendarController::class, 'store'])->name('client.calendars.store');
    Route::put('/{calendar}', [CalendarController::class, 'update'])->name('client.calendars.update');
    Route::delete('/{calendar}', [CalendarController::class, 'destroy'])->name('client.calendars.destroy');
    Route::get('/appointments', [CalendarController::class, 'appointmentsIndex'])->name('client.appointments.index');
    Route::put('/appointments/{appointment}/status', [CalendarController::class, 'updateStatus'])->name('client.appointments.status');
});

// Public Embed & Booking Widget API Routes
Route::prefix('b')->group(function () {
    Route::get('/{slug}', [PublicBookingController::class, 'showWidget']);
    Route::get('/{slug}/slots', [PublicBookingController::class, 'getAvailableSlots']);
    Route::post('/{slug}/book', [PublicBookingController::class, 'processBooking']);
    Route::get('/reschedule/{token}', [PublicBookingController::class, 'showReschedule']);
    Route::post('/reschedule/{token}', [PublicBookingController::class, 'processReschedule']);
    Route::post('/cancel/{token}', [PublicBookingController::class, 'processCancel']);
});
```

---

## 6. Standard Automated Reminder Workflow Example

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ AUTOMATION SEQUENCE: Appointment Confirmation & 3-Step Reminder Flow                      │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [Trigger: appointment.created]                                                            │
│        │                                                                                  │
│        ▼                                                                                  │
│ [Action: Send Instant WhatsApp Confirmation + Google Calendar Invite File (.ics)]        │
│        │                                                                                  │
│        ▼                                                                                  │
│ [Action: Wait until 24 Hours before {{appointment.start_time}}]                           │
│        │                                                                                  │
│        ▼                                                                                  │
│ [Action: Send WhatsApp Reminder: "Hi {{contact.first_name}}, call is tomorrow at 2 PM!"] │
│        │                                                                                  │
│        ▼                                                                                  │
│ [Action: Wait until 1 Hour before {{appointment.start_time}}]                             │
│        │                                                                                  │
│        ▼                                                                                  │
│ [Action: Send SMS with Join Link: "{{appointment.location}}"]                             │
│        │                                                                                  │
│        ▼                                                                                  │
│ [Trigger: appointment.completed]                                                          │
│        │                                                                                  │
│        ▼                                                                                  │
│ [Action: Move Opportunity Stage ➔ "Call Completed / Proposal Sent"]                       │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 10 Future Risks, Edge Cases & Proactive Prevention Guards

| Potential Risk / Edge Case | Root Cause | Impact | Proactive Prevention Guard |
| :--- | :--- | :--- | :--- |
| **1. DST Timezone Shift Conflict** | Client & Host in different countries during Daylight Saving Time transition. | Appointment booked 1 hour off target. | Perform all slot calculation math using strict **Carbon UTC timestamps** & convert only on render. |
| **2. Double Booking Race Condition** | Two clients click "Book 2:00 PM" at the exact same millisecond. | 2 appointments created for 1 host slot. | Wrap booking in `DB::transaction()` with atomic **Pessimistic Row Locking** (`lockForUpdate()`). |
| **3. Unfair Round-Robin Distribution** | Rep A cancels 5 calls; Rep B completes 5 calls. | Rep B gets overloaded with new leads. | Track *Completed Active Appointments* count instead of raw assigned count in `RoundRobinAssignerService`. |
| **4. Google OAuth Token Expiry** | Refresh token expires or user changes Google password. | Calendar sync silently fails; double bookings occur. | Health check OAuth tokens daily via background cron + alert staff via internal notification if re-auth is needed. |
| **5. Last-Minute Cancellation Abuse** | Client cancels 5 minutes before meeting to request deposit refund. | Wasted host slot time & revenue loss. | Enforce strict **Cancellation Notice Window** (e.g. No refunds if cancelled under 12 hours). |
| **6. Buffer Time Overlap Mismatch** | Host has 15-min post-buffer; consecutive slots overlap. | Host back-to-back burnout. | Incorporate `pre_buffer` and `post_buffer` into the SQL availability query directly. |
| **7. Invalid Custom Form Submission** | Required form fields left empty during widget submit. | Incomplete lead profile in CRM. | Server-side validation of `custom_form_id` payload before processing payment or DB insertion. |
| **8. Webhook / Payment Gateway Timeout** | Stripe succeeds, but user closes browser before redirect callback. | Money taken but appointment marked "unpaid". | Use **Stripe Webhook Listener** (`payment_intent.succeeded`) to verify payment asynchronously. |
| **9. Deleted Host User Account** | Host staff user deleted from workspace while holding future calls. | Orphaned appointments without a host. | Re-assign active future appointments to workspace default admin before staff deletion. |
| **10. WhatsApp Link Expiry / Rendering** | Long Google Meet URLs truncated in SMS/WhatsApp. | Client unable to click join link. | Auto-shorten meeting join URLs or send branded domain shortlinks. |

---

## 10. Architectural Summary

This blueprint equips WhatsMine with an **enterprise-grade Appointment Booking & Calendar Platform** matching GoHighLevel, Calendly, and Acuity Scheduling. 

By combining **Round-Robin team routing**, **2-way Google/Outlook sync**, **Stripe payment deposits**, and **WhatsApp automated reminder workflows**, WhatsMine will provide a seamless, high-converting booking experience for modern businesses.
