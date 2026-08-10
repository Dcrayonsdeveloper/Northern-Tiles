<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Trade / builder account flag. Gates access to the /builder portal
            // and switches the user onto builder pricing everywhere.
            $table->boolean('is_builder')->default(false)->after('is_seller');
            $table->string('builder_company')->nullable()->after('is_builder');
            $table->timestamp('builder_approved_at')->nullable()->after('builder_company');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('is_builder');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_builder']);
            $table->dropColumn(['is_builder', 'builder_company', 'builder_approved_at']);
        });
    }
};
