<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Change status from enum to varchar for more flexibility
        Schema::table('pages', function (Blueprint $table) {
            $table->string('status', 20)->default('draft')->change();
        });
    }

    public function down(): void
    {
        // Revert non-standard statuses before changing back to enum
        DB::statement("UPDATE pages SET status = 'draft' WHERE status NOT IN ('draft', 'published')");

        Schema::table('pages', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published'])->default('draft')->change();
        });
    }
};
