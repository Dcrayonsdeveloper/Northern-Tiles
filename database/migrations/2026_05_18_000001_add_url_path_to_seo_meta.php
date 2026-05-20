<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Make model_type and model_id nullable to support URL-path-based records
        DB::statement('ALTER TABLE seo_meta MODIFY COLUMN model_type VARCHAR(100) NULL DEFAULT NULL');
        DB::statement('ALTER TABLE seo_meta MODIFY COLUMN model_id BIGINT UNSIGNED NULL DEFAULT NULL');

        Schema::table('seo_meta', function (Blueprint $table) {
            $table->string('url_path', 500)->nullable()->unique()->after('model_id');
        });
    }

    public function down(): void
    {
        Schema::table('seo_meta', function (Blueprint $table) {
            $table->dropColumn('url_path');
        });

        DB::statement('ALTER TABLE seo_meta MODIFY COLUMN model_type VARCHAR(100) NOT NULL');
        DB::statement('ALTER TABLE seo_meta MODIFY COLUMN model_id BIGINT UNSIGNED NOT NULL');
    }
};
