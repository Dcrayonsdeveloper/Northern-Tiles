<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Stamped at checkout so trade orders stay identifiable in admin
            // even if the account later loses its builder flag.
            $table->boolean('is_builder_order')->default(false)->after('user_id');
            $table->index('is_builder_order');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['is_builder_order']);
            $table->dropColumn('is_builder_order');
        });
    }
};
