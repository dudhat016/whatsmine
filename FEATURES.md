# WhatsMine — Complete Architecture, Development Handbook & Feature Specifications

This document serves as the **official technical architecture blueprint, developer handbook, competitor reference matrix, and feature specification manual** for the **WhatsMine** SaaS platform. When handing over the project to a developer or adding any new feature/module, follow these mandatory conventions, standards, and checklists.

---

## Part 1: Technical Stack & Infrastructure

- **Backend Framework:** Laravel 11.x (PHP 8.3+)
- **Frontend Bridge:** Inertia.js (React SPA without separate REST endpoint boilerplate for internal UI views)
- **UI Framework:** React 18 + Vanilla Tailwind CSS (with Light/Dark theme support) + Lucide React Icons
- **Internationalization:** `i18next` + `react-i18next` dynamically hydrated from `GET /i18n/{locale}`
- **Database:** MySQL 8.0 (Production) / SQLite (Local testing)
- **Realtime / Queue:** Laravel Reverb / Pusher Broadcasting + Database/Redis Queue Workers
- **Authentication:** Dual Guard Architecture (`web` for Client workspace users, `admin` for Super Admins)

---

## Part 2: Modular Architecture (`app/Modules/`)

The application follows a **Domain-Driven Modular Structure**. All core features are organized into isolated domain modules under `app/Modules/`:

```
app/Modules/
├── AI/                     # LLM Gateway, Chatbots, Vector Store (Qdrant), RAG
├── Automation/             # Visual Workflow Builder, Triggers, Actions, Execution Engine
├── Broadcasting/           # SMS, Email Server, Marketing Campaigns
├── Ecommerce/              # Store sync (Shopify, WooCommerce, BigCommerce), Product catalog
├── Funnels/                # Funnel Builder, AI Generator, CRM Sync, W3C Accessibility, 95+ PageSpeed
├── Inbox/                  # Multi-channel Unified Inbox (WhatsApp, Instagram, Messenger)
├── Integrations/           # Third-party credential management, CredentialResolver
├── Leads/                  # Business lead scraper, contact pipeline
├── Social/                 # Social Media Post Planner, Calendar, OAuth publishing
├── Whatsapp/               # Meta WhatsApp Cloud API, Embedded Signup, Templates, Widgets
└── Shared/                 # Cross-module Models (Contact, Conversation, Message, ChannelAccount)
```

---

## Part 3: Mandatory Standards for Every New Module (The 7 Pillars & Micro HTML5 Rules)

When adding any **New Module** (e.g. `CRM`, `Booking`, `SupportCenter`, `Invoicing`, `Funnels`), developers **MUST** adhere to these **5 Golden Engineering Principles & Micro HTML5 Rules**:

```
┌────────────────────────────────────────────────────────────────────────┐
│         MICRO HTML5, W3C ACCESSIBILITY & 95+ PAGESPEED RULES           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Semantic HTML5 &       │ Strict element nesting (no <div> inside   │
│    Strict Nesting Rules    │ <button>), correct <a> vs <button> usage. │
│ 2. Heading Hierarchy       │ Single <h1> per page, strict <h1>➔<h2>➔<h3>│
│    Consistency             │ heading depth without skipping levels.    │
│ 3. W3C Accessibility       │ Keyboard Tab focus rings, aria-labels,    │
│    (WCAG 2.1 AA)           │ and 4.5:1 color contrast compliance.      │
│ 4. Google PageSpeed (95+)  │ Sub-100ms cached HTML, explicit img W/H,  │
│    CLS = 0 Optimization    │ WebP compression, lazy loading, swap fonts.│
│ 5. Automated Pre-Publish   │ Built-in semantic checker catching missing│
│    Accessibility Validator │ alt text or invalid nesting before live.  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Architectural & UI/UX Consistency Standards
- **Component Token Alignment:** All new views must use `<ClientLayout>` or `<AdminLayout>`, adhering to WhatsMine’s core color palette (`bg-white dark:bg-neutral-900`, `border-neutral-200 dark:border-neutral-800`, `bg-brand-600 hover:bg-brand-700`).
- **Strict Internationalization (i18n):** Never hardcode strings in React components. Wrap all labels, toasts, and headers with `useTranslation()` keys (`t('funnel.title')`).

### 2. Micro HTML5 & Element Nesting Rules
- **No Invalid Element Nesting:**
  - ❌ **Forbidden:** `<button><div>Click Here</div></button>` or `<a href="..."><div>Box</div></a>`.
  - ✅ **Valid Standard:** `<button><span className="font-bold">Click Here</span></button>` or `<a href="..." className="block p-4"><span>Box</span></a>`.
- **Anchor (`<a>`) vs. Button (`<button>`) Usage:**
  - **Redirects & URL Navigation:** MUST use standard anchor tags (`<a href="...">`).
  - **Form Submits & Modal Toggles:** MUST use `<button type="submit">` or `<button type="button">`. Never use `<div onClick="...">` without explicit ARIA keyboard roles (`role="button" tabIndex={0}`).

### 3. Heading Hierarchy & Consistency (`<h1>` to `<h6>`)
- **Single `<h1>` Tag Constraint:** Every funnel page **MUST** contain exactly **ONE `<h1>` tag** reserved for the main primary hero headline.
- **Strict Descending Heading Depth:** Subheadings must strictly follow descending hierarchy (`<h1>` $\rightarrow$ `<h2>` $\rightarrow$ `<h3>`). The builder prevents skipping levels (e.g. placing `<h4>` directly under `<h1>`).

### 4. W3C Web Accessibility (WCAG 2.1 AA Compliance)
- **Keyboard Tab Focus Navigation:** All interactive elements (`<button>`, `<a>`, `<input>`, `<select>`) MUST be focusable via keyboard `Tab` with visible focus rings (`focus:outline-none focus:ring-2 focus:ring-brand-500`).
- **ARIA Attributes & Screen Reader Support:** Icon buttons MUST include explicit labels (`aria-label="Close modal"`). Form inputs MUST have associated `<label htmlFor="field">` elements.
- **WCAG Color Contrast Ratios:** All text elements MUST meet WCAG AA minimum contrast ratio (**4.5:1** for normal text, **3:1** for large headings) against background colors in both light and dark modes.

### 5. Google PageSpeed Optimization (Target: 95+ / 100 Score)
- **Sub-100ms Fast Page Load:** Public funnel pages render pre-compiled inline CSS and HTML from database cache (`html_cache` & `css_cache`).
- **Zero Cumulative Layout Shift (CLS = 0):** Every image tag rendered by the page builder MUST include explicit `width`, `height`, and `loading="lazy"` attributes (except the top LCP hero image which uses `loading="eager"` and `fetchpriority="high"`).
- **WebP Compression & Font Display Swap:** Images are auto-compressed to WebP format, and web fonts use `font-display: swap`.

### 6. Automated Pre-Publish HTML Validator (`SemanticValidator.js`)
Before a client publishes a funnel page, the builder automatically runs a client-side **Semantic & Accessibility Check**:
- ⚠️ **Missing Alt Text Check:** Warns if any `<img>` tag lacks descriptive alt text.
- ⚠️ **Heading Structure Check:** Warns if there is no `<h1>` or multiple `<h1>` tags on the page.
- ⚠️ **Invalid Nesting Check:** Flags any block-level tags improperly nested inside `<button>` or `<a>` elements.
- ⚠️ **ARIA Label Check:** Flags icon buttons lacking accessibility labels.

---

## Part 4: Marketing Automation & CRM Lead Pipeline Integration (GHL-Style)

Funnels connect directly into WhatsMine's **Visual Automation Builder** (`app/Modules/Automation/`), **CRM Lead Pipeline** (`app/Modules/Leads/`), and **Broadcasting Engine** (`app/Modules/Broadcasting/`):

1. **Automation Canvas Triggers (`AutomationEngine.php`):** `funnel_optin_submitted`, `funnel_checkout_completed`, `funnel_checkout_abandoned` (15-min recovery delay), `funnel_upsell_accepted`.
2. **CRM Lead Pipeline Sync (`/client/leads`):** Auto-creates deal in "1. Lead Captured", auto-moves deal to "2. Customer / Won", and auto-updates deal values (`$37` $\rightarrow$ `$134`).
3. **Smart Contact Tagging:** Dynamic CRM profile tagging (`buyer: [Product]`, `upsell_buyer: [Offer]`, `cart_abandoner: [Page]`) for targeted broadcast marketing.

---

## Part 5: Evergreen Scarcity Engine (Dynamic Countdown Timers)

Funnels feature an **Evergreen Scarcity & Urgency Engine**:
1. **Fixed Calendar Timer:** Counts down to a specific date & time (e.g. *"Product Launch Ends Tonight"*).
2. **Evergreen Cookie Timer:** Starts a personalized 15-minute or 24-hour countdown the second an individual visitor arrives.
3. **Expired Action Auto-Redirect:** Automatically redirects to an *"Offer Expired"* page or hides discount buttons when the timer hits `00:00:00`.

---

## Part 6: Built-in Funnel Affiliate & Referral Tracking Engine (`funnel_affiliates`)

Creators can recruit affiliates to promote their funnels and digital products:
1. **Unique Affiliate Links:** Appends `?ref=affiliate_code` to funnel URLs.
2. **30-Day Cookie Attribution:** Tracks buyer sales attribution back to the referring affiliate.
3. **Automated Commission Calculations:** Calculates affiliate earnings (e.g. 30% revenue share) on checkout orders.
4. **Affiliate Portal Dashboard (`/client/affiliates`):** Displays clicks, leads, conversions, and pending payouts.

---

## Part 7: Funnel SEO & Social Sharing Engine

Funnels feature a full **Search Engine Optimization & Social Open Graph (OG) Engine**:
1. **Google Search Meta Settings:** Meta Title, Meta Description, Focus Keywords, Canonical Tags, and Index/NoIndex toggles (`<meta name="robots">`).
2. **Social Open Graph (OG) & WhatsApp Link Preview:**
   - Upload 1200x630 OG Social Image banners.
   - **Live WhatsApp Sharing Preview Widget:** Builder panel widget showing a real-time preview of how the link preview card looks inside a WhatsApp chat or Facebook post.
3. **1-Click "Generate SEO with AI" Button:** Leverages WhatsMine's Multi-LLM Gateway to analyze page copy and write search-optimized titles and descriptions in <3 seconds.
4. **Structured JSON-LD Schema Markup:** Auto-injects `Schema.org` metadata (`Product`, `Offer`, `FAQPage`) for Google rich search snippets.

---

## Part 8: Exit-Intent & Interactive Popups Engine (`funnel_popups`)

1. **Exit-Intent Popups (`exit_intent`):** Triggers when cursor moves toward browser top bar or back button (*"Wait! Get 20% Off"*).
2. **Time-Delayed Popups (`time_delay`):** Fires automatically after `X` seconds (e.g. 15s delay).
3. **Scroll-Depth Popups (`scroll_depth`):** Fires when visitor scrolls 50% or 75% down long VSL sales pages.
4. **2-Step Click-Triggered Popups (`on_click`):** Opens clean popup overlay when clicking specific CTA buttons.
5. **Cookie Frequency Caps:** Limits popup frequency (*Show once per session*, *Show once per week*).

---

## Part 9: Reusable Saved Section Library & Cross-Funnel Copy/Paste Clipboard

1. **Workspace Saved Section Library (`funnel_saved_sections`):** Save sections to library and insert via `+ Add Section ➔ My Saved Sections`. Linked global master sections toggle updates all funnels using it simultaneously.
2. **1-Click Cross-Funnel Clipboard Copy/Paste:** 📋 **Copy Section** in Funnel A and 📋 **Paste Section** in Funnel B in under 1 second.

---

## Part 10: Super Admin Panel Reflection & Management (`/admin/funnels`)

1. **Master Funnel Directory & Proactive Policy Scanner (`/admin/funnels`):** Master table, analytics inspection, unpublish/suspend controls, and automated headline policy scanner.
2. **Pre-Built System Templates Manager (`/admin/funnels/templates`):** Create and publish admin-curated templates for clients.
3. **Per-Client Custom Quota Overrides (`/admin/clients/{id}`):** Manually override funnel limits for individual client workspaces.
4. **SaaS Subscription Plan Configurator (`/admin/plans`):** Configure `funnels_limit`, `funnel_steps_limit`, `ab_testing_allowed`, and `platform_fee_percentage`.

---

## Part 11: Technical Edge-Case Handling & Production Rules for Funnels

1. **Gateway-Aware 1-Click Upsell Fallback:** Stripe uses 1-click tokenized instant charge; Razorpay/PayPal triggers a pre-filled 1-click confirmation modal.
2. **Automatic Asset Deep-Cloning (`CloneFunnelAssetsJob.php`):** Background job automatically copies all image/media assets into the recipient's cloud bucket on funnel import.
3. **Partial Field Capture (`onBlur`):** Saves partial inputs on checkout fields for 15-minute WhatsApp abandoned cart recovery.
4. **Global Funnel Theme Tokens:** Updating primary brand color on Step 1 automatically updates all steps simultaneously.
5. **Page Revision History & Rollback Engine (`funnel_page_revisions`):** Saves revision snapshots on publish, allowing clients to revert layout errors with 1 click.

---

## Part 12: Reports & Analytics Sub-Module Standard (`/client/reports/*`)

```
app/Http/Controllers/Client/Reports/
├── InboxReportController.php         # Inbox conversation & agent performance metrics
├── CampaignReportController.php      # WhatsApp, SMS & Email campaign metrics
├── AutomationReportController.php    # Workflow execution & trigger metrics
├── SocialReportController.php        # Social media engagement & post metrics
├── AiReportController.php            # Chatbot token usage & RAG confidence scores
└── FunnelReportController.php        # Funnel Conversion & Revenue Reports
```

---

## Part 13: SaaS Pricing & Plan Tiering Matrix for Modules

| Feature / Limit Parameter | Starter Plan ($29/mo) | Pro Plan ($79/mo) | Unlimited Plan ($199/mo) |
| :--- | :--- | :--- | :--- |
| **Active Funnels (`funnels_limit`)** | **3 Funnels** | **20 Funnels** | **Unlimited** (`-1`) |
| **AI Page & SEO Generation** | **5 / mo** | **50 / mo** | **Unlimited** |
| **Automation & CRM Sync** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Evergreen Scarcity Engine** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Funnel Affiliate Engine** | ❌ No | ✅ Yes | ✅ Yes |
| **Exit-Intent Popups Engine** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Saved Library Sections** | **5 Sections** | **50 Sections** | **Unlimited** |
| **Share Funnel Import / Export** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Order Bumps & Checkout** | ✅ Yes | ✅ Yes | ✅ Yes |
| **1-Click Upsells & Downsells** | ❌ No | ✅ Yes | ✅ Yes |
| **A/B Split Testing (`ab_testing_allowed`)** | ❌ No | ✅ Yes | ✅ Yes |
| **Platform Transaction Fee** | **2%** | **0%** | **0%** |

---

## Part 14: Complete Module Feature Specifications

### 10. Funnels & Responsive Page Builder (`/client/funnels`)
- **Micro HTML5, W3C Accessibility & 95+ PageSpeed Engine:** Strict element nesting (no `<div>` inside `<button>`), heading hierarchy (`<h1>` depth), WCAG 2.1 AA keyboard focus rings, `aria-label` screen reader tags, explicit image dimensions (CLS = 0), sub-100ms database HTML caching, and `SemanticValidator.js` pre-publish checker.
- **Expert Engineering Standards & Security Principles:** Multi-tenant workspace scoping, DRY code architecture, design system consistency, XSS/SQLi guards, demo mode protection, and atomic DB transactions.
- **Marketing Automation & CRM Lead Pipeline Sync (GHL-Style):** Visual automation canvas triggers (`funnel_optin_submitted`, `funnel_checkout_completed`, `funnel_checkout_abandoned`), automated CRM Kanban deal stage moves & deal value updates (`$37` $\rightarrow$ `$134`), and dynamic contact auto-tagging.
- **Evergreen Scarcity Engine:** Fixed calendar countdown timers & personalized per-visitor evergreen cookie timers with automated expiration redirects.
- **Built-in Funnel Affiliate & Referral Engine (`funnel_affiliates`):** Referral links (`?ref=john`), 30-day cookie window, automated 30% commission calculations, and affiliate dashboard (`/client/affiliates`).
- **Funnel SEO & Social Sharing Engine:** Search Meta (Title, Description, Keywords, Robots Index/NoIndex), Open Graph Social Image (1200x630), live WhatsApp Link Preview Card widget, 1-Click AI SEO Generator, and Schema.org JSON-LD structured data.
- **Exit-Intent & Interactive Popups Engine (`funnel_popups`):** Popup canvas mode with 4 trigger types (Exit-intent, Time-delay, Scroll-depth, 2-Step click popups), countdown timers, and cookie frequency caps.
- **Saved Section Library & Cross-Funnel Copy/Paste:** Save sections under `funnel_saved_sections`, link global master sections, and copy/paste section blocks across funnels in under 1 second.
- **Interactive Template Gallery Modal (`TemplateGalleryModal.jsx`):** Visual template selector categorized into Lead Gen, Digital Product Sales, Course Launch, and Service Booking.
- **Page Revision History & Rollback Engine (`funnel_page_revisions`):** Save publish snapshots and restore previous canvas states with 1 click.
- **Super Admin Oversight & Management (`/admin/funnels`):** Master funnel directory, proactive headline policy scanner, client funnel suspension, system templates manager, plan limit configurator, custom quota overrides, and 2% platform fee tracking.
- **Systeme.io & Beacons.ai Branded URL Architecture:** Standard format `https://whatsmine.techworldproduct.com/f/{workspace_slug}/{funnel_slug}` with real-time uniqueness validation API (`POST /client/funnels/check-slug`).
- **Pre-Flight Dependency Validation & Guided Error Handling:** Payment gateway and product link dependency checks with guided banners and setup buttons.
- **Edge-Case Handling Rules:** Gateway-aware 1-click upsell fallbacks, `CloneFunnelAssetsJob`, `onBlur` WhatsApp cart recovery, and global theme tokens.
- **Manual Canvas & AI Page Generator:** Create pages manually or auto-generate complete responsive pages using AI prompts (OpenAI GPT-4o, Claude 3.5, Gemini).
- **1-Click Share, Import & Export (GHL & Systeme.io Style):** Generate shareable URLs (`/funnels/share/{token}`) with 1-click workspace cloning in under 3 seconds.
- **Step Routing:** Opt-in, Sales VSL, Order Checkout, Order Bump, 1-Click Upsell/Downsell, Thank You, Legal pages.
- **Responsive Builder Canvas:** Desktop (`1280px`), Tablet (`768px`), and Mobile (`375px`) viewports.
- **A/B Split Testing:** 50/50 traffic splitter with cookie-based sticky session routing and side-by-side Z-score performance matrix.
- **Funnel Reports:** Deep analytics suite under `/client/reports/funnel` with conversion rates, AOV, RPV, and CSV/PDF downloads.
