<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('booking_calendars', function (Blueprint $table) {
            $table->integer('max_bookings_per_day')->nullable()->after('look_ahead_days');
        });

        Schema::create('calendar_date_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('calendar_id')->constrained('booking_calendars')->onDelete('cascade');
            $table->date('override_date');
            $table->boolean('is_unavailable')->default(true);
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->timestamps();

            $table->unique(['calendar_id', 'override_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_date_overrides');
        Schema::table('booking_calendars', function (Blueprint $table) {
            $table->dropColumn('max_bookings_per_day');
        });
    }
};
