<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Agency Proposals & Estimates
        Schema::create('agency_proposals', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('workspace_id')->constrained('workspaces')->onDelete('cascade');
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->onDelete('set null');
            $table->foreignId('deal_id')->nullable()->constrained('deals')->onDelete('set null');
            $table->string('title');
            $table->string('status', 30)->default('draft'); // draft, sent, viewed, accepted, declined, expired
            $table->string('pricing_type', 30)->default('one_time'); // one_time, recurring, installments
            $table->json('line_items')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);
            $table->string('currency', 10)->default('USD');
            $table->timestamp('valid_until')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->json('raw')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
        });

        // 2. Agency Contracts & E-Signatures
        Schema::create('agency_contracts', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('workspace_id')->constrained('workspaces')->onDelete('cascade');
            $table->foreignId('proposal_id')->nullable()->constrained('agency_proposals')->onDelete('cascade');
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->onDelete('set null');
            $table->string('title');
            $table->longText('content')->nullable();
            $table->string('status', 30)->default('pending_signature'); // pending_signature, partially_signed, signed, expired
            $table->json('client_signature')->nullable(); // image/text, date, name
            $table->json('counter_signature')->nullable();
            $table->json('audit_log')->nullable(); // IP, User-Agent, Crypto Hash
            $table->timestamp('signed_at')->nullable();
            $table->json('raw')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
        });

        // 3. Agency B2B Invoices
        Schema::create('agency_invoices', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('workspace_id')->constrained('workspaces')->onDelete('cascade');
            $table->foreignId('proposal_id')->nullable()->constrained('agency_proposals')->onDelete('set null');
            $table->foreignId('contract_id')->nullable()->constrained('agency_contracts')->onDelete('set null');
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->onDelete('set null');
            $table->string('invoice_number', 50)->unique();
            $table->string('status', 30)->default('draft'); // draft, unpaid, paid, overdue, cancelled
            $table->timestamp('due_date')->nullable();
            $table->json('line_items')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('tax_rate', 5, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);
            $table->string('currency', 10)->default('USD');
            $table->timestamp('paid_at')->nullable();
            $table->json('raw')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
        });

        // 4. Agency Onboarding Responses (Asset Collection)
        Schema::create('agency_onboarding_responses', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->foreignId('workspace_id')->constrained('workspaces')->onDelete('cascade');
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained('agency_invoices')->onDelete('set null');
            $table->json('form_data')->nullable();
            $table->json('files')->nullable();
            $table->string('status', 30)->default('pending'); // pending, completed
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agency_onboarding_responses');
        Schema::dropIfExists('agency_invoices');
        Schema::dropIfExists('agency_contracts');
        Schema::dropIfExists('agency_proposals');
    }
};
