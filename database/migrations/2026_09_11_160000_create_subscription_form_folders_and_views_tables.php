<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_form_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('color', 32)->nullable()->default('#16a34a');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('workspace_id');
        });

        Schema::table('subscription_forms', function (Blueprint $table) {
            $table->foreignId('folder_id')->nullable()->after('workspace_id')->constrained('subscription_form_folders')->nullOnDelete();
            $table->index('folder_id');
        });

        Schema::create('subscription_form_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('form_id')->constrained('subscription_forms')->cascadeOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_type', 32)->nullable();
            $table->string('referrer_url', 2048)->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('utm_term')->nullable();
            $table->string('utm_content')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('workspace_id');
            $table->index('form_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_form_views');
        
        Schema::table('subscription_forms', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn('folder_id');
        });

        Schema::dropIfExists('subscription_form_folders');
    }
};
