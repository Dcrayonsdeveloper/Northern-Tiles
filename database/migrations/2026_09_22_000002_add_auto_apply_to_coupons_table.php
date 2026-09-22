<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Makes auto-apply an explicit, per-coupon choice.
 *
 * autoApplyBestCoupon() runs on every cart change and, until now, considered
 * EVERY active coupon — so a code meant to be handed out privately was applied
 * to every cart on the site whether the customer knew it or not. A coupon now
 * has to opt in.
 *
 * New coupons default to off, because "type the code to get the discount" is
 * what a coupon normally means. Existing rows are switched on so the site keeps
 * behaving exactly as it did today until someone decides otherwise.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('coupons', 'auto_apply')) {
            return;
        }

        Schema::table('coupons', function (Blueprint $table) {
            $table->boolean('auto_apply')->default(false)->after('is_active');
        });

        DB::table('coupons')->update(['auto_apply' => true]);
    }

    public function down(): void
    {
        if (! Schema::hasColumn('coupons', 'auto_apply')) {
            return;
        }

        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn('auto_apply');
        });
    }
};
