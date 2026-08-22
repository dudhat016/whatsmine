# ⏱️ Calendar Time Settings & Dynamic Slot Math Guide
> **Comprehensive Operational Blueprint & Technical Manual**  
> *Understanding how Meeting Duration, Slot Intervals, Pre/Post Buffers, Minimum Notice, and Operating Hours calculate available slots.*

---

## 1. Overview of Calendar Time Settings

When a visitor opens a WhatsMine public booking widget (`/b/{slug}`), the booking engine dynamically calculates available time slots by evaluating 6 core time parameters against existing appointments and host availability.

```
       [ PRE-BUFFER ]   +   [ MEETING DURATION ]   +   [ POST-BUFFER ]
       (e.g., 10 Mins)          (e.g., 30 Mins)          (e.g., 10 Mins)
  |-----------------------|------------------------|-----------------------|
  8:50 AM                 9:00 AM                  9:30 AM                 9:40 AM
```

---

## 2. Parameter Reference & Configuration

| Parameter | Database Column | Description | Example Value |
| :--- | :--- | :--- | :--- |
| **Meeting Duration** | `duration_minutes` | The actual length of the meeting call. | `30 Minutes` |
| **Slot Interval** | `slot_interval_minutes` | The step spacing between available start times on the picker grid. | `30 Minutes` |
| **Pre-Buffer Padding** | `pre_buffer_minutes` | Mandatory prep time reserved **before** the call (hidden from client). | `10 Minutes` |
| **Post-Buffer Padding** | `post_buffer_minutes` | Mandatory wrap-up / note-taking time **after** the call (hidden from client). | `10 Minutes` |
| **Minimum Notice** | `min_notice_hours` | Minimum lead time required before a booking can occur (prevents surprise calls). | `2 Hours` |
| **Operating Hours** | `calendar_availability_slots` | Active start & end times per day of the week (e.g. Mon–Fri 09:00 to 17:00). | `09:00 – 17:00` |

---

## 3. How Each Setting Works (With Visual Timelines)

### 3.1 Meeting Duration vs. Slot Interval

* **Meeting Duration (`duration_minutes`)**: Controls how long the appointment will last once booked.
* **Slot Interval (`slot_interval_minutes`)**: Controls the grid spacing of available start times shown on the booking UI.

#### Example Scenario:
* **Operating Hours**: `09:00 AM – 12:00 PM`
* **Duration**: `30 Mins`

| Slot Interval | Generated Start Time Grid Options |
| :---: | :--- |
| **15 Minutes** | `9:00 AM`, `9:15 AM`, `9:30 AM`, `9:45 AM`, `10:00 AM`, `10:15 AM`, `10:30 AM` ... |
| **30 Minutes** | `9:00 AM`, `9:30 AM`, `10:00 AM`, `10:30 AM`, `11:00 AM`, `11:30 AM` |
| **60 Minutes** | `9:00 AM`, `10:00 AM`, `11:00 AM` |

---

### 3.2 Pre-Buffer & Post-Buffer Padding

Buffer padding reserves quiet focus time for staff before and after meetings.

#### Formula for Total Blocked Host Time:
$$\text{Total Host Blocked Time} = \text{Pre-Buffer} + \text{Duration} + \text{Post-Buffer}$$

#### Example:
* **Meeting Duration**: `30 Mins`
* **Pre-Buffer**: `10 Mins`
* **Post-Buffer**: `10 Mins`
* **Total Blocked Window**: `10 + 30 + 10 = 50 Minutes`

```
 9:50 AM        10:00 AM                    10:30 AM        10:40 AM
    |--------------|---------------------------|---------------|
      PRE-BUFFER          30-MIN MEETING          POST-BUFFER
      (Prep Time)       (Host & Lead Call)       (Notes / Break)
```

#### Important Boundary & Collision Rules:

1. **Opening Hours Boundary Rule**:
   * If operating hours open at `09:00 AM`, a slot at `09:00 AM` requires a pre-buffer starting at `08:50 AM`.
   * Because `08:50 AM` is before opening hours, **`09:00 AM` is automatically hidden**, and the first available slot becomes **`09:10 AM`** or **`09:30 AM`**.

2. **Existing Booking Overlap Rule**:
   * If a booking exists from `10:00 AM to 10:30 AM` (blocking `09:50 AM – 10:40 AM`):
   * A candidate slot at `10:30 AM` (requiring `10:20 AM – 11:10 AM`) overlaps with the post-buffer (`10:40 AM`) and is **filtered out**.
   * The next valid candidate slot starts at **`10:50 AM`** or **`11:00 AM`**.

---

### 3.3 Minimum Scheduling Notice (`min_notice_hours`)

Prevents visitors from booking appointments immediately or with insufficient notice.

#### Example:
* **Current Time**: `2:00 PM`
* **Minimum Notice**: `2 Hours`
* **Notice Cutoff Boundary**: `2:00 PM + 2 Hours = 4:00 PM`

#### Result:
* Any available slots **before 4:00 PM** today are automatically hidden.
* Slots starting at **4:00 PM or later** today (and all slots on future dates) remain visible.

---

### 3.4 Operating Hours & Days of Week

* **Active Days**: Only days checked as **Active** in the availability settings generate time slots.
* **Closed / Inactive Days**: If a day (e.g. Sunday) is toggled off, the system returns `0` available slots for that date.

---

### 3.5 Timezone Conversion & Multi-Region Scheduling

Timezone synchronization ensures that host staff and international leads see meeting times in their respective local timezones without confusion.

```
  [ HOST TIMEZONE ]             [ DATABASE STORAGE ]            [ LEAD / VISITOR TIMEZONE ]
  e.g., America/New_York         Stored as UTC Canonical        e.g., Europe/London
  09:00 AM EDT           --->    13:00 UTC               --->   02:00 PM BST
```

#### How Timezone Conversion Works Step-by-Step:

1. **Host Operating Hours (Host Timezone)**:
   * Host defines operating hours in their local timezone (e.g., `09:00 AM to 05:00 PM` in `America/New_York` / EST).
2. **Browser Auto-Detection (Lead Timezone)**:
   * When a lead opens the booking widget, JavaScript auto-detects their timezone using `Intl.DateTimeFormat().resolvedOptions().timeZone` (e.g., `Europe/London`).
3. **API Real-Time Shift**:
   * The backend converts the host's 9:00 AM EST slot (`13:00 UTC`) into the lead's local time (`02:00 PM BST`).
4. **Database Canonical Standard**:
   * All confirmed appointments are saved in `appointments` table as UTC timestamps (`start_at` & `end_at`).
5. **Calendar Invites & Reminders**:
   * Confirmation emails, WhatsApp messages, and Google Calendar `.ics` invites automatically adapt to the recipient's timezone.

---

### 3.6 Free vs. Paid (Deposit) Booking Workflows

Calendars can be configured for either **Free Instant Booking** or **Paid Deposit Collection** depending on business requirements.

```
+-----------------------------------------------------------------------------------+
|                            PUBLIC BOOKING FLOW                                    |
+-----------------------------------------------------------------------------------+
                                         |
                       Is Payment Required (`requires_payment`)?
                                         |
                 +-----------------------+-----------------------+
                 |                                               |
             [ NO ]                                           [ YES ]
                 |                                               |
  1. Pick Date & Time Slot                         1. Pick Date & Time Slot
  2. Fill Contact Details                          2. Fill Contact Details
  3. Click "Confirm Booking"                       3. View Deposit Amount ($50 USD)
                 |                                 4. Complete Stripe / Card Payment
                 v                                               |
   Status: CONFIRMED (Instant)                                    v
   Automations: Triggered                            Status: CONFIRMED (Paid)
                                                     Automations: Triggered + Receipt
```

#### Workflow Comparison Matrix:

| Feature / Step | 🎁 Free Booking (`requires_payment = false`) | 💳 Paid Deposit Booking (`requires_payment = true`) |
| :--- | :--- | :--- |
| **Deposit Amount** | `$0.00` | Fixed amount set by host (e.g., `$50.00 USD`) |
| **Payment Gateway** | None required | Integrated Stripe / Card Checkout |
| **Slot Hold** | Immediate lock upon form submission | Temporary 10-minute hold until payment completes |
| **Initial Status** | `confirmed` | `pending_payment` $\rightarrow$ `confirmed` |
| **Best Used For** | Free discovery calls, demo requests, internal staff calls | Paid consultations, premium coaching sessions, deposit-backed appointments |

---

### 3.7 What Happens Under the Hood When "Confirm Appointment" Is Clicked?

When a lead submits the booking form or completes payment, 7 automated backend operations run in sequence:

```
  [ 1. CONTACT UPSERT ]  --->  [ 2. HOST STAFF ASSIGNMENT ]  --->  [ 3. APPOINTMENT CREATED ]
  Match Email/Phone            Round-Robin / Preference            Save to DB (status: confirmed)
           |                                                                 |
           v                                                                 v
  [ 6. AUTOMATION TRIGGERS ] <-- [ 5. DYNAMIC MEET LINK ]     <--  [ 4. RECURRING SERIES GENERATION ]
  WhatsApp + Email Sequences     Google Meet / Zoom API            If enabled (Daily/Weekly/Monthly)
           |
           v
  [ 7. CONFIRMATION UI ]
  Display Success Screen
```

#### Detailed Execution Sequence:

1. **Contact Creation / CRM Upsert**:
   * System checks if the lead's email or phone number exists in CRM (`App\Modules\Shared\Models\Contact`).
   * Updates existing contact profile or creates a brand new contact.

2. **Host Staff Assignment (Round-Robin Engine)**:
   * For team calendars, evaluates host staff availability and assigns the call based on configured policy (*Equal Distribution* or *Priority Weighting*).

3. **Database Appointment Creation**:
   * Creates a primary record in `appointments` table with `status = 'confirmed'`, `start_at`, `end_at`, `calendar_id`, `contact_id`, and `assigned_user_id`.

4. **Recurring Series Auto-Generation** (If enabled):
   * If `is_recurring = true`, automatically calculates future session dates (`daily`, `weekly`, or `monthly`) and creates linked child appointments (`#2/4`, `#3/4`, etc.).

5. **Dynamic Video Link Generation**:
   * Calls Google Calendar API / Zoom API to generate a unique meeting URL (e.g. `meet.google.com/abc-defg-hij`) and attaches it to the appointment.

6. **Automation Engine Triggers & Reminders**:
   * Fires the `appointment.created` event in the visual Workflow Automation Engine.
   * Sends instant WhatsApp confirmation message with join link + schedules pre-call reminder workflows (e.g., 24 hours & 1 hour prior).

7. **Confirmation Screen Rendered**:
   * Public widget transitions to a clean confirmation screen displaying appointment details, host name, date, time, and Google Calendar add-to-calendar buttons.

---

### 3.8 The Role of "Automations" in Appointment Booking

The **Visual Automation Engine** acts as the automated workforce behind the calendar system. It connects appointments with CRM pipelines, WhatsApp messaging, staff notifications, and post-call follow-ups.

```
                   +-----------------------------------------------+
                   |              APPOINTMENT EVENT                |
                   | (Booked / Confirmed / Rescheduled / Cancelled) |
                   +-----------------------------------------------+
                                           |
       +-------------------+---------------+-------------------+
       |                   |               |                   |
       v                   v               v                   v
[ 1. NO-SHOW RECOVERY ] [ 2. PRE-CALL ] [ 3. CRM PIPELINE ] [ 4. TEAM NOTIFY ]
 WhatsApp 24h & 1h      WhatsApp & SMS  Update Stage to     Notify Host Staff
 Pre-Call Reminders     Nurture Flow    "Scheduled"         via WhatsApp/Slack
```

#### Key Roles & Capabilities:

1. **Pre-Call Reminder Sequences (Cuts No-Shows by up to 80%)**:
   * **24 Hours Before Call**: Automated WhatsApp/Email reminder: *"Hi [First Name], reminder for your discovery call tomorrow at [Time] with [Host Name]! Join link: [Google Meet Link]"*
   * **1 Hour Before Call**: Urgent WhatsApp notification with 1-tap join button.

2. **Lead CRM & Sales Pipeline Automation**:
   * Automatically creates or updates an Opportunity deal in your Sales Pipeline under the **"Appointment Scheduled"** stage.
   * Attaches tags to the contact (e.g., `booked-call`, `high-intent`).

3. **No-Show & Reschedule Recovery**:
   * If a host staff marks an appointment status as `no_show`:
     * Automation triggers a recovery sequence: *"Sorry we missed you! Click here to pick a new date/time: [Reschedule Link]"*.
   * If status changes to `cancelled`, updates Opportunity stage to **"Lost"**.

4. **Post-Call Follow-ups & Review Requests**:
   * **30 Mins After Call Completes**: Automatically dispatches a feedback survey, proposal document, or review request link via WhatsApp.

5. **Internal Staff & Management Alerts**:
   * Sends instant WhatsApp/Email notification to the assigned host staff member whenever a new appointment is booked.

---

## 4. Competitor Gap Analysis & Feature Comparison Matrix

Comparing WhatsMine against industry benchmarks (**GoHighLevel**, **Calendly**, **Acuity Scheduling**, **ChiliPiper**):

| Feature / Setting Category | Competitor Standard (GHL / Calendly) | WhatsMine Status | Priority Level |
| :--- | :--- | :--- | :---: |
| **1. Custom Booking Form Questions** | Attach custom text fields, dropdowns, & checkboxes per calendar (e.g. *Company Size*, *Budget*). | Currently collects standard Name, Email, Phone. | 🔴 **High** |
| **2. Date Overrides (Holiday Blocking)** | Block out specific dates (e.g. Dec 25) or add extra hours on a specific date. | Uses weekly recurring schedule (Mon–Fri). | 🔴 **High** |
| **3. Max Bookings Limit (Cap Per Day/Week)** | Limit max meetings per day (e.g. max 4 calls/day) to prevent staff burnout. | Unlimited bookings up to available hours. | 🟡 **Medium** |
| **4. Max Future Booking Window** | Limit how far into future leads can book (e.g. max 14 or 30 days in advance). | Unlimited future date selection. | 🟡 **Medium** |
| **5. Custom Redirect URL After Booking** | Redirect leads to custom Thank You page (e.g., `mycompany.com/thank-you`). | Shows inline confirmation screen on widget. | 🟡 **Medium** |
| **6. Group / Class Capacity** | Allow multiple leads (e.g. 10 or 20 seats) to book the exact same slot for webinars. | 1 lead per slot. | 🟢 **Enhancement** |
| **7. Collective Multi-Host Calling** | Only show slots when BOTH Sales Rep + Tech Specialist are free simultaneously. | Single host or Round-Robin host. | 🟢 **Enhancement** |
| **8. Real-time Google/Outlook 2-Way Busy Sync** | Pull busy blocks from personal Google Calendar so personal events block booking slots. | Google Meet link generation implemented. | 🟢 **Enhancement** |

---

## 5. Top 5 Recommended Enhancement Roadmap

### 1. Custom Booking Form Questions (GHL & Calendly Parity)
* Allows calendar owners to attach custom qualifying questions to the booking widget (*What is your monthly budget?*, *How many team members do you have?*).

### 2. Date Overrides & Holiday Block-outs (Calendly Parity)
* Click specific calendar dates (*Dec 25*, *Jan 1*, *Vacation Days*) to mark them as `Unavailable` without changing standard weekly operating hours.

### 3. Daily / Weekly Maximum Booking Cap (GHL Parity)
* Set `max_bookings_per_day = 4`. Once 4 appointments are booked for a day, remaining slots on that date automatically hide to prevent meeting fatigue.

### 4. Custom Redirect URL After Booking (GHL & Calendly Parity)
* Set a custom Thank You page URL (`https://myagency.com/thank-you?lead_id={id}`). Upon booking, the lead is redirected automatically.

### 5. Maximum Future Look-Ahead Window (Calendly Parity)
* Restrict booking calendar to max `14 Days` or `30 Days` into the future to ensure high show-up rates.


## 6. Complete End-to-End Example Matrix

### Scenario Parameters:
* **Operating Hours**: Mon–Fri `09:00 AM – 05:00 PM` (09:00 to 17:00)
* **Duration**: `30 Mins`
* **Interval**: `30 Mins`
* **Pre-Buffer**: `10 Mins`
* **Post-Buffer**: `10 Mins`
* **Min Notice**: `2 Hours`

### Day Evaluation for Wednesday (Future Date, No Existing Bookings):

```
Time Slot Candidate    Required Buffer Window    Within Opening Hours?    Status
-------------------    ----------------------    ---------------------    ------
09:00 AM               08:50 AM - 09:40 AM       NO (08:50 < 09:00)       ❌ Hidden
09:30 AM               09:20 AM - 10:10 AM       YES                      ✅ Available
10:00 AM               09:50 AM - 10:40 AM       YES                      ✅ Available
10:30 AM               10:20 AM - 11:10 AM       YES                      ✅ Available
11:00 AM               10:50 AM - 11:40 AM       YES                      ✅ Available
...                    ...                       ...                      ...
04:00 PM               03:50 PM - 04:40 PM       YES                      ✅ Available
04:30 PM               04:20 PM - 05:10 PM       NO (05:10 > 17:00)       ❌ Hidden
```

---

## 5. Frequently Asked Questions (FAQ)

### Q1: Why are morning slots missing on today's date?
> **Answer**: For today's date, slots in the past and slots within the **Minimum Notice Window** (e.g. within 2 hours of current time) are intentionally hidden. Selecting tomorrow or any future date will display the full schedule.

### Q2: Why doesn't 09:00 AM show up when my operating hours start at 09:00 AM?
> **Answer**: If you have a **Pre-Buffer** configured (e.g., 10 minutes), a 9:00 AM appointment requires your host to be available starting at 8:50 AM. Because 8:50 AM is outside operating hours, 9:00 AM is omitted. To show 9:00 AM, adjust operating hours to start at 8:50 AM or set Pre-Buffer to 0.

### Q3: How do buffer times affect Round-Robin team calendars?
> **Answer**: In Round-Robin calendars, buffer times are calculated per staff member. If Host A is busy with a buffer, the system will route the slot to Host B if Host B's buffer window is clear.
