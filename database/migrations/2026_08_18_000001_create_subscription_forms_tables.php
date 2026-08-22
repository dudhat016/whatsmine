<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('title')->nullable();
            $table->string('slug')->unique();
            $table->enum('type', ['embedded', 'popup', 'api'])->default('embedded');
            $table->text('description')->nullable();
            $table->json('fields')->nullable();
            $table->json('settings')->nullable();
            $table->boolean('double_optin_enabled')->default(false);
            $table->enum('optin_channel', ['whatsapp', 'email', 'sms'])->default('whatsapp');
            $table->boolean('gdpr_checkbox')->default(false);
            $table->text('gdpr_text')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('submissions_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('workspace_id');
            $table->index('slug');
            $table->index('is_active');
        });

        Schema::create('subscription_form_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('form_id')->constrained('subscription_forms')->cascadeOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->json('submitted_data');
            $table->string('otp_code', 16)->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('referrer_url', 2048)->nullable();
            $table->timestamps();

            $table->index('workspace_id');
            $table->index('form_id');
            $table->index('is_verified');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_form_submissions');
        Schema::dropIfExists('subscription_forms');
    }
};
