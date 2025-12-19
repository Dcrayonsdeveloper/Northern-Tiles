<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            // Update type enum if needed (drop and recreate)
            if (Schema::hasColumn('tags', 'type')) {
                $table->dropColumn('type');
            }
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->enum('type', ['manual', 'generated', 'system'])->default('manual')->after('slug');
            $table->enum('source', ['user', 'ai', 'import', 'rule'])->default('user')->after('type');
            if (!Schema::hasColumn('tags', 'confidence')) {
                $table->decimal('confidence', 5, 2)->nullable()->after('source');
            }
            if (!Schema::hasColumn('tags', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('confidence');
            }
        });

        Schema::table('tags', function (Blueprint $table) {
            if (!Schema::hasIndex('tags', 'tags_source_index')) {
                $table->index('source');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->dropColumn(['source', 'confidence', 'created_by']);
            $table->dropColumn('type');
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->enum('type', ['manual', 'auto'])->default('manual')->after('slug');
        });
    }
};
