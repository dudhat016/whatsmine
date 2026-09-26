<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            if (! Schema::hasColumn('deals', 'custom_fields')) {
                $table->json('custom_fields')->nullable()->after('source');
            }
        });
    }

    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            if (Schema::hasColumn('deals', 'custom_fields')) {
                $table->dropColumn('custom_fields');
            }
        });
    }
};
