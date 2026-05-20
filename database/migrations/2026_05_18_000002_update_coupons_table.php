<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->unsignedSmallInteger('buy_quantity')->nullable()->after('type');
            $table->unsignedSmallInteger('get_quantity')->nullable()->after('buy_quantity');
        });

        // Make title nullable — Blueprint::change() is supported in Laravel 12 without doctrine/dbal.
        // Using raw statement for maximum compatibility with InnoDB engines.
        DB::statement('ALTER TABLE coupons MODIFY COLUMN title VARCHAR(255) NULL');
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn(['buy_quantity', 'get_quantity']);
        });

        DB::statement('ALTER TABLE coupons MODIFY COLUMN title VARCHAR(255) NOT NULL DEFAULT \'\'');
    }
};
