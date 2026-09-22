<?php

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-product control of the two sample buttons.
 *
 * Both were hardcoded onto every product page, so a 20kg bag of grout offered
 * a free tile sample and a showroom visit to see it full size. Neither makes
 * sense for a trade consumable or for a length of scotia.
 *
 * Defaults: the big-sample button on everywhere; the free-sample button on
 * everywhere except the Trade tree and Hybrid > Quads/Scotia, which are the
 * two groups that are not sampled.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('show_sample')->default(true)->after('show_wastage');
            $table->boolean('show_big_sample')->default(true)->after('show_sample');
        });

        // Every category under Trade, plus Quads/Scotia wherever it sits.
        $trade = Category::whereNull('parent_id')->where('slug', 'trade')->first();

        $noSampleIds = collect();

        if ($trade) {
            $noSampleIds->push($trade->id);
            $noSampleIds = $noSampleIds->merge(
                Category::where('parent_id', $trade->id)->pluck('id')
            );
        }

        $noSampleIds = $noSampleIds->merge(
            Category::where('slug', 'like', '%quad%')
                ->orWhere('slug', 'like', '%scotia%')
                ->orWhere('name', 'like', '%Quads%')
                ->orWhere('name', 'like', '%Scotia%')
                ->pluck('id')
        )->unique()->values();

        if ($noSampleIds->isEmpty()) {
            return;
        }

        // Both the single category_id and the many-to-many, since a product can
        // be filed either way.
        Product::whereIn('category_id', $noSampleIds)
            ->orWhereHas('categories', fn ($q) => $q->whereIn('categories.id', $noSampleIds))
            ->update(['show_sample' => false]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['show_sample', 'show_big_sample']);
        });
    }
};
