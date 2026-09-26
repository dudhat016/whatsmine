<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('agency_invoices', 'billing_type')) {
            Schema::table('agency_invoices', function (Blueprint $table) {
                $table->string('billing_type', 30)->default('one_time')->after('status');
            });
        }
        if (!Schema::hasColumn('agency_invoices', 'discount_amount')) {
            Schema::table('agency_invoices', function (Blueprint $table) {
                $table->decimal('discount_amount', 12, 2)->default(0.00)->after('subtotal');
            });
        }
        if (!Schema::hasColumn('agency_invoices', 'amount_paid')) {
            Schema::table('agency_invoices', function (Blueprint $table) {
                $table->decimal('amount_paid', 12, 2)->default(0.00)->after('total');
            });
        }
        if (!Schema::hasColumn('agency_invoices', 'balance_due')) {
            Schema::table('agency_invoices', function (Blueprint $table) {
                $table->decimal('balance_due', 12, 2)->default(0.00)->after('amount_paid');
            });
        }
        if (!Schema::hasColumn('agency_invoices', 'viewed_at')) {
            Schema::table('agency_invoices', function (Blueprint $table) {
                $table->timestamp('viewed_at')->nullable()->after('paid_at');
            });
        }
        if (!Schema::hasColumn('agency_invoices', 'installments')) {
            Schema::table('agency_invoices', function (Blueprint $table) {
                $table->json('installments')->nullable()->after('line_items');
            });
        }

        if (!Schema::hasColumn('agency_proposals', 'discount_amount')) {
            Schema::table('agency_proposals', function (Blueprint $table) {
                $table->decimal('discount_amount', 12, 2)->default(0.00)->after('subtotal');
            });
        }
        if (!Schema::hasColumn('agency_proposals', 'tax_rate')) {
            Schema::table('agency_proposals', function (Blueprint $table) {
                $table->decimal('tax_rate', 5, 2)->default(0.00)->after('discount_amount');
            });
        }
        if (!Schema::hasColumn('agency_proposals', 'tax_amount')) {
            Schema::table('agency_proposals', function (Blueprint $table) {
                $table->decimal('tax_amount', 12, 2)->default(0.00)->after('tax_rate');
            });
        }
        if (!Schema::hasColumn('agency_proposals', 'contract_terms')) {
            Schema::table('agency_proposals', function (Blueprint $table) {
                $table->longText('contract_terms')->nullable()->after('raw');
            });
        }
        if (!Schema::hasColumn('agency_proposals', 'declined_at')) {
            Schema::table('agency_proposals', function (Blueprint $table) {
                $table->timestamp('declined_at')->nullable()->after('accepted_at');
            });
        }

        if (!Schema::hasColumn('agency_contracts', 'document_checksum')) {
            Schema::table('agency_contracts', function (Blueprint $table) {
                $table->string('document_checksum', 64)->nullable()->after('audit_log');
            });
        }
        if (!Schema::hasColumn('agency_contracts', 'viewed_at')) {
            Schema::table('agency_contracts', function (Blueprint $table) {
                $table->timestamp('viewed_at')->nullable()->after('signed_at');
            });
        }
    }

    public function down(): void
    {
        // Safe no-op or drop if columns exist
    }
};
