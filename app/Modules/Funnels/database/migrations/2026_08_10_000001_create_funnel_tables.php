<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── 1. funnels ───────────────────────────────────────────────────────────
        Schema::create('funnels', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name', 128);
            $table->string('slug', 128);
            $table->string('theme_color', 32)->default('#6366f1');       // Global funnel brand token
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('og_image_url')->nullable();
            $table->boolean('no_index')->default(false);
            $table->string('share_token', 64)->unique()->nullable();      // 1-Click share/import
            $table->boolean('is_shareable')->default(true);
            $table->boolean('is_system_template')->default(false);
            $table->enum('status', ['draft', 'published', 'suspended', 'archived'])->default('draft');
            $table->boolean('is_ready')->default(false);                   // Pre-flight passed
            $table->json('validation_warnings')->nullable();               // Pre-flight warnings payload
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('conversions_count')->default(0);
            $table->decimal('total_revenue', 12, 2)->default(0.00);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['workspace_id', 'slug']);
            $table->index('workspace_id');
            $table->index('status');
        });

        // ─── 2. funnel_steps ─────────────────────────────────────────────────────
        Schema::create('funnel_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funnel_id')->constrained('funnels')->cascadeOnDelete();
            $table->string('name', 128);
            $table->enum('type', [
                'optin',
                'optin_thank_you',
                'sales',
                'checkout',
                'order_bump',
                'upsell',
                'downsell',
                'thank_you',
                'legal_terms',
                'legal_privacy',
            ]);
            $table->unsignedSmallInteger('sort_order')->default(0);       // Drag-and-drop step ordering
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('conversions_count')->default(0);
            $table->timestamps();

            $table->index('funnel_id');
            $table->index('sort_order');
        });

        // ─── 3. funnel_pages ─────────────────────────────────────────────────────
        Schema::create('funnel_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funnel_step_id')->constrained('funnel_steps')->cascadeOnDelete();
            $table->char('variant', 1)->default('A');                     // 'A' | 'B' for A/B testing
            $table->boolean('is_control')->default(true);                 // true = control variant A
            $table->unsignedTinyInteger('traffic_split')->default(50);    // % of traffic (0-100)
            $table->json('canvas_json')->nullable();                       // Builder canvas state (blocks/sections)
            $table->longText('html_cache')->nullable();                    // Compiled HTML cache for 95+ PageSpeed
            $table->longText('css_cache')->nullable();                     // Compiled CSS cache
            $table->timestamp('cache_compiled_at')->nullable();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('og_image_url')->nullable();
            $table->boolean('no_index')->default(false);
            $table->json('schema_json')->nullable();                       // JSON-LD Schema.org structured data
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('conversions_count')->default(0);
            $table->decimal('revenue', 12, 2)->default(0.00);
            $table->timestamps();

            $table->index('funnel_step_id');
            $table->index(['funnel_step_id', 'variant']);
        });

        // ─── 4. funnel_popups ────────────────────────────────────────────────────
        Schema::create('funnel_popups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funnel_page_id')->constrained('funnel_pages')->cascadeOnDelete();
            $table->string('name', 128);
            $table->enum('trigger_type', ['exit_intent', 'time_delay', 'scroll_depth', 'on_click']);
            $table->unsignedSmallInteger('trigger_value')->nullable();    // seconds / scroll %
            $table->string('trigger_selector')->nullable();               // CSS selector for on_click
            $table->json('canvas_json')->nullable();                       // Popup canvas blocks
            $table->enum('frequency', ['always', 'once_per_session', 'once_per_week'])->default('once_per_session');
            $table->boolean('has_countdown')->default(false);             // Countdown timer offer
            $table->unsignedInteger('countdown_seconds')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('funnel_page_id');
        });

        // ─── 5. funnel_saved_sections ────────────────────────────────────────────
        Schema::create('funnel_saved_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name', 128);
            $table->string('thumbnail_url')->nullable();
            $table->json('canvas_json');                                   // Section block data
            $table->boolean('is_global')->default(false);                 // Linked Global Master Section
            $table->unsignedBigInteger('usage_count')->default(0);
            $table->timestamps();

            $table->index('workspace_id');
            $table->index('is_global');
        });

        // ─── 6. funnel_affiliates ─────────────────────────────────────────────────
        Schema::create('funnel_affiliates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funnel_id')->constrained('funnels')->cascadeOnDelete();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name', 128);
            $table->string('email', 191);
            $table->string('ref_code', 32)->unique();                     // ?ref=affiliate_code
            $table->decimal('commission_rate', 5, 2)->default(30.00);
            $table->enum('status', ['active', 'paused', 'banned'])->default('active');
            $table->unsignedBigInteger('clicks_count')->default(0);
            $table->unsignedBigInteger('leads_count')->default(0);
            $table->unsignedBigInteger('conversions_count')->default(0);
            $table->decimal('total_earned', 12, 2)->default(0.00);
            $table->decimal('total_paid', 12, 2)->default(0.00);
            $table->timestamps();

            $table->index('funnel_id');
            $table->index('workspace_id');
            $table->index('ref_code');
        });

        // ─── 7. funnel_affiliate_commissions ─────────────────────────────────────
        Schema::create('funnel_affiliate_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funnel_affiliate_id')->constrained('funnel_affiliates')->cascadeOnDelete();
            $table->foreignId('funnel_id')->constrained('funnels')->cascadeOnDelete();
            $table->decimal('order_amount', 12, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->decimal('commission_rate', 5, 2);
            $table->enum('status', ['pending', 'approved', 'paid', 'refunded'])->default('pending');
            $table->string('order_reference')->nullable();
            $table->timestamp('attributed_at')->nullable();              // Last-touch 30-day attribution
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('funnel_affiliate_id');
            $table->index('status');
        });

        // ─── 8. funnel_page_revisions ────────────────────────────────────────────
        Schema::create('funnel_page_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funnel_page_id')->constrained('funnel_pages')->cascadeOnDelete();
            $table->unsignedBigInteger('published_by')->nullable();
            $table->json('canvas_json');
            $table->longText('html_snapshot')->nullable();
            $table->string('label')->nullable();
            $table->timestamps();

            $table->index('funnel_page_id');
        });

        // ─── 9. funnel_submissions ───────────────────────────────────────────────
        Schema::create('funnel_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funnel_step_id')->constrained('funnel_steps')->cascadeOnDelete();
            $table->foreignId('funnel_id')->constrained('funnels')->cascadeOnDelete();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->string('email', 191)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('first_name', 64)->nullable();
            $table->string('last_name', 64)->nullable();
            $table->json('form_data')->nullable();
            $table->string('ref_code', 32)->nullable();                   // Affiliate attribution
            $table->string('visitor_ip', 45)->nullable();
            $table->string('visitor_country', 3)->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->enum('status', ['lead', 'customer', 'refunded'])->default('lead');
            $table->decimal('order_amount', 12, 2)->nullable();
            $table->string('payment_gateway')->nullable();
            $table->string('transaction_id')->nullable();
            $table->boolean('is_partial')->default(false);                // onBlur partial capture
            $table->timestamps();

            $table->index('funnel_id');
            $table->index('workspace_id');
            $table->index('contact_id');
            $table->index('email');
            $table->index('status');
            $table->index('ref_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('funnel_submissions');
        Schema::dropIfExists('funnel_page_revisions');
        Schema::dropIfExists('funnel_affiliate_commissions');
        Schema::dropIfExists('funnel_affiliates');
        Schema::dropIfExists('funnel_saved_sections');
        Schema::dropIfExists('funnel_popups');
        Schema::dropIfExists('funnel_pages');
        Schema::dropIfExists('funnel_steps');
        Schema::dropIfExists('funnels');
    }
};
