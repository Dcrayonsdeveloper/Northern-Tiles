<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            if (!Schema::hasColumn('product_variants', 'barcode')) {
                $table->string('barcode', 100)->nullable()->after('sku');
            }
            if (!Schema::hasColumn('product_variants', 'currency')) {
                $table->char('currency', 3)->default('INR')->after('cost');
            }
            if (!Schema::hasColumn('product_variants', 'track_inventory')) {
                $table->boolean('track_inventory')->default(true)->after('inventory_policy');
            }
            if (!Schema::hasColumn('product_variants', 'requires_shipping')) {
                $table->boolean('requires_shipping')->default(true)->after('track_inventory');
            }
            if (!Schema::hasColumn('product_variants', 'weight_grams')) {
                $table->unsignedInteger('weight_grams')->nullable()->after('requires_shipping');
            }
            if (!Schema::hasColumn('product_variants', 'length_mm')) {
                $table->unsignedInteger('length_mm')->nullable()->after('weight_grams');
            }
            if (!Schema::hasColumn('product_variants', 'width_mm')) {
                $table->unsignedInteger('width_mm')->nullable()->after('length_mm');
            }
            if (!Schema::hasColumn('product_variants', 'height_mm')) {
                $table->unsignedInteger('height_mm')->nullable()->after('width_mm');
            }
            if (!Schema::hasColumn('product_variants', 'is_default')) {
                $table->boolean('is_default')->default(false)->after('is_active');
            }
        });

        // Create pivot for variant option values
        Schema::create('variant_option_value', function (Blueprint $table) {
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('product_option_value_id')->constrained()->cascadeOnDelete();
            $table->primary(['variant_id', 'product_option_value_id']);
        });

        // Create pivot for variant media
        Schema::create('variant_media', function (Blueprint $table) {
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('product_media_id')->constrained()->cascadeOnDelete();
            $table->primary(['variant_id', 'product_media_id']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            if (!Schema::hasIndex('product_variants', 'product_variants_is_default_index')) {
                $table->index(['product_id', 'is_default']);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variant_media');
        Schema::dropIfExists('variant_option_value');

        Schema::table('product_variants', function (Blueprint $table) {
            $columns = ['barcode', 'currency', 'track_inventory', 'requires_shipping', 'weight_grams', 'length_mm', 'width_mm', 'height_mm', 'is_default'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('product_variants', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
