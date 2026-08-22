# WhatsMine — External HTML Form Builder, Webhook Embed & Marketing Automation Engine Specification

This document provides a comprehensive technical architecture blueprint, database schema, API contracts, integration methods, and automation workflow execution pipeline for embedding **Subscription & Lead Capture Forms** on third-party HTML/WordPress/Webflow websites and connecting them directly to **WhatsMine Marketing & Automation Workflows**.

---

## 1. Executive Summary & Core Objective

Clients running external websites (built with custom HTML, WordPress, Webflow, Shopify, etc.) often have multiple forms (e.g., *Newsletter Subscription*, *Contact Us*, *Free Ebook Download*).

This module enables clients to:
1. **Create & Customize Forms** inside WhatsMine or use their existing HTML forms.
2. **Embed Forms** on any external website via 1-line JS snippet, native HTML `<form action="...">`, or API webhooks.
3. **Automatically Capture Leads** into WhatsMine Unified CRM Contacts database.
4. **Trigger Instant Automations**: Launch multi-channel automated campaigns (WhatsApp, Email, SMS) immediately upon form submission.

---

## 2. Technical Architecture & Integration Methods

```
+-----------------------------------------------------------------------------------------+
|                                  External Website                                       |
|  (Custom HTML / WordPress / Webflow / Shopify)                                          |
|                                                                                         |
|  [ Form 1: Newsletter ]       [ Form 2: Contact Us ]        [ Form 3: Lead Magnet ]     |
|                                                                                         |
|  Submits via:                                                                           |
|  - Method A: <script src="https://app.whatsmine.tech/forms/embed/KEY.js"></script>     |
|  - Method B: <form action="https://app.whatsmine.tech/api/v1/public/forms/KEY/submit"> |
|  - Method C: Inbound Webhook API (JSON POST)                                            |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v (HTTP POST Data)
+-----------------------------------------------------------------------------------------+
|                                WhatsMine Core Platform                                  |
|                                                                                         |
|  1. Public API Controller (`PublicFormSubmissionController.php`)                       |
|     - Validates domain whitelist & security tokens                                      |
|     - Upserts Contact in `contacts` table (Workspace CRM)                              |
|     - Applies Tags (e.g. "Form: Newsletter", "Source: External HTML")                  |
|     - Stores submission audit log in `external_form_submissions` table                 |
|                                                                                         |
|  2. Event Dispatcher (`ExternalFormSubmitted` Event)                                    |
|                                                                                         |
|  3. Automation Engine (`app/Modules/Automation`)                                        |
|     - Executes visual workflow tree                                                     |
|     - Action A: Send WhatsApp Welcome Template via Meta Cloud API                       |
|     - Action B: Send Confirmation Email via Broadcasting Module                         |
|     - Action C: Schedule 24h Drip Follow-up                                             |
|     - Action D: Assign Conversation to Sales Representative in Unified Inbox            |
+-----------------------------------------------------------------------------------------+
```

---

## 3. The 3 Integration Methods Explained

### Method A: Embedded JavaScript Snippet (Automated UI Form)
* **Best for**: Non-technical users wanting pre-styled responsive forms.
* **Embed Code**:
  ```html
  <div id="whatsmine-form-FORM_KEY"></div>
  <script src="https://app.whatsmine.tech/forms/embed/FORM_KEY.js" async></script>
  ```
* **Mechanism**: The JS script fetches form structure (`fields_json`), renders styled HTML form elements inside the target `<div>`, handles client-side validation, submits data via `fetch()`, and displays a custom success message without reloading the page.

---

### Method B: Native HTML Form Action (Zero JavaScript)
* **Best for**: Existing HTML designs where the developer wants to keep their exact CSS/styling.
* **Embed Code**:
  ```html
  <form action="https://app.whatsmine.tech/api/v1/public/forms/FORM_KEY/submit" method="POST">
    <input type="text" name="name" required placeholder="Your Name">
    <input type="email" name="email" required placeholder="Your Email">
    <input type="tel" name="phone" placeholder="Phone Number">
    <input type="hidden" name="redirect_url" value="https://clientwebsite.com/thank-you">
    <button type="submit">Subscribe Now</button>
  </form>
  ```
* **Mechanism**: Standard browser form POST. WhatsMine receives the request, processes the contact and automations, and issues an HTTP 302 Redirect to the specified `redirect_url`.

---

### Method C: Workspace Inbound Webhook API (For Developers)
* **Best for**: Custom web applications, backend servers, or Zapier/Make integrations.
* **Endpoint**: `POST /api/v1/workspaces/{workspace_key}/webhooks/leads`
* **Headers**: `Content-Type: application/json`, `X-Form-Key: {FORM_KEY}`
* **Payload**:
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+19876543210",
    "tags": ["Website Lead", "Newsletter Signup"],
    "custom_fields": {
      "company": "Tech Corp",
      "budget": "$5,000"
    },
    "referrer_url": "https://clientwebsite.com/landing"
  }
  ```

---

## 4. Database Schema Design

### Table 1: `external_forms`
Stores form configuration, whitelist rules, field definitions, and post-submission actions:

```sql
CREATE TABLE `external_forms` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `form_key` VARCHAR(64) UNIQUE NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT NULL,
  `allowed_domains` JSON NULL,
  `fields_json` JSON NOT NULL,
  `assign_tags` JSON NULL,
  `redirect_url` VARCHAR(2048) NULL,
  `success_message` VARCHAR(512) NULL DEFAULT 'Thank you for subscribing!',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `submissions_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  CONSTRAINT `fk_ef_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
);
```

**Example JSON for `fields_json`**:
```json
[
  { "id": "name", "type": "text", "label": "Full Name", "required": true },
  { "id": "email", "type": "email", "label": "Email Address", "required": true },
  { "id": "phone", "type": "tel", "label": "WhatsApp Phone Number", "required": false },
  { "id": "company", "type": "text", "label": "Company Name", "required": false }
]
```

### Table 2: `external_form_submissions`
Stores an immutable log of all incoming submissions:

```sql
CREATE TABLE `external_form_submissions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `form_id` BIGINT UNSIGNED NOT NULL,
  `contact_id` BIGINT UNSIGNED NULL,
  `submitted_data` JSON NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `referrer_url` VARCHAR(2048) NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  CONSTRAINT `fk_efs_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_efs_form` FOREIGN KEY (`form_id`) REFERENCES `external_forms` (`id`) ON DELETE CASCADE
);
```

---

## 5. Marketing & Automation Execution Pipeline

When a form submission is processed by WhatsMine, the system triggers the following pipeline:

```
                  [ External Form Received ]
                              │
                              ▼
           ┌─────────────────────────────────────┐
           │ Contact Resolution Engine           │
           │ (Find by Email/Phone or Create New) │
           └──────────────────┬──────────────────┘
                              │
                              ▼
           ┌─────────────────────────────────────┐
           │ Tag & Custom Attribute Synchronization│
           │ (Apply Tags: ["Newsletter", "Form"])│
           └──────────────────┬──────────────────┘
                              │
                              ▼
           ┌─────────────────────────────────────┐
           │ Dispatch Event: ExternalFormSubmitted│
           └──────────────────┬──────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│ Automation Workflow Engine (app/Modules/Automation)        │
│ Trigger: "Form Submitted" AND "Form == Newsletter"        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ├── [Action 1] Send Instant WhatsApp Template Message    │
│  │   "Hi {name}, thanks for subscribing! Here is your     │
│  │    discount code: WELCOME10"                           │
│  │                                                        │
│  ├── [Action 2] Send Welcome Email via SMTP               │
│  │                                                        │
│  ├── [Delay Node] Wait 24 Hours                           │
│  │                                                        │
│  └── [Action 3] Check if purchased -> If NO, send promo   │
│      WhatsApp reminder                                    │
└───────────────────────────────────────────────────────────┘
```

---

## 6. Admin Panel UI & Client Portal Features

Under `app/Modules/Funnels` or a dedicated `Forms` section in Inertia React UI:

1. **Form Builder & Embed Generator (`resources/js/Pages/Forms/Index.jsx`)**:
   - Create forms with drag-and-drop fields.
   - Configure Domain Whitelist (security rule to prevent spam from unauthorized sites).
   - Generate Embed Snippets (JS Script Tag, Native HTML Form Code, Webhook URL).
2. **Submissions Log & Export**:
   - View real-time form submissions with IP, Referrer Page, and Submitted Data.
   - 1-Click Export to CSV / Excel.
3. **Automation Trigger Linker**:
   - Directly link a form to a visual Automation flow with one click ("Create Automation for this Form").
