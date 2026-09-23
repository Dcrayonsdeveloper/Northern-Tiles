<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Remembers that a customer removed the automatic discount.
 *
 * autoApplyBestCoupon() runs on every cart change and on every checkout page
 * load, so removing an auto-apply coupon put it straight back on the next
 * render: the customer clicked the x, saw "Coupon removed successfully", and
 * watched the discount reappear. Without somewhere to record the decision there
 * is no way to tell "no coupon yet" apart from "no coupon, by choice".
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('carts', 'auto_coupon_declined')) {
            return;
        }

        Schema::table('carts', function (Blueprint $table) {
            $table->boolean('auto_coupon_declined')->default(false)->after('discount_amount');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('carts', 'auto_coupon_declined')) {
            return;
        }

        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('auto_coupon_declined');
        });
    }
};
