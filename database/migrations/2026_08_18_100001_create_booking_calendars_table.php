<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_calendars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('slug', 100)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->enum('type', ['personal', 'round_robin', 'class', 'collective'])->default('personal');
            $table->enum('round_robin_mode', ['availability', 'equal_distribution'])->default('availability');
            $table->boolean('allow_staff_selection')->default(false);
            $table->integer('duration_minutes')->default(30);
            $table->integer('slot_interval_minutes')->default(30);
            $table->integer('pre_buffer_minutes')->default(0);
            $table->integer('post_buffer_minutes')->default(0);
            $table->integer('min_notice_hours')->default(2);
            $table->integer('look_ahead_days')->default(14);
            $table->integer('max_capacity')->default(1);
            $table->integer('look_busy_percent')->default(0);
            $table->enum('location_type', ['google_meet', 'zoom', 'whatsapp', 'phone', 'address', 'custom'])->default('google_meet');
            $table->string('location_custom')->nullable();
            $table->boolean('requires_payment')->default(false);
            $table->decimal('amount', 10, 2)->default(0.00);
            $table->string('currency', 10)->default('USD');
            $table->unsignedBigInteger('custom_form_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_calendars');
    }
};
