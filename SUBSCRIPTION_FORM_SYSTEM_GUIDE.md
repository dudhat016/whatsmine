# 📋 WhatsMine — Standalone Subscription & Lead Form System Specification

This document details the complete technical architecture, database schema, route structure, controller logic, Inertia React UI components, **Custom Field Builder Engine**, **Double Opt-in & OTP Verification System**, **Selective Form Automation Triggers**, CRM contact integration, and AI prompt blueprint for implementing a **Standalone Subscription & Lead Form Engine** in **WhatsMine**. 

This module operates **completely independently** of the Funnel Builder and WhatsApp Widget modules. It allows workspace clients to build, customize unlimited custom fields, configure **Double OTP Verification**, embed, and collect verified subscribers directly on any external HTML website, WordPress blog, or custom web application, while seamlessly feeding leads into WhatsMine CRM Contacts & Marketing Automations.

---

## 📖 Table of Contents
1. [System Overview & Business Value](#1-system-overview--business-value)
2. [System Architecture & Data Flow](#2-system-architecture--data-flow)
3. [Database Schema Specifications](#3-database-schema-specifications)
4. [Route Definitions](#4-route-definitions)
5. [Embed Modes & Multi-Channel Delivery](#5-embed-modes--multi-channel-delivery)
   - [Mode 1: iFrame Embed](#mode-1-iframe-embed)
   - [Mode 2: Popup Modal JS Snippet](#mode-2-popup-modal-js-snippet)
   - [Mode 3: Public REST API Endpoint](#mode-3-public-rest-api-endpoint)
   - [Mode 4: Standalone Hosted Page](#mode-4-standalone-hosted-page)
6. [Dynamic Custom Field Builder Engine](#6-dynamic-custom-field-builder-engine)
   - [Supported Custom Field Types](#supported-custom-field-types)
   - [Custom Fields JSON Schema](#custom-fields-json-schema)
   - [Drag-and-Drop Form Builder UI Specs](#drag-and-drop-form-builder-ui-specs)
7. [Double Opt-in & Double OTP Verification Engine](#7-double-opt-in--double-otp-verification-engine)
   - [Verification Modes (WhatsApp, Email, SMS)](#verification-modes-whatsapp-email-sms)
   - [Step-by-Step OTP Flow & Diagram](#step-by-step-otp-flow--diagram)
   - [OTP Expiration & Security Rules](#otp-expiration--security-rules)
8. [Selective Form Triggers in Marketing Automation Engine](#8-selective-form-triggers-in-marketing-automation-engine)
   - [Specific Form Selection Trigger](#specific-form-selection-trigger)
   - [Trigger Filter JSON Schema](#trigger-filter-json-schema)
   - [Competitor Matrix (GoHighLevel / ActiveCampaign / HubSpot Alignment)](#competitor-matrix-gohighlevel--activecampaign--hubspot-alignment)
9. [WhatsMine CRM & Custom Field Data Mapping](#9-whatsmine-crm--custom-field-data-mapping)
10. [Step-by-Step AI Prompt Blueprint](#10-step-by-step-ai-prompt-blueprint)

---

## 1. System Overview & Business Value

The **Standalone Subscription Form Module** enables WhatsMine workspace clients to:
- **Build Lead Capture Forms**: Create custom subscription forms with standard fields (Email, Name, WhatsApp Phone) + **Unlimited Custom Fields** (Text, Number, Date, Dropdown, Textarea, Radio, Checkboxes).
- **Double Opt-in & OTP Verification**: Enable a toggle for **Double Opt-in (Double OTP Verification)** via WhatsApp, Email, or SMS to ensure 100% verified real contacts and eliminate spam or fake submissions.
- **Embed Anywhere**: Embed forms on plain HTML sites, Webflow, WordPress, or React apps using `iframe`, JS Popups, or REST API.
- **Form-Specific Automation Triggers**: Select **which specific form** (e.g., *Contact Us Form* vs. *Newsletter Form*) triggers a particular marketing automation workflow, ensuring target actions run only when the exact designated form is submitted.
- **Unified CRM Synchronization**: Automatically create or update `Contact` records in the WhatsMine workspace CRM (`contacts` table), storing custom field values in `contacts.custom_fields` JSON once verified.
- **Auto-Tagging & Segmentation**: Assign specific tags (e.g., `Verified Lead`, `Newsletter`, `Ebook Lead`) to verified subscribers upon successful OTP entry.

---

## 2. System Architecture & Data Flow

```
[ Client Admin Portal ] ──> (Configures Form, Custom Fields, & Double OTP Toggle)
           │
           ▼
[ Database: subscription_forms ] ── (Stores fields, settings, & double_optin_enabled)
           │
  ┌────────┼───────────────────────────┬───────────────────────────┐
  ▼        ▼                           ▼                           ▼
[iFrame] [Popup Modal]           [Public REST API]         [Hosted Page]
(iframe)  (JS script)             (POST /subscribe/{slug}/api) (/subscribe/{slug})
  │        │                           │                           │
  └────────┴─────────────┬─────────────┴───────────────────────────┘
                         ▼
           [ PublicSubscriptionController ]
                         │
      ┌──────────────────┴──────────────────┐
      │ Is Double Opt-in (OTP) Enabled?     │
      └─────────┬───────────────────┬───────┘
                │ YES               │ NO
                ▼                   ▼
    [ Send 6-Digit OTP ]   [ Direct Verification ]
    [ Show OTP Step UI ]   [ Update Contact CRM ]
                │                   │
                ▼                   │
    [ Visitor Inputs OTP ]          │
    [ POST /verify-otp ]           │
                │                   │
                └─────────┬─────────┘
                          ▼
            [ Mark Contact Verified ]
                          │
                          ▼
   ┌─────────────────────────────────────────────────┐
   │ Automation Engine Event Evaluation              │
   │ (Matches Trigger: form_submitted & form_id = X) │
   └──────────────────────┬──────────────────────────┘
                          ▼
           [ Launches Form-Specific Workflow ]
           (e.g., "Contact Us" Workflow vs "Newsletter" Workflow)
```

---

## 3. Database Schema Specifications

### Table 1: `subscription_forms`
Stores form configuration, styling, dynamic custom field schemas, double opt-in settings, auto-tags, and post-submission behavior:

```sql
CREATE TABLE `subscription_forms` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `workspace_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,                 -- Internal reference name (e.g. "Footer Newsletter")
    `title` VARCHAR(255) NULL,                    -- Public headline (e.g. "Subscribe to our Newsletter")
    `slug` VARCHAR(255) UNIQUE NOT NULL,          -- Public unique URL slug (e.g. "newsletter-form-x8291a")
    `type` ENUM('embedded', 'popup', 'api') NOT NULL DEFAULT 'embedded',
    `description` TEXT NULL,                      -- Public subtitle / description text
    `fields` JSON NULL,                           -- Enabled standard fields: ["email", "first_name", "last_name", "phone_e164"]
    `settings` JSON NULL,                         -- Custom fields, auto-tags, theme color, button text, redirect URL
    `double_optin_enabled` BOOLEAN NOT NULL DEFAULT FALSE, -- Toggle for Double OTP Verification
    `optin_channel` ENUM('whatsapp', 'email', 'sms') NOT NULL DEFAULT 'whatsapp', -- Verification channel
    `gdpr_checkbox` BOOLEAN NOT NULL DEFAULT FALSE,
    `gdpr_text` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `submissions_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    `deleted_at` TIMESTAMP NULL,
    CONSTRAINT `fk_sf_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
    INDEX `idx_sf_workspace` (`workspace_id`),
    INDEX `idx_sf_slug` (`slug`),
    INDEX `idx_sf_active` (`is_active`)
);
```

### Table 2: `subscription_form_submissions`
Immutable audit log of all form submissions and OTP verification status:

```sql
CREATE TABLE `subscription_form_submissions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `workspace_id` BIGINT UNSIGNED NOT NULL,
    `form_id` BIGINT UNSIGNED NOT NULL,
    `contact_id` BIGINT UNSIGNED NULL,
    `submitted_data` JSON NOT NULL,               -- Contains standard + all custom field values
    `otp_code` VARCHAR(16) NULL,                  -- Encrypted or plain 6-digit OTP code (e.g. "849201")
    `otp_expires_at` TIMESTAMP NULL,              -- OTP expiration timestamp (5-10 minutes)
    `is_verified` BOOLEAN NOT NULL DEFAULT FALSE, -- True once OTP is correctly entered
    `verified_at` TIMESTAMP NULL,                 -- Verification completion timestamp
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `referrer_url` VARCHAR(2048) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    CONSTRAINT `fk_sfs_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sfs_form` FOREIGN KEY (`form_id`) REFERENCES `subscription_forms` (`id`) ON DELETE CASCADE
);
```

---

## 4. Route Definitions

### Authenticated Client Portal Routes (`routes/web.php`)
```php
Route::middleware(['auth', 'verified', 'workspace'])->prefix('client/forms')->name('client.forms.')->group(function () {
    Route::get('/', [SubscriptionFormController::class, 'index'])->name('index');
    Route::get('/create', [SubscriptionFormController::class, 'create'])->name('create');
    Route::post('/', [SubscriptionFormController::class, 'store'])->name('store');
    Route::get('/{form}', [SubscriptionFormController::class, 'show'])->name('show');
    Route::get('/{form}/edit', [SubscriptionFormController::class, 'edit'])->name('edit');
    Route::put('/{form}', [SubscriptionFormController::class, 'update'])->name('update');
    Route::delete('/{form}', [SubscriptionFormController::class, 'destroy'])->name('destroy');
});
```

### Public Unauthenticated Endpoints (`routes/web.php` & `routes/api.php`)
```php
// Public Web Views & Submissions
Route::get('/subscribe/{slug}', [PublicSubscriptionController::class, 'show'])->name('public.subscribe.show');
Route::post('/subscribe/{slug}', [PublicSubscriptionController::class, 'subscribe'])->name('public.subscribe.submit');

// OTP Verification Endpoints for Double Opt-in
Route::post('/subscribe/{slug}/resend-otp', [PublicSubscriptionController::class, 'resendOtp'])->name('public.subscribe.resend_otp');
Route::post('/subscribe/{slug}/verify-otp', [PublicSubscriptionController::class, 'verifyOtp'])->name('public.subscribe.verify_otp');

// Public REST API Endpoint (Exempt from CSRF, returns JSON)
Route::post('/subscribe/{slug}/api', [PublicSubscriptionController::class, 'apiSubscribe'])
    ->middleware(['cors'])
    ->name('public.subscribe.api');

Route::post('/subscribe/{slug}/api/verify-otp', [PublicSubscriptionController::class, 'apiVerifyOtp'])
    ->middleware(['cors'])
    ->name('public.subscribe.api_verify_otp');
```

---

## 5. Embed Modes & Multi-Channel Delivery

### Mode 1: iFrame Embed
```html
<iframe
  src="https://app.whatsmine.tech/subscribe/newsletter-x8291a"
  width="100%"
  height="550"
  frameborder="0"
  style="border:0; overflow:hidden;"
  scrolling="no">
</iframe>
```

### Mode 2: Popup Modal JS Snippet
```html
<!-- Trigger Button -->
<button type="button" data-whatsmine-popup="newsletter-x8291a" class="btn-subscribe">
  Subscribe Now
</button>

<!-- Popup Loader Script -->
<script src="https://app.whatsmine.tech/js/forms/popup.js" async></script>
```

### Mode 3: Public REST API Endpoint (with Double OTP support)
* **HTTP Method**: `POST`
* **URL**: `https://app.whatsmine.tech/subscribe/newsletter-x8291a/api`

**Response when `double_optin_enabled = true` (`202 Accepted`)**:
```json
{
  "status": "pending_verification",
  "message": "A 6-digit OTP code has been sent to your WhatsApp number / Email.",
  "submission_token": "sub_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "expires_in_seconds": 300
}
```

---

## 6. Dynamic Custom Field Builder Engine

Clients can build **custom input forms** with zero code using the dynamic custom field engine.

### Supported Custom Field Types

| Field Type | UI Control Rendered | Example Use Case |
|---|---|---|
| `text` | Single line text `<input type="text">` | Company Name, Job Title |
| `textarea` | Multiline text `<textarea>` | Project Brief, Message, Query |
| `number` | Numeric input `<input type="number">` | Age, Employee Count, Budget |
| `tel` | Phone input `<input type="tel">` | Secondary Phone, Office Landline |
| `date` | Date picker `<input type="date">` | Birthdate, Preferred Demo Date |
| `select` | Dropdown `<select><option>` | Industry, Department, Country |
| `multiselect` | Checkbox group | Products of Interest |
| `radio` | Radio button group | Preferred Contact Method |
| `checkbox` | Single checkbox toggle | Agree to Terms, Subscribe to Newsletter |

---

## 7. Double Opt-in & Double OTP Verification Engine

When **Double Opt-in** is enabled (`double_optin_enabled = true`), form submissions require the user to verify a 6-digit One-Time Password (OTP) before they are marked as a verified contact in the CRM.

### Verification Modes (`optin_channel`)
1. **WhatsApp OTP (`optin_channel = 'whatsapp'`)**: Sends 6-digit code via WhatsApp Cloud API to the visitor's `phone_e164`.
2. **Email OTP (`optin_channel = 'email'`)**: Sends 6-digit code via Mailpurse / SMTP email to the visitor's `email`.
3. **SMS OTP (`optin_channel = 'sms'`)**: Sends 6-digit code via SMS Gateway to the visitor's `phone_e164`.

---

## 8. Selective Form Triggers in Marketing Automation Engine

In **WhatsMine**, marketing automations (`app/Modules/Automation`) allow workspace clients to build visual workflow trees (e.g. *Send WhatsApp Welcome Message* $\rightarrow$ *Wait 24h* $\rightarrow$ *Send Follow-up Email*).

Clients can configure an automation to trigger **ONLY when a specific form is submitted** rather than triggering on every form.

### Specific Form Selection Trigger UI Specs

In the Visual Workflow Builder UI (`resources/js/Pages/Automation/Builder.jsx`), when a client adds a **"Form Submitted"** Trigger Node, they are presented with a **Form Selector Dropdown**:

```
┌─────────────────────────────────────────────────────────────┐
│  Automation Trigger Node: Form Submitted                   │
├─────────────────────────────────────────────────────────────┤
│  Select Trigger Mode:                                       │
│  ( ) Any Form Submitted                                     │
│  (*) Specific Form Submitted                                │
│                                                             │
│  Select Specific Form:                                      │
│  [ Contact Us Form (ID: 42)                         ▼ ]    │
│  ├── Newsletter Form (ID: 10)                               │
│  ├── Contact Us Form (ID: 42)  <-- Selected                 │
│  └── Lead Magnet Ebook Form (ID: 88)                        │
│                                                             │
│  Optional Custom Field Filters:                             │
│  If [ budget_range ] [ Equals ] [ $5,000+ ]                │
└─────────────────────────────────────────────────────────────┘
```

---

### Trigger Filter JSON Schema (`automations.trigger_filters`)

The selected form ID and optional custom field rules are saved in the automation's `trigger_filters` JSON column:

```json
{
  "trigger_type": "form_submitted",
  "trigger_filters": {
    "form_selection_mode": "specific",
    "target_form_id": 42,
    "target_form_slug": "contact-us-form-x9281a",
    "require_otp_verified": true,
    "field_filters": [
      {
        "field_key": "budget_range",
        "operator": "equals",
        "value": "$5,000+"
      }
    ]
  }
}
```

---

### Event Evaluation & Execution Logic in Backend

When `SubscriptionFormSubmitted` event is fired after form verification, the `AutomationEventEvaluator` checks matching automations:

```php
namespace App\Modules\Automation\Listeners;

use App\Modules\Whatsapp\Events\SubscriptionFormSubmitted;

class HandleSubscriptionFormSubmitted
{
    public function handle(SubscriptionFormSubmitted $event): void
    {
        $form    = $event->form;
        $contact = $event->contact;
        $data    = $event->submittedData;

        // Query active automations in workspace configured for form_submitted
        $automations = Automation::where('workspace_id', $form->workspace_id)
            ->where('is_active', true)
            ->where('trigger_type', 'form_submitted')
            ->get();

        foreach ($automations as $automation) {
            $filters = $automation->trigger_filters ?? [];
            $selectionMode = $filters['form_selection_mode'] ?? 'any';
            $targetFormId  = $filters['target_form_id'] ?? null;

            // 1. Verify if form matches trigger rule
            if ($selectionMode === 'specific' && (int)$targetFormId !== (int)$form->id) {
                continue; // Skip this automation, form does not match!
            }

            // 2. Verify optional field filters (e.g. budget > $5000)
            if (!empty($filters['field_filters'])) {
                if (!$this->matchesFieldFilters($filters['field_filters'], $data)) {
                    continue;
                }
            }

            // 3. Match successful! Dispatch workflow engine for this contact
            dispatch(new ExecuteAutomationWorkflowJob($automation, $contact, $data));
        }
    }
}
```

---

### Competitor Feature Comparison Matrix

| Feature Capability | GoHighLevel (GHL) | ActiveCampaign | HubSpot CRM | WhatsMine (Our System) |
|---|---|---|---|---|
| **Specific Form Trigger Selection** | ✅ Yes (`Form is...`) | ✅ Yes (`Submits form...`) | ✅ Yes (`Form submission`) | ✅ **Yes (`Specific Form Selector`)** |
| **Any Form Trigger Option** | ✅ Yes (`Any Form`) | ✅ Yes (`Any Form`) | ✅ Yes (`Any Form`) | ✅ **Yes (`Any Form`)** |
| **Double OTP Verification (WhatsApp/SMS)** | ❌ Plugin needed | ❌ Email only | ❌ Add-on needed | ✅ **Built-in Native (WhatsApp, Email, SMS)** |
| **Custom Field Value Filter** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **Yes (Field Value Rules)** |
| **Multi-Channel Workflow Output** | ✅ SMS, Email | ❌ Email focused | ❌ Email/CRM | ✅ **WhatsApp, Email, SMS & Unified Inbox** |

---

## 9. WhatsMine CRM & Custom Field Data Mapping

Below is the PHP controller logic handling initial submission, OTP generation, and OTP verification:

```php
// Step A: Process Form Submission & Send OTP (if enabled)
public function processSubmission(SubscriptionForm $form, array $validatedData, Request $request)
{
    $otpCode = sprintf("%06d", mt_rand(100000, 999999));
    $expiresAt = now()->addMinutes(5);

    // Create Submission Record
    $submission = SubscriptionFormSubmission::create([
        'workspace_id'   => $form->workspace_id,
        'form_id'        => $form->id,
        'submitted_data' => $validatedData,
        'otp_code'       => $form->double_optin_enabled ? $otpCode : null,
        'otp_expires_at' => $form->double_optin_enabled ? $expiresAt : null,
        'is_verified'    => !$form->double_optin_enabled, // Auto-verify if Double Opt-in is disabled
        'ip_address'     => $request->ip(),
        'user_agent'     => $request->userAgent(),
        'referrer_url'   => $request->header('referer'),
    ]);

    if ($form->double_optin_enabled) {
        // Send OTP via configured channel (WhatsApp / Email / SMS)
        $this->otpService->sendOtp($form->optin_channel, $validatedData, $otpCode);

        return response()->json([
            'status'         => 'pending_verification',
            'submission_id'  => $submission->id,
            'message'        => 'Verification OTP code sent. Please enter it to confirm subscription.'
        ]);
    }

    // Single Opt-in: Directly confirm contact & trigger automations
    return $this->finalizeVerifiedContact($form, $submission);
}

// Step B: Verify OTP Code Endpoint
public function verifyOtp(SubscriptionForm $form, Request $request)
{
    $request->validate([
        'submission_id' => 'required|integer',
        'otp_code'      => 'required|string|size:6',
    ]);

    $submission = SubscriptionFormSubmission::where('id', $request->submission_id)
        ->where('form_id', $form->id)
        ->firstOrFail();

    if ($submission->is_verified) {
        return response()->json(['status' => 'success', 'message' => 'Already verified']);
    }

    if ($submission->otp_expires_at->isPast()) {
        return response()->json(['status' => 'error', 'message' => 'OTP has expired. Please request a new code.'], 422);
    }

    if ($submission->otp_code !== $request->otp_code) {
        return response()->json(['status' => 'error', 'message' => 'Invalid OTP code. Please check and try again.'], 422);
    }

    // Mark Submission Verified
    $submission->update([
        'is_verified' => true,
        'verified_at' => now(),
    ]);

    return $this->finalizeVerifiedContact($form, $submission);
}

// Finalize Contact Creation in CRM & Trigger Automations
protected function finalizeVerifiedContact(SubscriptionForm $form, SubscriptionFormSubmission $submission)
{
    $data = $submission->submitted_data;

    $contact = Contact::updateOrCreate(
        [
            'workspace_id' => $form->workspace_id,
            'email'        => $data['email'] ?? null,
        ],
        [
            'first_name'      => $data['first_name'] ?? null,
            'last_name'       => $data['last_name'] ?? null,
            'phone_e164'      => $data['phone_e164'] ?? null,
            'opt_in_email'    => true,
            'opt_in_whatsapp' => !empty($data['phone_e164']),
            'source'          => "Form: {$form->name}",
            'custom_fields'   => array_merge($contact->custom_fields ?? [], $data['custom_fields'] ?? []),
        ]
    );

    $submission->update(['contact_id' => $contact->id]);
    $form->increment('submissions_count');

    // Attach Auto-Tags
    $autoTags = $form->settings['auto_tags'] ?? [];
    foreach ($autoTags as $tagName) {
        $tag = ContactTag::firstOrCreate(['workspace_id' => $form->workspace_id, 'name' => trim($tagName)]);
        $contact->tags()->syncWithoutDetaching([$tag->id]);
    }

    // Trigger Multi-Channel Automations Engine (Evaluates Specific Form Trigger Filters)
    event(new SubscriptionFormSubmitted($form, $contact, $data));

    return response()->json([
        'status'  => 'success',
        'message' => $form->settings['success_message'] ?? 'Thank you for verifying your subscription!',
        'redirect_url' => $form->settings['redirect_url'] ?? null
    ]);
}
```

---

## 10. Step-by-Step AI Prompt Blueprint

Copy and paste the prompt below into an AI coding assistant to build this standalone form system with Selective Automation Triggers:

```markdown
### TASK PROMPT: Build Standalone Subscription Form System with Selective Automation Triggers

Please implement a complete Standalone Subscription & Custom Field Form System with Selective Automation Triggers in this repository:

1. **Database Schema & Models**:
   - Create table `subscription_forms`: `id`, `workspace_id`, `name`, `title`, `slug` (unique), `type` ('embedded', 'popup', 'api'), `fields` (json array), `settings` (json array containing custom_fields, auto_tags, redirect_url, success_message, theme_color, button_text), `double_optin_enabled` (boolean, default false), `optin_channel` ('whatsapp', 'email', 'sms'), `gdpr_checkbox` (boolean), `gdpr_text` (text), `is_active` (boolean), `submissions_count` (integer), timestamps.
   - Create table `subscription_form_submissions`: `id`, `workspace_id`, `form_id`, `contact_id`, `submitted_data` (json), `otp_code` (string), `otp_expires_at` (timestamp), `is_verified` (boolean), `verified_at` (timestamp), `ip_address`, `user_agent`, `referrer_url`, timestamps.

2. **Selective Form Automation Trigger System**:
   - In `app/Modules/Automation`, support trigger `form_submitted` with filter schema `trigger_filters: { form_selection_mode: "specific"|"any", target_form_id: 42, field_filters: [...] }`.
   - In event listener `HandleSubscriptionFormSubmitted`, match incoming `form_id` against active automations so that ONLY automations configured for that specific form run!

3. **Double Opt-in & OTP Verification**:
   - When `double_optin_enabled = true`: Generate 6-digit OTP, send via chosen `optin_channel` (WhatsApp API / Email / SMS), and transition form UI to OTP verification screen.
   - Create `POST /subscribe/{slug}/verify-otp` endpoint to validate 6-digit OTP input.
   - Once verified, set `is_verified = true`, upsert `Contact` in CRM (`contacts` table), merge `custom_fields` JSON, attach tags, and trigger `SubscriptionFormSubmitted` event for marketing automations.

4. **Custom Fields & UI (Inertia React)**:
   - Form Builder UI with toggle for Double Opt-in and channel selection.
   - Custom Field Adder (`text`, `textarea`, `number`, `tel`, `date`, `select`, `radio`, `checkbox`).
   - Copyable Embed Snippets (iFrame, Popup JS, REST API).
```
