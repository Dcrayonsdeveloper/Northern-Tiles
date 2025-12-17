<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            // Parent-child hierarchy
            $table->foreignId('parent_id')->nullable()->after('id')->constrained('pages')->nullOnDelete();
            $table->string('full_slug', 500)->nullable()->after('slug');

            // Enhanced status (convert enum to string for flexibility)
            // Note: We'll handle enum change separately

            // Additional SEO fields
            $table->string('og_image', 500)->nullable()->after('canonical_url');
            $table->boolean('robots_follow')->default(true)->after('noindex');

            // Sort order
            $table->integer('sort')->default(0)->after('robots_follow');

            // Audit fields
            $table->foreignId('created_by')->nullable()->after('sort')->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();

            // Soft deletes
            $table->softDeletes();

            // Indexes
            $table->unique('full_slug');
            $table->index(['parent_id', 'slug']);
            $table->index('deleted_at');
            $table->index('sort');
        });

        // Migrate existing slugs to full_slug
        DB::statement('UPDATE pages SET full_slug = slug WHERE full_slug IS NULL');
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);

            $table->dropUnique(['full_slug']);
            $table->dropIndex(['parent_id', 'slug']);
            $table->dropIndex(['deleted_at']);
            $table->dropIndex(['sort']);

            $table->dropColumn([
                'parent_id',
                'full_slug',
                'og_image',
                'robots_follow',
                'sort',
                'created_by',
                'updated_by',
                'deleted_at',
            ]);
        });
    }
};
