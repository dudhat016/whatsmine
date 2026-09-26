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
        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->index();
            $table->string('name');
            $table->string('key')->index();
            $table->string('type')->default('text'); // text, textarea, number, select, radio, checkbox, date, file, rating, hidden
            $table->string('object_target')->default('contact'); // contact, opportunity
            $table->string('field_group')->default('general_info'); // contact, general_info, additional_info
            $table->json('options')->nullable();
            $table->string('placeholder')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['workspace_id', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_fields');
    }
};
