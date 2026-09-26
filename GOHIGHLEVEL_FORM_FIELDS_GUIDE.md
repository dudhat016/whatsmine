
# GoHighLevel-Style Form Builder & CRM Fields Specification

This document provides a comprehensive guide and technical specification for the **Subscription Form Builder** in **WhatsMine**, benchmarked against **GoHighLevel (GHL)**.

---

## 🌟 1. Core Field Taxonomy

Form widgets are categorized into two primary types:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FORM BUILDER WIDGET TAXONOMY                       │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. OBJECT FIELDS (Standard)   │ Pre-packaged native CRM attributes          │
│                               │ (Email, First Name, Last Name, Phone)       │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 2. CUSTOM FIELDS (User-Defined)│ Business-specific lead attributes           │
│                               │ (Company, Budget, Date, File, Rating)       │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

### A. Object Fields (Standard / System Fields)
* **Definition**: Native attributes belonging directly to core database entities (`contacts` table).
* **Fields**: `Email Address` (`email`), `First Name` (`first_name`), `Last Name` (`last_name`), `WhatsApp Phone` (`phone_e164`).
* **Database Mapping**: Saved directly into primary database columns (`$contact->email`, `$contact->phone_e164`).

### B. Custom Fields (User-Defined Attributes)
* **Definition**: Custom input fields created on the fly to capture unique lead data.
* **Input Types**: `Short Text`, `Multi-Line Textarea`, `Number`, `Phone`, `Date Picker`, `Dropdown`, `Radio Buttons`, `Checkbox`, `File Upload`, `Rating Stars`, `Hidden Field`.
* **Database Mapping**: Saved in JSON columns (`contacts.custom_fields` and `subscription_forms.settings.custom_fields`).

---

## 🎯 2. CRM Object Mapping: `Contact` vs `Opportunity`

When creating a custom field in GoHighLevel format, the **Target Object** controls which CRM entity stores the data:

| Target Object | Description | Primary Use Case | Storage Location |
|---|---|---|---|
| **`Contact`** | Permanent profile attribute attached to the person across all interactions. | Job Title, Company Name, Tax ID, Address | `contacts.custom_fields` JSON |
| **`Opportunity`** | Transactional/deal attribute attached to a specific Sales Pipeline card. | Requested Quote, Specific Service, Property Address | Pipeline Opportunity Deal Card |

### Why `Contact` vs `Opportunity` Matters:
* **Contact Attributes**: If a lead submits 3 forms over 6 months, their central Contact profile updates without duplicating records.
* **Opportunity Attributes**: If the same contact submits 2 separate inquiries (e.g., Inquiry #1 for Web Design, Inquiry #2 for SEO), each inquiry creates a separate **Pipeline Opportunity Deal Card** with its own unique field data.

---

## 📂 3. CRM Field Groups: Profile Accordion Organization

The **Group** setting determines where on the CRM Contact Profile UI layout the field appears:

```
┌─────────────────────────────────────────────────────────────┐
│  CONTACT PROFILE DETAIL VIEW                                │
├─────────────────────────────────────────────────────────────┤
│  ▼ 👤 Contact Group (Basic Identity)                        │
│     • Email, Phone, Primary Address                         │
│                                                             │
│  ▼ 🏢 General Info Group (Work & Company)                   │
│     • Company Name, Industry, Job Title                     │
│                                                             │
│  ▼ 📋 Additional Info Group (Form Qualifiers)               │
│     • Budget Range, Preferred Date, Uploaded Files          │
└─────────────────────────────────────────────────────────────┘
```

* **`contact`**: Core identity section.
* **`general_info`**: Business & work background.
* **`additional_info`**: Survey questions, qualifiers, and file uploads.

---

## 🏗 4. WhatsMine Implementation Architecture

### A. React Builder Components (`resources/js/Pages/Forms/`)

```
resources/js/Pages/Forms/
├── Create.jsx                                # Create form orchestrator
├── Edit.jsx                                  # Edit form orchestrator (hydrates DB record)
└── Builder/
    ├── WidgetLibrary.jsx                     # Left Panel: 2 Tabs (Object Fields & Custom Fields)
    ├── FormCanvas.jsx                        # Center Panel: Drag & Drop sortable live preview
    ├── FieldPreview.jsx                      # Renders input fields & inline editable widgets
    ├── FieldSettings.jsx                     # Right Panel: Field properties & Object/Group selectors
    ├── FormSettings.jsx                      # Right Panel: Form identity, theme, and auto-tags
    └── modals/
        └── CreateCustomFieldModal.jsx        # GHL Modal: Object, Group, Type, Key & Options
```

### B. End-to-End Dynamic Data Flow

```
1. User Clicks "+ Add Custom Field" in WidgetLibrary.jsx
   └── Opens CreateCustomFieldModal.jsx
       ├── Select Object: Contact vs Opportunity
       ├── Select Group: Contact vs General Info vs Additional Info
       └── Configure Input Type, Label, Key, Options & Required flag

2. Form Saved ──► POST /client/forms ──► SubscriptionFormController.php
   └── Persisted dynamically to MySQL `subscription_forms` table:
       • `fields`: ["email", "first_name", "phone_e164"]
       • `settings.custom_fields`: [
           {
             "key": "budget_range",
             "label": "Budget Range",
             "type": "select",
             "objectTarget": "opportunity",
             "fieldGroup": "additional_info",
             "options": ["$1k-$5k", "$5k-$10k", "$10k+"]
           }
         ]

3. Visitor Fills Public Form ──► PublicSubscriptionController.php
   ├── Creates record in `subscription_form_submissions` table
   ├── Maps standard fields to `contacts` columns
   ├── Merges custom fields into `contacts.custom_fields` JSON column
   ├── Syncs dynamic Auto-Tags (`ContactTag::firstOrCreate()`)
   └── Dispatches `SubscriptionFormSubmitted` event for Marketing Automations
```

---

## 📊 Feature Comparison Matrix: GHL vs WhatsMine

| Feature | **GoHighLevel (GHL)** | **WhatsMine** |
|---|---|---|
| **Left Sidebar Layout** | 2 Tabs: Object Fields & Custom Fields | 2 Tabs: Object Fields & Custom Fields |
| **Custom Field Creator** | Modal with Object, Group, Type, Key | Modal with Object, Group, Type, Key (`CreateCustomFieldModal.jsx`) |
| **Inline Header Widgets** | Section Heading & Paragraph widgets | Section Heading & Paragraph widgets |
| **Database Storage** | Custom Table / EAV | `subscription_forms.settings` & `contacts.custom_fields` (JSON) |
| **Real-time Sync** | Automatic | Real-time via Inertia.js & Laravel Controllers |

---
*Generated for WhatsMine Platform Architecture*
