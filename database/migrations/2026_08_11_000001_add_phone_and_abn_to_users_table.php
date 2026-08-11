<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Trade applications ask for a phone number and an ABN, but the users table had
 * nowhere to put either — the sign-up form validated `phone` and then dropped it
 * on the floor. Both columns are nullable so existing rows (and admin-issued
 * accounts) stay valid; the "compulsory" part is enforced at the form layer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->after('email_verified_at');
            // 11 digits, stored without spaces. Nullable because retail
            // customers and legacy builder rows do not have one.
            $table->string('builder_abn', 20)->nullable()->after('builder_company');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'builder_abn']);
        });
    }
};
