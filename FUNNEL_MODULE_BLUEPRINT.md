# WhatsMine — Funnel & Responsive Page Builder Module Specification (Systeme.io & GHL Matching Blueprint)

This document provides a **complete technical architecture, database schema, engineering principles, W3C accessibility rules, 95+ PageSpeed standards, step-type catalog, AI page generator, evergreen scarcity engine, affiliate referral engine, marketing automation & CRM sync engine, SEO & social sharing engine, 1-Click Share/Import/Export engine, pre-flight validator, exit-intent popup engine, edge-case rules, Super Admin Panel specifications, template gallery, saved section library, cross-funnel copy-paste clipboard, revision rollback engine, A/B testing analytics engine, reporting suite, SaaS pricing matrix, and developer blueprint** for adding a **Systeme.io & GoHighLevel-Level Responsive Sales Funnel & Page Builder Module** to the **WhatsMine** SaaS platform.

---

## 1. Expert Engineering Standards, Micro HTML5 Rules & W3C Accessibility (95+ PageSpeed Guarantee)

As an expert senior developer handing over or implementing this module, you **MUST** strictly enforce these **Micro HTML5 Rules, W3C Web Accessibility Standards (WCAG 2.1 AA), and 95+ Google PageSpeed Performance Rules** across every generated funnel page:

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

### Detailed Micro Technical Standards:

#### A. Semantic HTML5 & Element Nesting Micro-Rules
- **Strict Element Nesting Validation:**
  - ❌ **Forbidden:** `<button><div>Click Here</div></button>` or `<a href="..."><div>Box</div></a>`. Block-level elements inside inline interactive tags create invalid DOM parsing trees.
  - ✅ **Valid Standard:** `<button><span className="font-bold">Click Here</span></button>` or `<a href="..." className="block p-4"><span>Box</span></a>`.
- **Anchor (`<a>`) vs. Button (`<button>`) Usage:**
  - **Redirects & URL Navigation:** MUST use standard anchor tags (`<a href="...">`) with valid target URLs.
  - **In-Page Toggles / Form Submits / Modals:** MUST use `<button type="submit">` or `<button type="button">`. Never use `<div onClick="...">` without explicit ARIA keyboard roles (`role="button" tabIndex={0}`).

#### B. Heading Hierarchy & Structural Consistency (`<h1>` to `<h6>`)
- **Single `<h1>` Tag Constraint:** Every funnel page **MUST** contain exactly **ONE `<h1>` tag** reserved for the main primary hero headline.
- **Strict Descending Heading Depth:** Subheadings must strictly follow descending hierarchy (`<h1>` $\rightarrow$ `<h2>` $\rightarrow$ `<h3>`). The builder prevents skipping levels (e.g. placing `<h4>` directly under `<h1>`).

#### C. W3C Web Accessibility (WCAG 2.1 AA Compliance)
- **Keyboard Tab Focus Navigation:** All interactive elements (`<button>`, `<a>`, `<input>`, `<select>`) MUST be focusable via keyboard `Tab` with visible focus rings (`focus:outline-none focus:ring-2 focus:ring-brand-500`).
- **ARIA Attributes & Screen Reader Support:**
  - Icon-only buttons (e.g., popup close `X` buttons) MUST include explicit accessibility labels (`aria-label="Close modal"` or `<span className="sr-only">Close</span>`).
  - Form inputs MUST have associated `<label htmlFor="field">` elements or `aria-labelledby`.
- **WCAG Color Contrast Ratios:** All text elements MUST meet WCAG AA minimum contrast ratio (**4.5:1** for normal text, **3:1** for large headings) against background colors in both light and dark modes.

#### D. Google PageSpeed Optimization (Target: 95+ / 100 Score)
- **Sub-100ms Fast Page Load:** Public funnel pages render pre-compiled inline CSS and HTML from database cache (`html_cache` & `css_cache`), avoiding runtime template rendering delays.
- **Zero Cumulative Layout Shift (CLS = 0):** Every image tag rendered by the page builder MUST include explicit `width`, `height`, and `loading="lazy"` attributes (except the top LCP hero image which uses `loading="eager"` and `fetchpriority="high"`).
- **WebP Compression & Font Display Swap:** Images are auto-compressed to WebP format, and web fonts use `font-display: swap` to prevent unstyled text flashes (FOUT) or blocking rendering.

#### E. Automated Pre-Publish HTML Validator (`SemanticValidator.js`)
Before a client publishes a funnel page, the builder automatically runs a client-side **Semantic & Accessibility Check**:
- ⚠️ **Missing Alt Text Check:** Warns if any `<img>` tag lacks descriptive alt text.
- ⚠️ **Heading Structure Check:** Warns if there is no `<h1>` or multiple `<h1>` tags on the page.
- ⚠️ **Invalid Nesting Check:** Flags any block-level tags improperly nested inside `<button>` or `<a>` elements.
- ⚠️ **ARIA Label Check:** Flags icon buttons lacking accessibility labels.

---

## 2. Executive Summary & Strategic Positioning

### Strategic Objective
Build a full-featured **Sales Funnel & Page Builder** matching **Systeme.io**, **Beacons.ai**, **ClickFunnels**, and **GoHighLevel (GHL)** that supports multi-step sales funnels, 1-click upsells/downsells, order bumps, opt-in pages, legal templates, native A/B Split Testing, **Micro HTML5 & W3C Accessibility Standards (95+ PageSpeed)**, **Marketing Automation & CRM Lead Pipeline Sync**, **Evergreen Scarcity Engine (Dynamic Countdown Timers)**, **Built-in Funnel Affiliate & Referral Engine**, **Funnel SEO & Social Link Preview Engine**, **Exit-Intent & Interactive Popups Engine**, **Super Admin Control Panel Oversight**, **Reusable Saved Section Library & Linked Global Master Sections**, **Cross-Funnel Clipboard Copy/Paste**, **Template Gallery Modal & Revision Rollback**, **AI Page Generation**, **1-Click Share/Import/Export**, **Pre-Flight Validation**, and **SaaS Subscription Tier Limits**—fully integrated with WhatsMine's **Multi-Channel Inbox** and **WhatsApp Cloud API**.

---

## 3. Exit-Intent & Interactive Funnel Popup Engine

Funnels support a high-converting **Interactive Popup Engine** with 4 trigger types (`exit_intent`, `time_delay`, `scroll_depth`, `on_click`), popup canvas mode, cookie frequency caps (*once per session / week*), and countdown timer offers.

---

## 4. Evergreen Scarcity Engine (Dynamic Countdown Timers)

Funnels feature an **Evergreen Scarcity & Urgency Engine**: Fixed calendar countdown timers & personalized per-visitor evergreen cookie timers (15-min / 24-hr individual countdowns) with automated expiration redirects.

---

## 5. Built-in Funnel Affiliate & Referral Tracking Engine

Creators can recruit affiliates to promote their funnels and digital products with automated referral links (`?ref=john`), 30-day cookie window, automated 30% commission calculations, and affiliate dashboard (`/client/affiliates`).

---

## 6. Marketing Automation & CRM Lead Pipeline Integration (GHL-Style)

Funnels connect directly into WhatsMine's **Visual Automation Builder** (`app/Modules/Automation/`), **CRM Lead Pipeline** (`app/Modules/Leads/`), and **Broadcasting Engine** (`app/Modules/Broadcasting/`):

- **Automation Canvas Triggers (`AutomationEngine.php`):** `funnel_optin_submitted`, `funnel_checkout_completed`, `funnel_checkout_abandoned` (15-min recovery delay), `funnel_upsell_accepted`.
- **CRM Lead Pipeline Sync (`/client/leads`):** Auto-creates deal in "1. Lead Captured", auto-moves deal to "2. Customer / Won", and auto-updates deal values (`$37` $\rightarrow$ `$134`).
- **Smart Contact Tagging:** Dynamic CRM profile tagging (`buyer: [Product]`, `upsell_buyer: [Offer]`, `cart_abandoner: [Page]`) for targeted broadcast marketing.

---

## 7. Funnel SEO & Social Sharing Engine

- Search Meta Settings (Meta Title, Description, Focus Keywords, Canonical Tags, Index/NoIndex toggles).
- **Live WhatsApp Sharing Preview Widget:** Real-time builder preview card showing how the link appears inside a WhatsApp chat or Facebook post.
- **1-Click AI SEO Generator:** GPT-4o / Claude engine auto-writing search metadata in <3 seconds.
- **JSON-LD Schema Markup:** Auto-injects `Product`, `Offer`, and `FAQPage` rich snippets.

---

## 8. Reusable Section Library & Cross-Funnel Copy/Paste Clipboard

- **Saved Section Library (`funnel_saved_sections`):** Save sections to workspace library and insert via `+ Add Section ➔ My Saved Sections`.
- **Linked Global Master Sections:** Toggle `is_global = true` so updating a master section updates all funnels using it simultaneously.
- **1-Click Cross-Funnel Clipboard Copy/Paste:** 📋 **Copy Section** in Funnel A and 📋 **Paste Section** in Funnel B in under 1 second.

---

## 9. Super Admin Panel Reflection & Management (`/admin/funnels`)

- **Master Funnel Directory & Proactive Policy Scanner (`/admin/funnels`):** Master table, analytics inspection, unpublish/suspend controls, and automated headline policy scanner.
- **Per-Client Custom Quota Overrides (`/admin/clients/{id}`):** Manually override funnel limits for individual client workspaces.
- **Pre-Built System Templates Manager (`/admin/funnels/templates`):** Create and publish admin-curated templates.
- **SaaS Subscription Plan Configurator (`/admin/plans`):** Configure `funnels_limit`, `funnel_steps_limit`, `ai_page_generation_limit`, `ab_testing_allowed`, and `platform_fee_percentage`.

---

## 10. Client Builder UX: Template Gallery Modal & Page Revision History

- **Interactive Template Gallery Modal (`TemplateGalleryModal.jsx`):** Visual category tabs (Lead Gen, Digital Sales, Course Launch, Agency Booking).
- **Page Revision History & Rollback Engine (`funnel_page_revisions`):** Saves publish snapshots and allows 1-click revision rollback.

---

## 11. Branded URL Architecture & Real-Time Uniqueness Validation

```
Format: https://whatsmine.techworldproduct.com/f/{workspace_slug}/{funnel_slug}
```
- **Real-Time Uniqueness Validation API (`POST /client/funnels/check-slug`):** Debounced AJAX check verifies if the desired URL slug is available, returning instant inline feedback (❌ *"Already taken"* or ✅ *"Available"*).

---

## 12. Pre-Flight Validation & Guided Error Handling Engine

- ⚠️ **Payment Gateway Required Check:** Detects missing payment gateways on checkout steps with a 1-click `[Connect Payment Gateway]` button.
- ⚠️ **Product Link Required Check:** Detects missing products on checkout/upsell steps, prompting a guided product selector modal `[Select / Create Product]`.

---

## 13. Complete Systeme.io-Style Funnel Step Catalog

1. **Squeeze / Opt-In Page (`optin`)**
2. **Opt-In Thank You Page (`optin_thank_you`)**
3. **Sales Page (VSL) (`sales`)**
4. **Order / Checkout Page (`checkout`)**
5. **Order Bump (`order_bump`)**
6. **1-Click Upsell Page (`upsell`)**
7. **1-Click Downsell Page (`downsell`)**
8. **Order Thank You Page (`thank_you`)**
9. **Legal Pages (Terms) (`legal_terms`)**
10. **Legal Pages (Privacy) (`legal_privacy`)**

---

## 14. Technical Edge-Case Handling & Production Rules

1. **Gateway-Aware 1-Click Upsell Fallback:** Stripe uses 1-click tokenized instant charge; Razorpay/PayPal triggers a pre-filled 1-click confirmation modal.
2. **Automatic Asset Deep-Cloning (`CloneFunnelAssetsJob.php`):** Background job automatically copies all image/media assets into the recipient's cloud bucket on funnel import.
3. **Partial Field Capture (`onBlur`):** Saves partial inputs on checkout fields for 15-minute WhatsApp abandoned cart recovery.
4. **Global Funnel Theme Tokens:** Updating primary brand color on Step 1 automatically updates all steps simultaneously.

---

## 15. Database Schema & Architecture

### Table 1: `funnels`
```php
Schema::create('funnels', function (Blueprint $table) {
    $table->id();
    $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('slug');
    $table->string('meta_title')->nullable();
    $table->text('meta_description')->nullable();
    $table->string('og_image_url')->nullable();
    $table->boolean('no_index')->default(false);
    $table->string('share_token')->unique()->nullable();
    $table->boolean('is_shareable')->default(true);
    $table->boolean('is_system_template')->default(false);
    $table->enum('status', ['draft', 'published', 'suspended', 'archived'])->default('draft');
    $table->boolean('is_ready')->default(false);
    $table->json('validation_warnings')->nullable();
    $table->unsignedBigInteger('views_count')->default(0);
    $table->unsignedBigInteger('conversions_count')->default(0);
    $table->decimal('total_revenue', 12, 2)->default(0.00);
    $table->timestamps();

    $table->unique(['workspace_id', 'slug']);
});
```

---

## 16. A/B Split Testing & Page Performance Analytics

| Metric | Variant A (Control) | Variant B (Challenger) |
| :--- | :--- | :--- |
| **Traffic Split** | 50% | 50% |
| **Total Page Views** | 1,250 views | 1,248 views |
| **Unique Visitors** | 1,020 visitors | 1,015 visitors |
| **Lead / Sales Conversions** | 142 conversions | 218 conversions |
| **Conversion Rate (%)** | **13.92%** | **21.47%** (🟢 **+54.2% Higher!**) |
| **Total Revenue Generated** | $3,834.00 | $5,886.00 |
| **Revenue Per Visitor (RPV)** | $3.75 | **$5.80** |
| **Statistical Confidence** | Baseline | **99.4% (Statistically Winner)** |

---

## 17. SaaS Subscription Pricing & Plan Tiering Matrix

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

## 18. Developer Implementation Blueprint (12 Steps)

1. **Step 1:** Migrations for `funnels`, `funnel_steps`, `funnel_pages`, `funnel_popups`, `funnel_saved_sections`, `funnel_affiliates`, `funnel_affiliate_commissions`, `funnel_page_revisions`, and `funnel_submissions`.
2. **Step 2:** Create Eloquent models in `app/Modules/Funnels/Models/`.
3. **Step 3:** Create Controllers: `FunnelController.php`, `FunnelAiController.php`, `FunnelSeoController.php`, `FunnelAffiliateController.php`, `FunnelShareController.php`, `FunnelPopupController.php`, `AdminFunnelController.php`.
4. **Step 4:** Add routes to `routes/client.php`, `routes/reports.php`, and `routes/web.php`.
5. **Step 5:** Register permission keys (`view_funnels`, `manage_funnels`, `manage_affiliates`, `view_system_funnels`).
6. **Step 6:** Add navigation item to `resources/js/Layouts/useClientNav.jsx`.
7. **Step 7:** Add i18n keys to `resources/js/locales/en.json`.
8. **Step 8:** Build React page views in `resources/js/Pages/Funnels/` (`Index.jsx`, `Builder.jsx`, `Affiliates.jsx`, `Analytics.jsx`).
9. **Step 9:** Quality verification: `php artisan optimize:clear` & `npm run build`.
