<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Alter appointments.status to VARCHAR(32) to support showed, completed, confirmed, rescheduled, cancelled, no_show
        try {
            DB::statement("ALTER TABLE appointments MODIFY status VARCHAR(32) NOT NULL DEFAULT 'confirmed'");
        } catch (\Throwable $e) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('status', 32)->default('confirmed')->change();
            });
        }
    }

    public function down(): void
    {
        try {
            DB::statement("ALTER TABLE appointments MODIFY status ENUM('confirmed', 'rescheduled', 'cancelled', 'no_show', 'completed') NOT NULL DEFAULT 'confirmed'");
        } catch (\Throwable $e) {
            // ignore
        }
    }
};
