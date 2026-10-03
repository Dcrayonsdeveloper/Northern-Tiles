<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Clears saved admin dashboard layouts and settles the widget order.
 *
 * A saved layout pins per-widget overrides by key — sort, width, and a range.
 * The layouts on this install were saved against the old four-widget page, so
 * after the rebuild they ordered a handful of widgets by yesterday's numbers
 * while the new ones fell back to defaults, interleaving the two. The range
 * override was worse: it beat the page's range tabs outright, so the KPI row
 * answered for a pinned period no matter which tab was selected. That override
 * no longer applies (DashboardService now takes the page range), and clearing
 * the layouts puts every admin on the rebuilt arrangement.
 *
 * Seller layouts are left alone — nothing about their page changed.
 */
return new class extends Migration
{
    /** Three thirds in one row, then the orders table full width beneath. */
    private const SORTS = [
        'admin.revenue_overview' => 10,
        'admin.revenue_trend' => 20,
        'admin.orders_by_status_global' => 30,
        'admin.performance' => 40,
        'admin.top_products' => 50,
        'admin.recent_orders' => 60,
    ];

    public function up(): void
    {
        foreach (self::SORTS as $key => $sort) {
            DB::table('dashboard_widgets')
                ->where('widget_key', $key)
                ->update(['default_sort' => $sort, 'updated_at' => now()]);
        }

        DB::table('dashboard_layouts')
            ->where('scope_type', 'role')
            ->where('scope_id', 'admin')
            ->delete();

        $adminIds = DB::table('users')->where('is_admin', true)->pluck('id')->map('strval')->all();

        if (! empty($adminIds)) {
            DB::table('dashboard_layouts')
                ->where('scope_type', 'user')
                ->whereIn('scope_id', $adminIds)
                ->delete();
        }
    }

    public function down(): void
    {
        // A deleted layout cannot be restored, and the arrangement it held was
        // for a page that no longer exists. Nothing to undo.
    }
};
