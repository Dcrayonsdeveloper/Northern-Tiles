<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('not_found_logs', function (Blueprint $table) {
            $table->boolean('is_ignored')->default(false)->after('is_resolved');
        });
    }

    public function down(): void
    {
        Schema::table('not_found_logs', function (Blueprint $table) {
            $table->dropColumn('is_ignored');
        });
    }
};
