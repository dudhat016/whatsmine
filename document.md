# Comprehensive Guide: Custom Fields, Custom Values & Dynamic Variable Architecture

This document provides a complete architectural, functional, and user-experience breakdown of **Custom Fields**, **Custom Values**, and the **Unified Dynamic Variable Engine** (as seen in leading platforms like GoHighLevel). It covers how dynamic variables are organized from basic to advanced levels, how the backend resolves them, competitor comparisons, and dedicated strategies to **prevent user confusion and cognitive overwhelm**.

---

## 1. Executive Summary: Custom Fields vs. Custom Values

| Dimension | **Custom Fields** | **Custom Values** |
| :--- | :--- | :--- |
| **Scope** | **Per-Record / Per-Contact** (Individual) | **Workspace / Account-Level** (Global) |
| **Nature of Data** | **Dynamic**: Unique to each individual contact or lead. | **Constant / Static**: Shared across the entire business workspace. |
| **Example Data** | `birthday`, `industry`, `shoe_size`, `passport_number`, `deal_budget` | `support_phone_number`, `office_address`, `booking_calendar_url`, `terms_url` |
| **Primary Owner** | The **Contact / Lead / Opportunity** | The **Company / Sub-Account / Workspace** |
| **Where it Changes** | Updated via form submissions, chat replies, API sync, or CRM edits. | Configured once by workspace admins in **Settings**. |
| **Primary Purpose** | **Personalization & Segmentation**: Segment audiences and tailor messages. | **Portability & Maintenance**: "Edit Once, Update Everywhere" across all assets. |

---

## 2. The 9-Scope Unified Dynamic Engine (The GHL Toolbar Pattern)

In top-tier platforms like GoHighLevel (GHL), the composer toolbar features a unified dropdown labeled **`Custom Values ▾`** alongside **`Trigger Links ▾`**. This is actually an access point to a **9-tier contextual token hierarchy**:

```
[ Custom Values ▾ ] [ Trigger Links ▾ ]
  ├── Contact     >  (Data belonging to the lead / recipient)
  ├── User        >  (Data belonging to the assigned sales rep / agent)
  ├── Appointment >  (Data belonging to the scheduled booking)
  ├── Calendar    >  (Configuration of the booking calendar)
  ├── Message     >  (Context of the incoming / outgoing text)
  ├── Account     >  (Business identity & workspace profile)
  ├── Right now   >  (Real-time dynamic system timestamps)
  ├── Attribution >  (Marketing UTM source & ad tracking)
  └── Custom Values > (User-created global key-value constants)
```

### Detailed Breakdown of the 9 Scopes:

1. **`Contact >` (Recipient Attributes)**:
   - *Standard*: `{{contact.first_name}}`, `{{contact.last_name}}`, `{{contact.email}}`, `{{contact.phone}}`
   - *Custom Fields*: `{{contact.policy_number}}`, `{{contact.preferred_language}}`, `{{contact.budget}}`
   - *Behavior*: Resolves uniquely for every individual contact in the workflow.
2. **`User >` (Assigned Staff / Agent)**:
   - *Tokens*: `{{user.name}}`, `{{user.email}}`, `{{user.phone}}`, `{{user.signature}}`
   - *Behavior*: Evaluates to whichever sales rep owns that contact. If Sarah owns Contact A and John owns Contact B, the outbound message dynamically signs off with the correct rep's details.
3. **`Appointment >` (Booking Context)**:
   - *Tokens*: `{{appointment.start_time}}`, `{{appointment.meet_url}}`, `{{appointment.cancellation_link}}`
   - *Behavior*: Injected from the calendar booking event that triggered or is associated with this step.
4. **`Calendar >` (Calendar Configuration)**:
   - *Tokens*: `{{calendar.name}}`, `{{calendar.description}}`, `{{calendar.timezone}}`
5. **`Message >` (Communication Context)**:
   - *Tokens*: `{{message.body}}`, `{{message.direction}}`, `{{message.date_received}}`
   - *Behavior*: Useful in automated notification alerts (e.g., *"Rep, customer just replied: '{{message.body}}'"*).
6. **`Account >` (Business Profile)**:
   - *Tokens*: `{{account.name}}`, `{{account.address}}`, `{{account.timezone}}`, `{{account.website}}`
   - *Behavior*: Injected from the global business profile settings.
7. **`Right now >` (Time & Date Functions)**:
   - *Tokens*: `{{right_now.day}}`, `{{right_now.month}}`, `{{right_now.year}}`, `{{right_now.hour}}`, `{{right_now.date}}`
   - *Behavior*: Evaluated at the exact second the message or workflow executes (e.g., *"Happy {{right_now.day}} afternoon!"*).
8. **`Attribution >` (Marketing & Ad Tracking)**:
   - *Tokens*: `{{attribution.utm_source}}`, `{{attribution.utm_campaign}}`, `{{attribution.fbclid}}`
   - *Behavior*: References the origin ad, campaign, or landing page session that acquired the lead.
9. **`Custom Values >` (User-Defined Constants)**:
   - *Tokens*: `{{custom_values.google_review_campaign_uri}}`, `{{custom_values.company_phone_number}}`, `{{custom_values.offer_name}}`
   - *Behavior*: Resolves from the workspace key-value table.

---

## 3. How Dynamic Values are Managed: From Basic to Advanced

```
                       [ RAW TEMPLATE STRING ]
   "Hi {{contact.first_name}}, review us at {{custom_values.google_review_uri}}"
                                 │
                                 ▼
                     [ RESOLVER ORCHESTRATOR ]
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     Contact Scope         Account Scope        Custom Values Scope
   ($contact->first_name) ($account->timezone)  ($workspace->custom_values)
            │                    │                    │
            ▼                    ▼                    ▼
        "Michael"                -          "https://g.page/r/abc123"
                                 │
                                 ▼
                    [ RESOLVED RENDERED STRING ]
     "Hi Michael, review us at https://g.page/r/abc123"
```

### Phase 1: Basic Level — Static Token Replacement
- **Mechanism**: Simple string replacement / regex search (`/{{\s*scope\.field\s*}}/`).
- **Data Source**: Fetches direct columns from the database (e.g. `$contact->first_name`).
- **Limitation**: If a value is missing (e.g. contact has no first name), it produces awkward blanks like *"Hello , your order is ready."*

### Phase 2: Intermediate Level — Cascading Context & Safe Fallbacks
- **Multi-Scope Resolution**: The orchestrator inspects the token prefix (`contact`, `user`, `account`, `custom_values`) and routes to the appropriate provider.
- **Fallback Syntax**: Advanced engines support default parameters:
  ```
  {{contact.first_name | default: 'there'}}
  ```
  If `first_name` exists, it prints `"Michael"`. If empty, it renders `"there"` (*"Hello there"*).
- **Date Formatting Filters**:
  ```
  {{appointment.start_time | format: 'MM/DD/YYYY at h:mm A'}}
  ```

### Phase 3: Advanced Level — Snapshot Portability & Trigger Links

#### 1. Agency Snapshot Portability Pattern
- **The Problem**: Marketing agencies configure 50+ SMS workflows, 20 email templates, and 10 funnels for clients in specific verticals (e.g. dentists, real estate agents). Hardcoding business names, booking URLs, or review links creates massive maintenance overhead and makes templates impossible to clone.
- **The Solution**: All copy utilizes `{{custom_values.*}}`.
- **The Deployment**: When onboarding a new client, the agency clones the snapshot and only fills in the **10 Custom Values** once in Settings. The entire marketing suite instantly personalizes for that client.

#### 2. Trigger Links Integration
- Positioned directly next to Custom Values in the composer toolbar: **`Trigger Links ▾`**.
- A Trigger Link is an intelligent tracked redirect link (e.g. `https://domain.com/l/review-form`).
- **Workflow Interactivity**:
  1. The contact receives an SMS: *"Please leave feedback: [Review Link]"*.
  2. The contact clicks the link.
  3. The system tracks the click and immediately fires an automation trigger: **`Trigger Link Clicked`**.
  4. The automation unenrolls the contact from the follow-up reminder flow and tags them as *"Review Submitted"*.

---

## 4. Placement & Usage Map Across the Platform

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DATA ARCHITECTURE MAP                                  │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│               CUSTOM FIELDS               │               CUSTOM VALUES                │
│            (Contact-Specific)             │             (Workspace-Global)             │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 1. Data Collection (Inputs)               │ 1. Central Configuration                   │
│    • Public Forms & Funnel Opt-ins        │    • Settings > Custom Values              │
│    • Surveys & Interactive Polls          │    • Key-Value pair manager                │
│    • WhatsApp / Chatbot Conversation Flow │                                            │
│                                           │ 2. Universal Template Injection            │
│ 2. CRM Management                         │    • Outbound Email Header & Footer        │
│    • Contact Profile Drawer / Page        │    • WhatsApp & SMS Broadcast Templates    │
│    • Custom Field Groupings / Tabs        │    • Funnel & Landing Page Text Blocks     │
│    • Bulk Contact Import (CSV mapping)    │    • Automated Invoices & Proposals        │
│                                           │                                            │
│ 3. Automation Engine & Logic              │ 3. System & Workflow Routing               │
│    • If/Else Condition Filters            │    • Webhook Target URLs & Header Tokens   │
│    • Date-based Triggers (Renewal, B-day) │    • Dynamic Redirect Links in Auto-Replies│
│    • "Update Contact Field" Actions       │    • Global Promo Codes / Webinar Replays  │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 5. Competitor Comparison Matrix

| Capability | **GoHighLevel (GHL)** | **HubSpot** | **ActiveCampaign** | **Klaviyo** |
| :--- | :--- | :--- | :--- | :--- |
| **Token Organization** | **Nested 9-Tier Flyout**: Contact, User, Appointment, Calendar, Message, Account, Right now, Attribution, Custom Values. | **Property Dropdowns**: Grouped by CRM object (Contact, Company, Deal, Ticket). | **Personalization Tags List**: Categorized by Standard, Custom, and Deals. | **Variable Tree**: Event-based variables (`event.*`) + Profile variables (`person.*`). |
| **Global Constants** | **First-Class "Custom Values"**: Dedicated key-value table powering snapshots. | **Account Defaults & Snippets**: Snippets allow reusable rich text, but lack flat key-value tokens. | **Message Variables**: Reusable rich-text blocks and campaign variables. | **Custom Account Properties**: Stored under Account Settings, usable in templates. |
| **Staff/Agent Context** | **Direct `User >` Scope**: Pulls assigned agent's phone, email, calendar, and signature dynamically. | **Contact Owner Properties**: `contact.hubspot_owner_id.email`. | **Account Owner**: Basic merge tags for account owner. | Basic sender profile tokens. |
| **Real-Time Timestamps** | **Direct `Right now >` Scope**: Formats current day, month, hour on the fly. | Requires workflow calculation properties or custom code actions. | Basic date formatting tags. | Advanced Jinja/Django date filters. |
| **Interactive Links** | **`Trigger Links ▾`**: Trackable links that can trigger automated workflows on click. | Tracking URLs (campaign attribution, but doesn't trigger workflows as easily). | Link Tracking & Automation Triggers on link clicks. | Tracked URLs, primarily for revenue attribution. |
| **Cognitive Load & UX** | Can overwhelm new users due to 9 nested hover tiers and deep lists. | High structure with search bar and "Recent Tokens" history. | Clear searchable modal, but lacks deep contextual hiding. | Advanced syntax requires technical knowledge of Jinja/Liquid. |

---

## 6. How to Prevent User Confusion and Cognitive Overwhelm

When CRM and marketing platforms add dynamic variables, users frequently encounter **4 major friction points**:
1. **Category Confusion**: *"Do I create a Custom Field or a Custom Value for this?"*
2. **Endless Menu Fatigue**: Scrolling through 50+ cryptic database keys (`contact.custom.cf_29104`).
3. **Fear of Sending Broken Messages**: Afraid that missing fields will output embarrassing blanks (*"Hello , your order is ready"*).
4. **The "Ghost Deletion" Fear**: Afraid to rename or delete a field because they don't know if it breaks live funnels or workflows.

The following architectural and UX guidelines eliminate these friction points completely:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        WHERE TO CONFIGURE vs. WHERE TO CONSUME                         │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│           SETTINGS (Back-Office)          │            CANVAS / EDITORS (Daily Use)    │
│           "Define Once, Administer"       │            "Pick & Insert with 1-Click"    │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ Settings > Custom Fields:                 │ In Message Composers / Email Editors:      │
│  • Grouped by folders (e.g. "Dental")     │  • Smart Context-Aware Token Picker        │
│  • Clear helper: "Information about your  │  • Shows only variables relevant to that   │
│    leads and customers"                   │    specific channel (e.g. no email tokens  │
│                                           │    inside an SMS composer)                 │
│ Settings > Custom Values:                 │                                            │
│  • Grouped by tabs (e.g. "Links", "Info") │ In Automation Builders (If/Else):          │
│  • Clear helper: "Information about your  │  • Visual dropdowns comparing typed values │
│    business (same for everyone)"          │  • Autocomplete search (type `{` to find)  │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

### Rule 1: Visual Separation at Creation Time (Preventing Category Confusion)
In **Settings**, never mix Custom Fields and Custom Values on the same screen:
- **Custom Fields (`Settings > Lead Fields`)**:
  - *Plain-English Subtitle*: *"Information that changes for every lead or customer (e.g., Birthday, Vehicle Model, Ad Budget)."*
- **Custom Values (`Settings > Business Values`)**:
  - *Plain-English Subtitle*: *"Information about your business that stays the same for everyone (e.g., Support WhatsApp, Office Address, Google Review Link)."*

### Rule 2: Context-Aware Dynamic Hiding (Combating Menu Bloat)
In GoHighLevel, opening the variable menu always displays all 9 scopes, even when irrelevant.
- **The Solution**: Automatically hide scopes that do not apply to the current context:
  - If a workflow was **not** triggered by an appointment/calendar event, **hide the `Appointment` and `Calendar` scopes**.
  - If drafting an **SMS or WhatsApp message**, **hide email-specific tokens** (`{{email.subject}}`).
  - **Result**: Reduces cognitive load from 9 intimidating folders down to 3 or 4 relevant ones.

### Rule 3: Search-First Spotlight Picker (Type `{{` to Find)
Instead of forcing users to traverse 3 levels of nested mouse hover menus:
- When typing `{{` or `{` inside any message box or text editor, trigger a floating **Spotlight Search**:
  - Typing `{{rev` immediately suggests `[🏷️ Google Review Link]`.
  - Typing `{{name` immediately suggests `[👤 Lead First Name]` and `[💼 Assigned Rep Name]`.

### Rule 4: Visual Variable Badges / Pills (No Broken Bracket Syntax)
Raw code like `{{custom_values.google_review_campaign_uri}}` clutters textareas and users frequently delete single curly brackets by accident, breaking the template.
- Render inserted variables as interactive **visual pills**:
  ```
  "Hi [👤 First Name ✕], please leave us feedback: [🏷️ Review Link ✕]"
  ```
- Backspacing deletes the pill as a single clean unit.

### Rule 5: Guided Inline Fallback Assistant
When a user selects a variable that might be empty (like `contact.first_name`), prompt:
- *"If First Name is blank, replace with: [there]"*
- Prevents embarrassing output like *"Hi , welcome to our clinic"* by guaranteeing *"Hi there, welcome to our clinic"*.

### Rule 6: Dependency Tracker ("Used In X Automations")
Before an admin edits or deletes a Custom Field or Custom Value:
- The system checks all funnels, forms, and workflows:
  > *"⚠️ This field is currently used in 2 Funnel Forms, 3 Workflows, and 4 Email Templates. Deleting it will affect these assets."*

---

## 7. Strategic Improvement Recommendations for Your Platform

### 1. Implement the Hierarchical 2-Level Dropdown UX
* **Current State**: Users must either remember raw syntax (`{{contact.custom.foo}}`) or navigate flat lists.
* **Recommendation**:
  - Implement a clean **nested flyout menu** matching GHL:
    - `Contact` ➔ (First Name, Last Name, Email, Custom Fields...)
    - `Assigned Agent` ➔ (Name, Email, Phone, Signature)
    - `Business Profile` ➔ (Business Name, Address, Timezone)
    - `System / Date` ➔ (Current Day, Current Date, Current Year)
    - `Custom Values` ➔ (Workspace-defined custom key-values)

### 2. Searchable Autocomplete (Type `{{` or `{` to Search)
* **Concept**: As seen in modern editors (Notion, Slack, Linear), typing `{{` inside any message box or email editor opens an instant floating search box.
* **Benefit**: Typing `{{rev` immediately suggests `{{custom_values.google_review_campaign_uri}}` without leaving the keyboard.

### 3. Introduce a Dedicated "Custom Values" Key-Value Engine
* **Concept**:
  - Add a **Settings > Custom Values** screen allowing admins to define reusable variables.
  - Integrate a resolver in `CampaignPersonalizer.php` and `AutomationEngine.php` that substitutes `{{custom_values.<key>}}` across funnels, broadcasts, and automation steps.

### 4. Dynamic Staff/Agent Context (`User >`)
* **Concept**: Add dynamic resolution for the assigned agent (`{{user.name}}`, `{{user.phone}}`, `{{user.signature}}`).
* **Benefit**: A single automated outreach message dynamically personalizes with the assigned sales rep's direct contact details:
  > *"Hi {{contact.first_name}}, this is {{user.name}} from {{account.name}}. Call me directly at {{user.phone}}."*

### 5. Introduce "Trigger Links" Engine
* **Concept**: Allow users to create named redirect links with built-in click tracking.
* **Benefit**: When a contact clicks a trigger link, the system fires an automation trigger (`Trigger Link Clicked`), allowing instant lead tagging, workflow routing, and agent alerts.

### 6. Inline Fallback Modifiers & Live Preview
* **Concept**: Support fallback modifiers within tokens (e.g. `{{contact.first_name | 'there'}}`) and offer a **"Preview with Sample Lead"** toggle so users can verify how messages will look before sending.
