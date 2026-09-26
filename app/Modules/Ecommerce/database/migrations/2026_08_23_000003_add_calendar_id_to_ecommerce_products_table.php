<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_products', 'calendar_id')) {
                $table->foreignId('calendar_id')->nullable()->after('digital_expiration_days')->constrained('booking_calendars')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            if (Schema::hasColumn('ecommerce_products', 'calendar_id')) {
                $table->dropForeign(['calendar_id']);
                $table->dropColumn('calendar_id');
            }
        });
    }
};
