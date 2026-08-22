<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('workspace_id')->constrained('workspaces')->onDelete('cascade');
            $table->foreignId('pipeline_id')->constrained('lead_pipelines')->onDelete('cascade');
            $table->foreignId('stage_id')->constrained('pipeline_stages')->onDelete('cascade');
            $table->foreignId('contact_id')->constrained('contacts')->onDelete('cascade');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('deal_watcher_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('name');
            $table->decimal('monetary_value', 12, 2)->default(0.00);
            $table->string('currency_code', 10)->default('USD');
            $table->enum('status', ['open', 'won', 'lost', 'abandoned'])->default('open');
            $table->string('source', 100)->nullable();
            $table->integer('column_priority')->default(0);
            $table->enum('next_follow_up', ['yes', 'no'])->default('no');
            $table->date('expected_close_date')->nullable();
            $table->string('lost_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'pipeline_id', 'stage_id', 'column_priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};
