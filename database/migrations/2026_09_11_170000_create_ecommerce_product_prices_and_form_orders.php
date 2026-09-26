<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Multi-Price Tiers for Native Products
        if (! Schema::hasTable('ecommerce_product_prices')) {
            Schema::create('ecommerce_product_prices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('ecommerce_products')->cascadeOnDelete();
                $table->string('name')->default('Standard');
                $table->string('pricing_type', 30)->default('one_time'); // 'one_time', 'recurring', 'installments', 'free'
                $table->decimal('price', 10, 2)->default(0);
                $table->decimal('compare_price', 10, 2)->nullable();
                $table->string('billing_interval', 20)->nullable(); // 'month', 'year', 'week', 'day'
                $table->unsignedInteger('billing_interval_count')->nullable()->default(1);
                $table->unsignedInteger('trial_days')->nullable()->default(0);
                $table->unsignedInteger('installment_count')->nullable()->default(3);
                $table->boolean('is_default')->default(false);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['workspace_id', 'product_id']);
            });
        }

        // 2. Order Form enhancements on subscription_forms
        Schema::table('subscription_forms', function (Blueprint $table) {
            if (! Schema::hasColumn('subscription_forms', 'is_order_form')) {
                $table->boolean('is_order_form')->default(false)->after('is_active');
            }
            if (! Schema::hasColumn('subscription_forms', 'order_form_type')) {
                $table->string('order_form_type', 30)->default('1_step')->after('is_order_form'); // '1_step', '2_step'
            }
            if (! Schema::hasColumn('subscription_forms', 'currency')) {
                $table->string('currency', 10)->default('USD')->after('order_form_type');
            }
            if (! Schema::hasColumn('subscription_forms', 'order_bump_settings')) {
                $table->json('order_bump_settings')->nullable()->after('currency');
            }
            if (! Schema::hasColumn('subscription_forms', 'coupon_enabled')) {
                $table->boolean('coupon_enabled')->default(false)->after('order_bump_settings');
            }
        });

        // 3. Subscription Form Products Junction
        if (! Schema::hasTable('subscription_form_products')) {
            Schema::create('subscription_form_products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
                $table->foreignId('form_id')->constrained('subscription_forms')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('ecommerce_products')->cascadeOnDelete();
                $table->foreignId('product_price_id')->nullable()->constrained('ecommerce_product_prices')->nullOnDelete();
                $table->boolean('is_default')->default(false);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['workspace_id', 'form_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_form_products');

        Schema::table('subscription_forms', function (Blueprint $table) {
            $table->dropColumn([
                'is_order_form',
                'order_form_type',
                'currency',
                'order_bump_settings',
                'coupon_enabled',
            ]);
        });

        Schema::dropIfExists('ecommerce_product_prices');
    }
};
