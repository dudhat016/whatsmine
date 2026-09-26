<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->string('pricing_type', 30)->default('one_time')->after('price');
            $table->decimal('compare_price', 10, 2)->nullable()->after('pricing_type'); // Original / strikethrough price
            $table->string('billing_interval', 20)->nullable()->after('compare_price');
            $table->integer('billing_interval_count')->nullable()->after('billing_interval');
            $table->integer('trial_days')->nullable()->after('billing_interval_count');
            $table->integer('installment_count')->nullable()->after('trial_days');
            $table->string('product_type', 20)->default('physical')->after('installment_count');
            $table->text('description')->nullable()->after('name');
        });

        Schema::table('ecommerce_stores', function (Blueprint $table) {
            $table->string('slug', 191)->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->dropColumn([
                'pricing_type',
                'compare_price',
                'billing_interval',
                'billing_interval_count',
                'trial_days',
                'installment_count',
                'product_type',
                'description',
            ]);
        });

        Schema::table('ecommerce_stores', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
