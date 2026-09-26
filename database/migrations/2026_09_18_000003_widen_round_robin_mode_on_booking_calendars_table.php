<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_calendars', function (Blueprint $table) {
            $table->string('round_robin_mode', 50)->default('availability')->change();
        });
    }

    public function down(): void
    {
        Schema::table('booking_calendars', function (Blueprint $table) {
            $table->string('round_robin_mode', 50)->default('availability')->change();
        });
    }
};
