<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links an order back to the cart it came from.
 *
 * Checkout used to empty the cart the moment the order row was written, which
 * was correct while an order meant a sale. Card orders are now created before
 * payment, so that emptied the basket of anyone who reached the Stripe screen
 * and came back without paying — they returned to a cart with nothing in it
 * and no way to recover what they had chosen.
 *
 * The cart now survives until the payment actually succeeds, and this column
 * is what lets the webhook clear it. The webhook has no session and no cookie
 * — it arrives from Stripe — so without a link stored on the order there is
 * no way to find the right cart for a guest.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'cart_id')) {
                $table->foreignId('cart_id')
                    ->nullable()
                    ->after('user_id')
                    ->constrained('carts')
                    // The cart is cleared and may be pruned later; losing it
                    // must never take the order with it.
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'cart_id')) {
                $table->dropConstrainedForeignId('cart_id');
            }
        });
    }
};
