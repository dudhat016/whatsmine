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
        if (! Schema::hasTable('trigger_links')) {
            Schema::create('trigger_links', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
                $table->string('name');
                $table->text('target_url');
                $table->string('slug', 64)->index();
                $table->unsignedBigInteger('clicks_count')->default(0);
                $table->timestamps();

                $table->unique(['workspace_id', 'slug']);
            });
        }

        if (! Schema::hasTable('trigger_link_clicks')) {
            Schema::create('trigger_link_clicks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('trigger_link_id')->constrained('trigger_links')->cascadeOnDelete();
                $table->unsignedBigInteger('contact_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trigger_link_clicks');
        Schema::dropIfExists('trigger_links');
    }
};
