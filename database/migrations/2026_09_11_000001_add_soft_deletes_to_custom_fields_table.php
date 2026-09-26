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
        Schema::table('custom_fields', function (Blueprint $table) {
            if (! Schema::hasColumn('custom_fields', 'deleted_at')) {
                $table->softDeletes()->after('is_active');
            }
            if (! Schema::hasColumn('custom_fields', 'folder_order')) {
                $table->integer('folder_order')->default(0)->after('field_group');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('custom_fields', function (Blueprint $table) {
            if (Schema::hasColumn('custom_fields', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
            if (Schema::hasColumn('custom_fields', 'folder_order')) {
                $table->dropColumn('folder_order');
            }
        });
    }
};
