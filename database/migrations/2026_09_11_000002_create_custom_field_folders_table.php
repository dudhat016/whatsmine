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
        if (! Schema::hasTable('custom_field_folders')) {
            Schema::create('custom_field_folders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workspace_id')->index();
                $table->string('name');
                $table->string('key')->index();
                $table->string('object_target')->default('contact'); // contact, opportunity, company
                $table->integer('sort_order')->default(0);
                $table->boolean('is_system')->default(false);
                $table->string('source_type')->nullable(); // 'form', 'survey', 'custom'
                $table->unsignedBigInteger('source_id')->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->unique(['workspace_id', 'key']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_field_folders');
    }
};
