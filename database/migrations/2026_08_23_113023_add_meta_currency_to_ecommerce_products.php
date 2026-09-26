<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->string('currency', 10)->default('USD')->after('compare_price');
            $table->string('meta_title', 255)->nullable()->after('status');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->string('access_duration_type', 20)->default('lifetime')->after('digital_expiration_days'); // lifetime | days
            $table->unsignedInteger('access_duration_days')->nullable()->after('access_duration_type');
        });
    }

    public function down(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->dropColumn(['currency', 'meta_title', 'meta_description', 'access_duration_type', 'access_duration_days']);
        });
    }
};
