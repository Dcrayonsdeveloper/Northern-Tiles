<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'variant_id')) {
                $table->foreignId('variant_id')->nullable()->after('product_id');
            }
            if (!Schema::hasColumn('order_items', 'seller_id')) {
                $table->foreignId('seller_id')->nullable()->after('variant_id');
            }
            if (!Schema::hasColumn('order_items', 'name')) {
                $table->string('name', 191)->nullable()->after('seller_id');
            }
            if (!Schema::hasColumn('order_items', 'sku')) {
                $table->string('sku', 100)->nullable()->after('name');
            }
            if (!Schema::hasColumn('order_items', 'tax')) {
                $table->decimal('tax', 10, 2)->default(0)->after('price');
            }
            if (!Schema::hasColumn('order_items', 'options_json')) {
                $table->json('options_json')->nullable()->after('tax');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasIndex('order_items', 'order_items_seller_id_index')) {
                $table->index('seller_id');
            }
            if (!Schema::hasIndex('order_items', 'order_items_variant_id_index')) {
                $table->index('variant_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $columns = ['variant_id', 'seller_id', 'name', 'sku', 'tax', 'options_json'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('order_items', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
