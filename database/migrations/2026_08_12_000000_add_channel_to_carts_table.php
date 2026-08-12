<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a `channel` column to carts so a single logged-in user can hold two
 * separate live carts at the same time: one for the retail storefront
 * (channel = 'retail') and one for the trade portal (channel = 'trade').
 *
 * Before this migration a builder had exactly one cart shared across both
 * panels, which meant items added in the trade portal spilled into the
 * retail cart (and vice versa) and pricing was resolved at addItem time
 * from the user's role instead of the surface they were browsing.
 *
 * Back-fill: every pre-existing row is 'retail' — the trade portal never
 * had its own cart writer, so no legitimate trade cart can exist yet.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $t) {
            $t->string('channel', 16)->default('retail')->after('vendor_id');
            $t->index(['user_id', 'channel', 'expires_at'], 'carts_user_channel_active_idx');
            $t->index(['session_id', 'channel'], 'carts_session_channel_idx');
        });

        DB::table('carts')->update(['channel' => 'retail']);
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $t) {
            $t->dropIndex('carts_user_channel_active_idx');
            $t->dropIndex('carts_session_channel_idx');
            $t->dropColumn('channel');
        });
    }
};
