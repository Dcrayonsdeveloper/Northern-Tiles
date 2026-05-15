<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // is_active is used in WHERE on almost every product query
            if (!$this->indexExists('products', 'products_is_active_index')) {
                $table->index('is_active', 'products_is_active_index');
            }
            // Composite index for the most common query: is_active + status
            if (!$this->indexExists('products', 'products_is_active_status_index')) {
                $table->index(['is_active', 'status'], 'products_is_active_status_index');
            }
            // Composite for listing queries: is_active + id DESC (default sort)
            if (!$this->indexExists('products', 'products_is_active_id_index')) {
                $table->index(['is_active', 'id'], 'products_is_active_id_index');
            }
        });

        // category_id on products for category filter queries
        Schema::table('products', function (Blueprint $table) {
            if (!$this->indexExists('products', 'products_is_active_category_index')) {
                $table->index(['is_active', 'category_id'], 'products_is_active_category_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndexIfExists('products_is_active_index');
            $table->dropIndexIfExists('products_is_active_status_index');
            $table->dropIndexIfExists('products_is_active_id_index');
            $table->dropIndexIfExists('products_is_active_category_index');
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        $indexes = \DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index]);
        return !empty($indexes);
    }
};
