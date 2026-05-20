<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Guard: skip if the index already exists (may have been created manually or by a previous migration).
        $exists = DB::selectOne(
            "SELECT 1 FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'products'
               AND INDEX_NAME = 'products_fulltext_search'
             LIMIT 1"
        );

        if (!$exists) {
            DB::statement('ALTER TABLE products ADD FULLTEXT INDEX products_fulltext_search (name, sku, brand, short_description)');
        }
    }

    public function down(): void
    {
        $exists = DB::selectOne(
            "SELECT 1 FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'products'
               AND INDEX_NAME = 'products_fulltext_search'
             LIMIT 1"
        );

        if ($exists) {
            DB::statement('ALTER TABLE products DROP INDEX products_fulltext_search');
        }
    }
};
