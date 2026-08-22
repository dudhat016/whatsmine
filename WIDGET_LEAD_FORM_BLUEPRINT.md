# WhatsMine — WhatsApp Widget Lead Collection Form Architecture & Specification

This document provides the complete technical architecture, database schema design, API specs, and implementation roadmap for adding a **Lead Capture Form** to the **WhatsApp Embedded Chat Widget** module (`app/Modules/Whatsapp`).

---

## 1. Overview & Business Value

Currently, the WhatsApp chat widget allows visitors to click a floating button and open a `https://wa.me/...` chat link immediately. 

Adding the **Lead Collection Form** feature allows website owners to:
1. **Capture Visitor Information**: Collect Name, Email, Phone Number, and Custom Inquiry details *before* opening WhatsApp.
2. **Never Lose a Lead**: Save visitor details in the WhatsMine CRM database even if the user closes WhatsApp without sending a message.
3. **Contextual Support**: Automatically pre-fill the WhatsApp chat text with the visitor's responses.

---

## 2. Technical Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                External Website                                   |
|                                                                                   |
|  1. Visitor opens external page containing embed script tag:                      |
|     <script src="https://app.whatsmine.tech/widget/embed/{KEY}.js"></script>     |
|                                                                                   |
|  2. Widget renders floating button + Popup Form Card                              |
|  3. Visitor fills out input fields (Name, Email, Phone, Query)                    |
|  4. On Form Submit:                                                               |
|     a) JS sends background POST -> /api/v1/public/widget/{KEY}/leads              |
|     b) JS builds WhatsApp URL with prefilled text                                 |
|     c) Opens WhatsApp in new tab / app                                            |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v (Asynchronous HTTP POST)
+-----------------------------------------------------------------------------------+
|                              WhatsMine Backend                                    |
|                                                                                   |
|  Endpoint: POST /api/v1/public/widget/{KEY}/leads                                 |
|  1. Validates Domain whitelist & request origin                                   |
|  2. Creates or updates Contact in `contacts` table                                |
|  3. Stores submission log in `widget_lead_submissions` table                      |
|  4. Triggers realtime notification to Workspace Unified Inbox                     |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Schema Design

### A. Modifications to `whatsapp_widgets` Table
Add configuration flags and form structure storage:

```sql
ALTER TABLE `whatsapp_widgets`
ADD COLUMN `enable_lead_form` TINYINT(1) NOT NULL DEFAULT 0 AFTER `position`,
ADD COLUMN `form_title` VARCHAR(128) NULL DEFAULT 'Start a Conversation' AFTER `enable_lead_form`,
ADD COLUMN `form_submit_text` VARCHAR(64) NULL DEFAULT 'Start Chat on WhatsApp' AFTER `form_title`,
ADD COLUMN `form_fields_json` JSON NULL AFTER `form_submit_text`;
```

**Example JSON Structure for `form_fields_json`**:
```json
[
  {
    "id": "field_name",
    "type": "text",
    "label": "Full Name",
    "placeholder": "e.g. John Doe",
    "required": true
  },
  {
    "id": "field_email",
    "type": "email",
    "label": "Email Address",
    "placeholder": "e.g. john@example.com",
    "required": true
  },
  {
    "id": "field_phone",
    "type": "tel",
    "label": "Phone Number",
    "placeholder": "e.g. +1 234 567 8900",
    "required": false
  },
  {
    "id": "field_service",
    "type": "select",
    "label": "Inquiry Type",
    "options": ["Sales Inquiry", "Customer Support", "Partnership"],
    "required": false
  }
]
```

### B. New Table `widget_lead_submissions`
Stores all captured form submissions:

```sql
CREATE TABLE `widget_lead_submissions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `widget_id` BIGINT UNSIGNED NOT NULL,
  `contact_id` BIGINT UNSIGNED NULL,
  `submitted_data` JSON NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `referrer_url` VARCHAR(2048) NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  CONSTRAINT `fk_wls_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wls_widget` FOREIGN KEY (`widget_id`) REFERENCES `whatsapp_widgets` (`id`) ON DELETE CASCADE
);
```

---

## 4. API Endpoint Specifications

### Public Lead Capture Endpoint (No Authentication Required)
* **Method**: `POST`
* **Route**: `/api/v1/public/widget/{widget_key}/leads`
* **Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "custom_fields": {
    "Inquiry Type": "Sales Inquiry"
  },
  "referrer_url": "https://clientwebsite.com/pricing"
}
```

**Response (`201 Created`)**:
```json
{
  "status": "success",
  "message": "Lead submitted successfully",
  "lead_id": 1084
}
```

---

## 5. Embed JavaScript Renderer Logic (`WhatsappWidgetController.php`)

When `enable_lead_form` is set to `true`, the `embed()` method in `WhatsappWidgetController` generates an interactive HTML form inside `#_wacw_tooltip`:

```javascript
// Dynamic Form Generation inside Embed JS
var formHtml = '<form id="_wacw_lead_form" style="padding:14px 16px;">'
  + '<div style="font-weight:600;font-size:14px;margin-bottom:10px;">' + _escHtml(formTitle) + '</div>'
  + '<input type="text" id="_wacw_input_name" placeholder="Your Name" required style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ccc;border-radius:6px;" />'
  + '<input type="email" id="_wacw_input_email" placeholder="Your Email" required style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ccc;border-radius:6px;" />'
  + '<button type="submit" id="_wacw_submit_btn" style="width:100%;background:' + _color + ';color:#fff;padding:10px;border:none;border-radius:6px;cursor:pointer;font-weight:600;">' + _escHtml(submitText) + '</button>'
  + '</form>';

// On Submit Event Listener
document.getElementById('_wacw_lead_form').addEventListener('submit', function (e) {
  e.preventDefault();
  
  var payload = {
    name: document.getElementById('_wacw_input_name').value,
    email: document.getElementById('_wacw_input_email').value,
    referrer_url: window.location.href
  };

  // 1. Submit lead to server asynchronously
  fetch('https://app.whatsmine.tech/api/v1/public/widget/' + _widgetKey + '/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(function(err) { console.error(err); });

  // 2. Format prefilled WhatsApp text & open WhatsApp
  var text = "Hi, my name is " + payload.name + " (" + payload.email + "). I would like to chat.";
  var finalWaUrl = "https://wa.me/" + _phone + "?text=" + encodeURIComponent(text);
  window.open(finalWaUrl, '_blank');
});
```

---

## 6. Admin Panel & Form Builder Features (`resources/js/Pages/Whatsapp/Widget/`)

1. **Widget Form Builder Settings**:
   - Enable/Disable Lead Form toggle.
   - Form Title & Submit Button Text inputs.
   - Interactive Field Builder (Add/Remove Name, Email, Phone, Select fields).
2. **Leads Management View**:
   - A dedicated tab under WhatsApp Widgets to view all captured widget leads.
   - Export leads data to CSV/Excel formats.

---

## 7. Implementation Roadmap & Checklist

- [ ] Run migration for `whatsapp_widgets` column updates and `widget_lead_submissions` table.
- [ ] Create `WidgetLeadSubmission` model and relationship to `WhatsappWidget`.
- [ ] Create API controller `App\Modules\Whatsapp\Http\Controllers\Api\PublicWidgetLeadController`.
- [ ] Update `WhatsappWidgetController::embed` to render forms conditionally when `enable_lead_form` is `true`.
- [ ] Add Form Builder UI components in React (`Create.jsx` and `Edit.jsx`).
- [ ] Add Leads Submissions Table view in Admin dashboard.
