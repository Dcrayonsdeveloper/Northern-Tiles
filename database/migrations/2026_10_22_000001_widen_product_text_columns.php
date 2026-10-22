<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets the products table hold what the product forms accept.
 *
 * StoreProductRequest and UpdateProductRequest allow 500 characters for the
 * short description and both image urls, but the columns were 255. Anything
 * in between passed validation and then failed the insert, so Save on the
 * product editor answered with a bare 500 and lost the admin's work.
 *
 * short_description sits in the products_fulltext_search index; MODIFY keeps
 * the index, it is rebuilt with the table.
 */
return new class extends Migration
{
    private const COLUMNS = ['short_description', 'image_url', 'lifestyle_image_url'];

    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            foreach (self::COLUMNS as $column) {
                $table->string($column, 500)->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            foreach (self::COLUMNS as $column) {
                $table->string($column, 255)->nullable()->change();
            }
        });
    }
};
