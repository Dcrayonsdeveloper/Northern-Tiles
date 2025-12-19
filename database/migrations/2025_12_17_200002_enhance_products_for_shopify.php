<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Dictionary keys for i18n
            if (!Schema::hasColumn('products', 'name_key')) {
                $table->string('name_key', 191)->nullable()->after('name');
            }
            if (!Schema::hasColumn('products', 'short_description_key')) {
                $table->string('short_description_key', 191)->nullable()->after('short_description');
            }

            // Status and publishing
            if (!Schema::hasColumn('products', 'status')) {
                $table->enum('status', ['draft', 'published', 'scheduled', 'archived'])->default('draft')->after('is_active');
            }
            if (!Schema::hasColumn('products', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('status');
            }

            // Rich description (JSON for block editor)
            if (!Schema::hasColumn('products', 'description_json')) {
                $table->json('description_json')->nullable()->after('description');
            }

            // Product type and digital flag
            if (!Schema::hasColumn('products', 'product_type')) {
                $table->string('product_type', 100)->nullable()->after('brand');
            }
            if (!Schema::hasColumn('products', 'is_digital')) {
                $table->boolean('is_digital')->default(false)->after('product_type');
            }

            // Currency
            if (!Schema::hasColumn('products', 'default_currency')) {
                $table->char('default_currency', 3)->default('INR')->after('is_digital');
            }

            // SEO fields with dictionary keys
            if (!Schema::hasColumn('products', 'seo_title_key')) {
                $table->string('seo_title_key', 191)->nullable()->after('canonical_url');
            }
            if (!Schema::hasColumn('products', 'seo_description_key')) {
                $table->string('seo_description_key', 191)->nullable()->after('seo_title_key');
            }
            if (!Schema::hasColumn('products', 'og_image_path')) {
                $table->string('og_image_path')->nullable()->after('seo_description_key');
            }

            // Audit fields
            if (!Schema::hasColumn('products', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('seller_id');
            }
            if (!Schema::hasColumn('products', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('created_by');
            }

            // Dimensions
            if (!Schema::hasColumn('products', 'length_mm')) {
                $table->unsignedInteger('length_mm')->nullable()->after('weight');
            }
            if (!Schema::hasColumn('products', 'width_mm')) {
                $table->unsignedInteger('width_mm')->nullable()->after('length_mm');
            }
            if (!Schema::hasColumn('products', 'height_mm')) {
                $table->unsignedInteger('height_mm')->nullable()->after('width_mm');
            }

            // Shipping
            if (!Schema::hasColumn('products', 'requires_shipping')) {
                $table->boolean('requires_shipping')->default(true)->after('height_mm');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasIndex('products', 'products_status_index')) {
                $table->index('status');
            }
            if (!Schema::hasIndex('products', 'products_published_at_index')) {
                $table->index('published_at');
            }
            if (!Schema::hasIndex('products', 'products_seller_status_index')) {
                $table->index(['seller_id', 'status']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = [
                'name_key', 'short_description_key', 'status', 'published_at',
                'description_json', 'product_type', 'is_digital', 'default_currency',
                'seo_title_key', 'seo_description_key', 'og_image_path',
                'created_by', 'updated_by', 'length_mm', 'width_mm', 'height_mm',
                'requires_shipping'
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('products', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
