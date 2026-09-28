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
        Schema::create('custom_domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('domain')->unique();
            $table->string('type')->default('funnel'); // app_whitelabel, funnel, ecommerce, booking, universal
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('fallback_url')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->string('dns_status')->default('pending'); // pending, verified, failed
            $table->string('ssl_status')->default('pending'); // pending, active, failed
            $table->string('verification_token')->nullable();
            $table->json('dns_records')->nullable();
            $table->json('settings')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'type']);
            $table->index('is_verified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_domains');
    }
};
