<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Second half of the cart channel split. Prevents concurrent add-to-cart
 * requests from producing two live cart rows for the same (identity, channel).
 *
 * Cart::getOrCreate is SELECT-then-INSERT with no transaction — two POSTs
 * arriving within milliseconds (double-click, or the retail+trade tab pattern
 * the split now encourages) both miss the SELECT and both create a fresh row.
 * The active() scope has no orderBy() so subsequent reads pick between the
 * duplicates at random; items scatter across carts, the badge undercounts, and
 * checkout only totals one row.
 *
 * Fix: dedupe first (keep the newest, move items onto it, delete the losers),
 * then add UNIQUE indexes that make a second concurrent INSERT fail loudly at
 * the DB — Cart::getOrCreate now catches that error and re-reads.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Dedupe user-owned carts per channel. Keep the newest row, migrate
        // items onto it from the losers, delete the losers.
        $userDupes = DB::table('carts')
            ->select('user_id', 'channel')
            ->whereNotNull('user_id')
            ->groupBy('user_id', 'channel')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($userDupes as $g) {
            $rows = DB::table('carts')
                ->where('user_id', $g->user_id)
                ->where('channel', $g->channel)
                ->orderByDesc('id')
                ->pluck('id');
            $keep = $rows->first();
            $drop = $rows->skip(1)->all();
            DB::table('cart_items')->whereIn('cart_id', $drop)->update(['cart_id' => $keep]);
            DB::table('carts')->whereIn('id', $drop)->delete();
        }

        // Same for guest carts.
        $guestDupes = DB::table('carts')
            ->select('session_id', 'channel')
            ->whereNull('user_id')
            ->whereNotNull('session_id')
            ->groupBy('session_id', 'channel')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($guestDupes as $g) {
            $rows = DB::table('carts')
                ->whereNull('user_id')
                ->where('session_id', $g->session_id)
                ->where('channel', $g->channel)
                ->orderByDesc('id')
                ->pluck('id');
            $keep = $rows->first();
            $drop = $rows->skip(1)->all();
            DB::table('cart_items')->whereIn('cart_id', $drop)->update(['cart_id' => $keep]);
            DB::table('carts')->whereIn('id', $drop)->delete();
        }

        Schema::table('carts', function (Blueprint $t) {
            // MySQL doesn't support partial unique indexes, so uniqueness is
            // enforced on the full (user_id, channel) pair. A NULL user_id
            // (guest) never conflicts with another NULL, so guest rows land
            // on the session_id uniqueness instead.
            $t->unique(['user_id', 'channel'], 'carts_user_channel_unique');
            $t->unique(['session_id', 'channel'], 'carts_session_channel_unique');
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $t) {
            $t->dropUnique('carts_user_channel_unique');
            $t->dropUnique('carts_session_channel_unique');
        });
    }
};
