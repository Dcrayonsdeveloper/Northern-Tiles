<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Normalised attribute values — each colour, size, finish etc. is now a
        // queryable row instead of being buried inside attributes.values_json.
        Schema::create('attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained()->cascadeOnDelete();
            $table->string('value', 100);
            $table->string('slug', 100);
            $table->json('meta_json')->nullable(); // hex for colours, image URL for spaces, etc.
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['attribute_id', 'slug']);
            $table->index('is_active');
        });

        // Many-to-many between products and attribute values. A product can be
        // tagged "white" AND "light grey" under colour, plus "matt" under finish.
        Schema::create('product_attribute_value', function (Blueprint $table) {
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attribute_value_id')->constrained()->cascadeOnDelete();
            $table->primary(['product_id', 'attribute_value_id']);
            $table->index('attribute_value_id');
        });

        // values_json was the legacy inline storage; replaced by attribute_values.
        if (Schema::hasColumn('attributes', 'values_json')) {
            Schema::table('attributes', function (Blueprint $table) {
                $table->dropColumn('values_json');
            });
        }
    }

    public function down(): void
    {
        Schema::table('attributes', function (Blueprint $table) {
            if (! Schema::hasColumn('attributes', 'values_json')) {
                $table->json('values_json')->nullable()->after('type');
            }
        });

        Schema::dropIfExists('product_attribute_value');
        Schema::dropIfExists('attribute_values');
    }
};
