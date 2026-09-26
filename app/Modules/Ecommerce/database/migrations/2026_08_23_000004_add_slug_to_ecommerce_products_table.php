<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            if (! Schema::hasColumn('ecommerce_products', 'slug')) {
                $table->string('slug')->nullable()->after('name');
                $table->index(['store_id', 'slug']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('ecommerce_products', function (Blueprint $table) {
            if (Schema::hasColumn('ecommerce_products', 'slug')) {
                $table->dropIndex(['store_id', 'slug']);
                $table->dropColumn('slug');
            }
        });
    }
};
