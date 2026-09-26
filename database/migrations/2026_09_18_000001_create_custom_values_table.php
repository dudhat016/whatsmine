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
        Schema::create('custom_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->index();
            $table->string('name');
            $table->string('key')->index();
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_values');
    }
};
