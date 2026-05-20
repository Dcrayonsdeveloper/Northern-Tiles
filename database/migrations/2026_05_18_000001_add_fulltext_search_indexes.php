<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Composite FULLTEXT index over every searchable product field.
        // The column list here must exactly match the MATCH() call in SearchController.
        Schema::table('products', function (Blueprint $table) {
            $table->fullText(
                ['name', 'sku', 'brand', 'short_description'],
                'products_fulltext_search'
            );
        });

        // FULLTEXT on category name for instant category autocomplete.
        Schema::table('categories', function (Blueprint $table) {
            $table->fullText(['name'], 'categories_fulltext_search');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_fulltext_search');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('categories_fulltext_search');
        });
    }
};
