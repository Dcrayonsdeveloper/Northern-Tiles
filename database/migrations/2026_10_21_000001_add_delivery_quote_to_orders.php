<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Records the delivery quote for a tiles order.
 *
 * Tile delivery is no longer charged at checkout: the customer pays for the
 * goods, and the team quotes delivery to their address afterwards and collects
 * it by phone or invoice. These columns hold that quote and when it was paid.
 *
 * Kept apart from shipping_cost and total on purpose. Those are what the card
 * was charged, and the Stripe webhook checks the amount it received against
 * total -- folding a later quote into it would make every paid order look
 * underpaid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'delivery_quote')) {
                $table->decimal('delivery_quote', 10, 2)->nullable()->after('shipping_method');
            }

            if (! Schema::hasColumn('orders', 'delivery_quote_paid_at')) {
                $table->timestamp('delivery_quote_paid_at')->nullable()->after('delivery_quote');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            foreach (['delivery_quote_paid_at', 'delivery_quote'] as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
