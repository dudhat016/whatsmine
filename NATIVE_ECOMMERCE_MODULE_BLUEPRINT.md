# 🛍️ Native E-Commerce & Internal Product Catalog Blueprint

> **Comprehensive Architectural Blueprint & Technical Specification**  
> *Designing native product management, internal storefronts, conversational WhatsApp checkout, and fulfillment automation within WhatsMine without external CRM/CMS dependencies.*

---

## 1. Executive Summary & Objective

Currently, WhatsMine connects to external e-commerce platforms (Shopify, WooCommerce, BigCommerce) to synchronize products and orders. This specification outlines the architecture for **Native E-Commerce**, enabling users without an external CMS/CRM to create native products, manage inventory, sell via WhatsApp chat or funnels, process payments, and fulfill orders directly inside WhatsMine.

---

## 2. Core Architecture Diagram

```mermaid
flowchart TD
    subgraph Catalog ["1. Native Catalog Management"]
        Admin[Client / Merchant] -->|Creates/Edits Products| ProductCatalog[EcommerceProduct: platform = 'native']
        ProductCatalog --> MediaLib[Media Library Images]
        ProductCatalog --> Inventory[Inventory & Stock Engine]
    end

    subgraph SalesChannels ["2. Native Sales & Conversational Channels"]
        ProductCatalog -->|Share Product / Catalog| Chat[WhatsApp Inbox / Live Chat]
        ProductCatalog -->|Embed Product / Cart| Funnel[Funnel Page Builder]
        ProductCatalog -->|Browse Catalog| Storefront[Public Storefront Widget /s/{slug}]
    end

    subgraph Checkout ["3. Checkout & Payment Engine"]
        Chat -->|Click Buy Now| CheckoutLink[Dynamic Payment Link]
        Funnel -->|Submit Order| CheckoutLink
        Storefront -->|Cart Checkout| CheckoutLink
        CheckoutLink --> Gateways[Stripe / PayPal / Razorpay / CashOnDelivery]
    end

    subgraph Fulfillment ["4. Order Fulfillment & Automations"]
        Gateways -->|Payment Completed| OrderEngine[EcommerceOrder: status = 'paid']
        OrderEngine -->|Trigger Automation| WA[WhatsApp Order Receipt & Status Update]
        OrderEngine -->|Stock Deduction| Inventory
        OrderEngine -->|Fulfill/Ship| MerchantDashboard[Orders Dashboard /app/ecommerce/orders]
    end
```

---

## 3. Database Schema & Data Models

### 3.1 Store Extensions (`ecommerce_stores`)
Extend the existing `ecommerce_stores` table to support `platform = 'native'`:
* `platform`: ENUM (`'shopify'`, `'woocommerce'`, `'bigcommerce'`, `'native'`)
* `slug`: `VARCHAR(191)` UNIQUE — for public store URL (`/s/{slug}`).
* `store_settings`: `JSON` — Currency, tax rates, shipping rates, store logo, policy pages.

### 3.2 Product Catalog (`ecommerce_products`)
Extend `ecommerce_products` for native creation with clean pricing models:
* `platform`: `'native'`
* `store_id`: References `ecommerce_stores.id`
* `external_id`: UUID string for native products
* `name`, `slug`, `description`, `sku`
* `pricing_type`: ENUM (`'one_time'`, `'recurring'`, `'installments'`, `'free'`)
* `price`: Decimal (Main price amount; set to `0.00` for `'free'`)
* `billing_interval`: ENUM (`'month'`, `'year'`, `'custom'`) — applicable when `pricing_type = 'recurring'`
* `billing_interval_count`: INTEGER (e.g., `3` for every 3 months when using custom recurring)
* `trial_days`: INTEGER (Optional free trial days before recurring billing begins)
* `installment_count`: INTEGER (Number of split payments when `pricing_type = 'installments'`)
* `inventory_quantity`: Stock quantity (INTEGER)
* `track_inventory`: `BOOLEAN` (default `true`)
* `status`: ENUM (`'draft'`, `'active'`, `'archived'`)
* `image_url`: Main image URL
* `gallery_images`: `JSON` array of image URLs
* `variants`: `JSON` array of product options (Size, Color, Price adjustments)
* `raw`: `JSON` for additional metadata (weight, digital download links, custom fields)

---

### 3.3 Native Orders (`ecommerce_orders`)
Extend `ecommerce_orders`:
* `order_number`: String (e.g. `WM-10042`)
* `payment_status`: ENUM (`'unpaid'`, `'paid'`, `'refunded'`, `'partially_refunded'`)
* `fulfillment_status`: ENUM (`'unfulfilled'`, `'processing'`, `'shipped'`, `'delivered'`, `'cancelled'`)
* `line_items`: `JSON` array of purchased items, prices, and variant selections
* `shipping_address`: `JSON`
* `billing_address`: `JSON`
* `payment_method`: String (`'stripe'`, `'razorpay'`, `'cod'`, etc.)

---

## 4. Feature Workflows

### 4.1 Native Product Management UI & Pricing Modal (`/app/ecommerce/products`)
1. **Product Listing**: Displays synced products (Shopify/WooCommerce) and Native products with clean pricing mode badges (`One-Time`, `Monthly`, `Installments`, `FREE`).
2. **Product Pricing Selector Modal**:
   * **Selectable Pricing Modes**:
     * 🏷️ **One-Time Payment**: Fixed flat price (e.g., `$49.00`).
     * 🔄 **Recurring Subscription**:
       * Billing Cadence: `Monthly`, `Yearly`, or `Custom Interval` (e.g. Every 3 Months).
       * **Free Trial Days**: Optional trial period (e.g. 14 days free trial) before recurring billing begins.
     * 💳 **Payment Plan (Installments / Multi-Pay)**:
       * Split payments for high-ticket items (e.g., `3 monthly payments of $35`).
     * 🎁 **FREE**:
       * $0.00 Lead Magnet / Free Access.
   * **Title, SKU, Barcode, & Rich Text Description**.
   * **Media Uploader**: Integrated with WhatsMine's Media Library (`/app/media`).
   * **Stock Tracking & Low-Stock Alerts**.
   * **Tax & Shipping Controls**: Toggle "Charge tax on this product" and "Digital product (no shipping required)".

### 4.2 Conversational WhatsApp Sales ("Chat-to-Order")
1. **In-Chat Product Sharing**: Agents in the **Inbox** (`/app/inbox`) select native products to send as interactive WhatsApp Product Cards or multi-product messages.
2. **Instant Checkout**: Clicking "Buy Now" in WhatsApp generates a dynamic payment link pre-filled with customer details.
3. **AI Chatbot Commerce**: AI Chatbots (`/app/ai/chatbots`) query native products via Knowledge Base / Product Index and auto-respond to price/product inquiries with buy links.

### 4.3 Funnel & Page Builder Integration (`/app/funnels`)
* Native products can be assigned as checkout items inside the **Funnel Builder**.
* Supports 1-step checkout, 2-step checkout, and bump offers (order bumps / upsells).

### 4.4 Order Processing & Automated Customer Updates (`/app/ecommerce/orders`)
1. **Order Capture**: Successful checkouts record a new order in `/app/ecommerce/orders`.
2. **Automated WhatsApp Notifications**:
   * **Order Confirmation**: Sent immediately upon payment.
   * **Shipping Update**: Triggered when merchant marks order as `Shipped` with tracking ID.
   * **Delivery Confirmation**: Sent when marked `Delivered`.

### 4.5 💰 Order Bumps & 1-Click Post-Purchase Upsells
1. **Pre-Purchase Order Bumps**:
   * Single-click offer checkbox directly on the checkout form (*"Add 1-Year Extended Warranty & Priority Handling for $4.99"*).
   * Dynamically adds the bump price to the primary transaction total before payment authorization.
2. **1-Click Post-Purchase Upsells & Downsells**:
   * **Stripe / Tokenized Gateways**: Instantly charges the customer's saved payment token with 1 click on the post-checkout page without re-entering card details.
   * **Non-Tokenized Gateways (Razorpay/PayPal)**: Opens a pre-filled 1-tap confirmation modal.
3. **AOV Impact Analytics**: Track Average Order Value (AOV) lift, bump conversion rates, and total upsell revenue inside `/client/reports/funnel`.

### 4.6 📄 Digital Products & Automated File Delivery
1. **Digital Product Type Configuration**:
   * Support for physical items (inventory stock) and **Digital Products** (`product_type = 'digital'`) such as eBooks, PDFs, Software License Keys, and Course Access Links.
2. **Secure Temporary Media Vault**:
   * Files stored securely in encrypted storage with expiring signed URLs (e.g. 24-hour expiration or max 3 download attempts per purchase).
3. **Automated Instant Delivery via WhatsApp & Email**:
   * Upon successful payment (`payment_status = 'paid'`), an automated WhatsApp message + Email is dispatched instantly containing the customer's personalized download link or license key.

---

## 5. Security, Permissions & Roles

* **Permissions**: Controlled via standard workspace permissions (`manage_products`, `manage_orders`, `view_orders`).
* **Tenant Isolation**: All products and orders are scoped strictly by `workspace_id`.
* **API Access**: Native products and orders exposed via `/api/v1/products` and `/api/v1/orders` for external webhooks or mobile apps.

---

## 6. Implementation Roadmap Overview

| Phase | Module | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 1** | **Catalog Engine** | Update `ecommerce_products` table, build Native Product Form UI & image upload. |
| **Phase 2** | **Checkout & Payments** | Integrate dynamic payment links (Stripe/Razorpay/PayPal) & order creation endpoint. |
| **Phase 3** | **Conversational Commerce**| Enable product picker in Chat Inbox & AI Chatbot product recommendation tools. |
| **Phase 4** | **Fulfillment & Automations**| Build Order Status management UI & automated WhatsApp status notification triggers. |

---

## 7. Advanced Native E-Commerce Sub-Modules & API Specifications

### 7.1 Native Public Storefront Widget (`/s/{workspace_slug}`)
* **Public Route**: `GET /s/{workspace_slug}` & `GET /s/{workspace_slug}/p/{product_slug}`.
* **Storefront Engine**: Lightweight, mobile-first responsive catalog grid rendering active native products.
* **Shopping Cart**: Client-side slide-over cart drawer (`EcommerceCart`) persisting items in `localStorage`.
* **Direct Checkout**: Redirects cart items directly to dynamic payment checkout links (Stripe, Razorpay, PayPal, or Cash on Delivery).

### 7.2 Meta WhatsApp Commerce Catalog Sync (`WhatsAppCatalogSyncJob.php`)
* **Meta Graph API Sync**: Automatically pushes native products to Meta Commerce Catalog via `POST /{catalog_id}/products`.
* **Native In-App WhatsApp Messages**: Enables native WhatsApp Multi-Product Messages (MPM) and Catalog Cards directly inside WhatsApp conversations.

### 7.3 15-Minute WhatsApp Abandoned Cart Recovery Engine
* **Partial Field Capture**: Saves customer phone number and cart items on `onBlur` from checkout forms.
* **Automated Recovery Trigger**: `SendAbandonedCartRecoveryJob` executes 15 minutes after abandonment, sending a personalized WhatsApp recovery link:  
  *"Hey [Name], you left items in your cart! Complete your order now with 10% OFF: [Link]"*.

### 7.4 Tax, Shipping & Currency Calculation Engine
* **Store Settings Configuration** (`store_settings` JSON):
  * **Default Currency**: USD ($), EUR (€), INR (₹), GBP (£), etc.
  * **Tax Calculation**: Flat percentage or country-specific tax rules (e.g. 5% GST/VAT).
  * **Shipping Rates**: Flat shipping rate or Free Shipping Threshold (e.g. Free shipping on orders over $50.00).
