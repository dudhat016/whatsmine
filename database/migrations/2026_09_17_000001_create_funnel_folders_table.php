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
        if (! Schema::hasTable('funnel_folders')) {
            Schema::create('funnel_folders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
                $table->string('name', 128);
                $table->string('color', 32)->default('#16a34a');
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['workspace_id', 'sort_order']);
            });
        }

        if (Schema::hasTable('funnels') && ! Schema::hasColumn('funnels', 'folder_id')) {
            Schema::table('funnels', function (Blueprint $table) {
                $table->foreignId('folder_id')
                    ->nullable()
                    ->after('workspace_id')
                    ->constrained('funnel_folders')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('funnels') && Schema::hasColumn('funnels', 'folder_id')) {
            Schema::table('funnels', function (Blueprint $table) {
                $table->dropConstrainedForeignId('folder_id');
            });
        }

        Schema::dropIfExists('funnel_folders');
    }
};
