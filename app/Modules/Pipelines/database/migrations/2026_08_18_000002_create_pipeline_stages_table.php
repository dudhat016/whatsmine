<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pipeline_stages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('pipeline_id')->constrained('lead_pipelines')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->string('color', 30)->default('#3b82f6');
            $table->integer('probability')->default(100);
            $table->boolean('show_in_funnel')->default(true);
            $table->integer('priority')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pipeline_stages');
    }
};
