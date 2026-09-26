<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('funnel_steps', function (Blueprint $table) {
            if (! Schema::hasColumn('funnel_steps', 'slug')) {
                $table->string('slug', 128)->nullable()->after('name');
            }
            $table->string('type', 64)->change();
        });

        // Auto-populate slug for existing funnel steps
        $steps = DB::table('funnel_steps')->get();
        foreach ($steps as $step) {
            if (empty($step->slug)) {
                $baseSlug = Str::slug($step->name ?: $step->type);
                DB::table('funnel_steps')->where('id', $step->id)->update([
                    'slug' => $baseSlug ?: 'step-' . $step->id,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('funnel_steps', function (Blueprint $table) {
            if (Schema::hasColumn('funnel_steps', 'slug')) {
                $table->dropColumn('slug');
            }
        });
    }
};
