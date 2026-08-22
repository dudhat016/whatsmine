<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deal_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->onDelete('cascade');
            $table->string('event_type', 50); // stage_change, follow_up, note_added, file_uploaded, status_change
            $table->foreignId('stage_from_id')->nullable()->constrained('pipeline_stages')->onDelete('set null');
            $table->foreignId('stage_to_id')->nullable()->constrained('pipeline_stages')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('remarks')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_histories');
    }
};
