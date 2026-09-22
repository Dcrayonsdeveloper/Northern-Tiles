<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Gives the taggables pivot the updated_at column its relations already assume.
 *
 * Product::tags(), Post::tags(), Tag::products() and Tag::posts() all declare
 * withTimestamps(), which selects created_at AND updated_at. The table was
 * created with created_at only, so every one of those relations threw
 * "Unknown column 'taggables.updated_at'" — the blog post editor 500'd on it,
 * and any product query eager-loading tags would have done the same.
 *
 * Adding the column rather than dropping withTimestamps() from four relations:
 * that would leave attach() unable to stamp a row at all, and the schema is the
 * side that is incomplete here.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('taggables', 'updated_at')) {
            return;
        }

        Schema::table('taggables', function (Blueprint $table) {
            $table->timestamp('updated_at')->nullable()->after('created_at');
        });

        // Existing rows were written before the column existed; seeding it from
        // created_at is truer than leaving 1843 rows with a null modified date.
        DB::table('taggables')->whereNull('updated_at')->update([
            'updated_at' => DB::raw('created_at'),
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasColumn('taggables', 'updated_at')) {
            return;
        }

        Schema::table('taggables', function (Blueprint $table) {
            $table->dropColumn('updated_at');
        });
    }
};
