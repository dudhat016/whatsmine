<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->dropColumn('currency'); // Moved to workspaces.currency_code (global)
        });
    }

    public function down(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->string('currency', 10)->default('USD')->after('compare_price');
        });
    }
};
