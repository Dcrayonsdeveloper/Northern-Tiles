<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'name_key')) {
                $table->string('name_key', 191)->nullable()->after('name');
            }
            if (!Schema::hasColumn('categories', 'parent_id')) {
                $table->foreignId('parent_id')->nullable()->after('slug');
            }
            if (!Schema::hasColumn('categories', 'sort')) {
                $table->unsignedInteger('sort')->default(0)->after('parent_id');
            }
            if (!Schema::hasColumn('categories', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('sort');
            }
            if (!Schema::hasColumn('categories', 'image_path')) {
                $table->string('image_path')->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('categories', 'description_key')) {
                $table->string('description_key', 191)->nullable()->after('image_path');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasIndex('categories', 'categories_parent_id_index')) {
                $table->index('parent_id');
            }
            if (!Schema::hasIndex('categories', 'categories_is_active_index')) {
                $table->index('is_active');
            }
            if (!Schema::hasIndex('categories', 'categories_sort_index')) {
                $table->index('sort');
            }
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $columns = ['name_key', 'parent_id', 'sort', 'is_active', 'image_path', 'description_key'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('categories', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
