<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_calendars', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(false)->after('max_capacity');
            $table->enum('recurring_frequency', ['daily', 'weekly', 'monthly'])->default('weekly')->after('is_recurring');
            $table->integer('recurring_count')->default(4)->after('recurring_frequency');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('parent_appointment_id')->nullable()->after('contact_id')->constrained('appointments')->nullOnDelete();
            $table->integer('recurring_sequence')->default(1)->after('parent_appointment_id');
        });
    }

    public function down(): void
    {
        Schema::table('booking_calendars', function (Blueprint $table) {
            $table->dropColumn(['is_recurring', 'recurring_frequency', 'recurring_count']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['parent_appointment_id']);
            $table->dropColumn(['parent_appointment_id', 'recurring_sequence']);
        });
    }
};
