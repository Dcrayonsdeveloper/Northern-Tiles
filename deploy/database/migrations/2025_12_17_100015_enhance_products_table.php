<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'brand')) {
                $table->string('brand', 100)->nullable()->after('description');
            }
            if (!Schema::hasColumn('products', 'meta_title')) {
                $table->string('meta_title', 191)->nullable()->after('brand');
            }
            if (!Schema::hasColumn('products', 'meta_description')) {
                $table->text('meta_description')->nullable()->after('meta_title');
            }
            if (!Schema::hasColumn('products', 'canonical_url')) {
                $table->string('canonical_url')->nullable()->after('meta_description');
            }
            if (!Schema::hasColumn('products', 'attribute_set_id')) {
                $table->foreignId('attribute_set_id')->nullable()->after('category_id');
            }
            if (!Schema::hasColumn('products', 'noindex')) {
                $table->boolean('noindex')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('products', 'compare_at_price')) {
                $table->decimal('compare_at_price', 10, 2)->nullable()->after('price');
            }
            if (!Schema::hasColumn('products', 'cost')) {
                $table->decimal('cost', 10, 2)->nullable()->after('compare_at_price');
            }
            if (!Schema::hasColumn('products', 'inventory_quantity')) {
                $table->integer('inventory_quantity')->default(0)->after('cost');
            }
            if (!Schema::hasColumn('products', 'inventory_policy')) {
                $table->enum('inventory_policy', ['deny', 'continue'])->default('deny')->after('inventory_quantity');
            }
            if (!Schema::hasColumn('products', 'weight')) {
                $table->decimal('weight', 8, 2)->nullable()->after('inventory_policy');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasIndex('products', 'products_brand_index')) {
                $table->index('brand');
            }
            if (!Schema::hasIndex('products', 'products_attribute_set_id_index')) {
                $table->index('attribute_set_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = ['brand', 'meta_title', 'meta_description', 'canonical_url', 'attribute_set_id', 'noindex', 'compare_at_price', 'cost', 'inventory_quantity', 'inventory_policy', 'weight'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('products', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
