<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variant_families', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('position')->default(0);
            // Admin-only metadata: which member is the "hero" of the family.
            $table->foreignId('default_product_id')->nullable()
                ->constrained('products')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            // constrained() already creates the index MySQL needs for the FK.
            $table->foreignId('variant_family_id')->nullable()->after('category_id')
                ->constrained('variant_families')->nullOnDelete();
            $table->unsignedInteger('variant_family_position')->default(0)->after('variant_family_id');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['variant_family_id']);
            $table->dropColumn(['variant_family_id', 'variant_family_position']);
        });

        Schema::dropIfExists('variant_families');
    }
};
