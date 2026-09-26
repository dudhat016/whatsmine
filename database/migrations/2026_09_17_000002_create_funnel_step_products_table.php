<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('funnel_step_products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id')->index();
            $table->foreignId('funnel_step_id')->constrained('funnel_steps')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('ecommerce_products')->nullOnDelete();
            $table->foreignId('product_price_id')->nullable()->constrained('ecommerce_product_prices')->nullOnDelete();
            $table->string('name');
            $table->enum('type', ['main', 'bump', 'upsell', 'downsell'])->default('main');
            $table->enum('offer_type', ['digital', 'physical'])->default('digital');
            $table->decimal('price', 10, 2)->default(0.00);
            $table->string('bump_headline')->nullable();
            $table->text('bump_description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['funnel_step_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('funnel_step_products');
    }
};
