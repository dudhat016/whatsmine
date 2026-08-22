<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_leadboard_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('pipeline_stage_id')->constrained('pipeline_stages')->onDelete('cascade');
            $table->boolean('collapsed')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'pipeline_stage_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_leadboard_settings');
    }
};
