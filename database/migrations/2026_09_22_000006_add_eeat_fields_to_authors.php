<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gives the author table the fields its own edit form already collects.
 *
 * The form posts credentials, expertise areas and a verified flag — the E-E-A-T
 * block — but none of them had a column, a validation rule or a line in the
 * controller, so every one was discarded on save and came back empty on the
 * next edit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            if (! Schema::hasColumn('authors', 'credentials')) {
                $table->text('credentials')->nullable()->after('job_title');
            }

            if (! Schema::hasColumn('authors', 'expertise_json')) {
                $table->json('expertise_json')->nullable()->after('credentials');
            }

            if (! Schema::hasColumn('authors', 'is_verified')) {
                $table->boolean('is_verified')->default(false)->after('expertise_json');
            }
        });
    }

    public function down(): void
    {
        Schema::table('authors', function (Blueprint $table) {
            $table->dropColumn(['credentials', 'expertise_json', 'is_verified']);
        });
    }
};
