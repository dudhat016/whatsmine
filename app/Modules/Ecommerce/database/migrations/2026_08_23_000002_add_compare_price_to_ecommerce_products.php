<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            if (!Schema::hasColumn('ecommerce_products', 'compare_price')) {
                $table->decimal('compare_price', 10, 2)->nullable()->after('price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            $table->dropColumn('compare_price');
        });
    }
};
