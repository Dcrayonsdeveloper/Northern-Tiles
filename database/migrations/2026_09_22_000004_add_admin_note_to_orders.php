<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A private note staff can leave on an order.
 *
 * Deliberately separate from orders.notes, which is what the customer typed at
 * checkout — mixing the two would put staff remarks in front of the customer
 * and lose the delivery instruction they actually wrote.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('orders', 'admin_note')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->text('admin_note')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('orders', 'admin_note')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('admin_note');
        });
    }
};
