<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_products', 'digital_fulfillment_type')) {
                $table->string('digital_fulfillment_type', 50)->default('file')->after('product_type');
            }
            if (! Schema::hasColumn('ecommerce_products', 'digital_file_url')) {
                $table->string('digital_file_url', 1024)->nullable()->after('digital_fulfillment_type');
            }
            if (! Schema::hasColumn('ecommerce_products', 'digital_external_url')) {
                $table->string('digital_external_url', 1024)->nullable()->after('digital_file_url');
            }
            if (! Schema::hasColumn('ecommerce_products', 'digital_license_key')) {
                $table->text('digital_license_key')->nullable()->after('digital_external_url');
            }
            if (! Schema::hasColumn('ecommerce_products', 'digital_download_limit')) {
                $table->unsignedInteger('digital_download_limit')->nullable()->default(5)->after('digital_license_key');
            }
            if (! Schema::hasColumn('ecommerce_products', 'digital_expiration_days')) {
                $table->unsignedInteger('digital_expiration_days')->nullable()->default(30)->after('digital_download_limit');
            }
        });

        Schema::table('ecommerce_orders', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_orders', 'access_token')) {
                $table->string('access_token', 64)->nullable()->unique()->after('external_order_id');
            }
            if (! Schema::hasColumn('ecommerce_orders', 'download_count')) {
                $table->unsignedInteger('download_count')->default(0)->after('access_token');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->dropColumn([
                'digital_fulfillment_type',
                'digital_file_url',
                'digital_external_url',
                'digital_license_key',
                'digital_download_limit',
                'digital_expiration_days',
            ]);
        });

        Schema::table('ecommerce_orders', function (Blueprint $table) {
            $table->dropColumn(['access_token', 'download_count']);
        });
    }
};
