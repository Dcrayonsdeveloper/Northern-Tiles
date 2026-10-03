<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Registers the rebuilt admin dashboard widgets.
 *
 * The widget registry lives in the database, not in code, so new widgets have
 * to be inserted wherever the app already runs — the seeder only covers a fresh
 * install, and production was seeded months ago. A migration is the one path
 * that reaches an existing environment on deploy.
 */
return new class extends Migration
{
    private const WIDGETS = [
        [
            'widget_key' => 'admin.revenue_overview',
            'title_key' => 'dash.admin.revenue_overview',
            'component_view' => 'RevenueOverview',
            'default_sort' => 10,
            'supports_date_range' => true,
            'cache_ttl_seconds' => 300,
        ],
        [
            'widget_key' => 'admin.revenue_trend',
            'title_key' => 'dash.admin.revenue_trend',
            'component_view' => 'RevenueTrend',
            'default_sort' => 20,
            'supports_date_range' => true,
            'cache_ttl_seconds' => 300,
        ],
        [
            'widget_key' => 'admin.orders_by_status_global',
            'title_key' => 'dash.admin.orders_by_status',
            'component_view' => 'OrdersByStatus',
            'default_sort' => 30,
            'supports_date_range' => true,
            'cache_ttl_seconds' => 300,
        ],
        [
            'widget_key' => 'admin.performance',
            'title_key' => 'dash.admin.performance',
            'component_view' => 'Performance',
            'default_sort' => 40,
            'supports_date_range' => true,
            'cache_ttl_seconds' => 300,
        ],
        [
            'widget_key' => 'admin.recent_orders',
            'title_key' => 'dash.admin.recent_orders',
            'component_view' => 'RecentOrders',
            'default_sort' => 50,
            'supports_date_range' => false,
            'cache_ttl_seconds' => 120,
        ],
        [
            'widget_key' => 'admin.top_products',
            'title_key' => 'dash.admin.top_products',
            'component_view' => 'TopProducts',
            'default_sort' => 60,
            'supports_date_range' => true,
            'cache_ttl_seconds' => 600,
        ],
    ];

    public function up(): void
    {
        foreach (self::WIDGETS as $widget) {
            DB::table('dashboard_widgets')->updateOrInsert(
                ['widget_key' => $widget['widget_key']],
                [
                    'role_scope' => json_encode(['admin']),
                    'title_key' => $widget['title_key'],
                    'description_key' => null,
                    'component_view' => $widget['component_view'],
                    'permissions' => null,
                    'default_enabled' => true,
                    'default_sort' => $widget['default_sort'],
                    'supports_date_range' => $widget['supports_date_range'],
                    'cache_ttl_seconds' => $widget['cache_ttl_seconds'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );
        }

        // Top Sellers is off, not deleted. This catalogue has no sellers —
        // every product's vendor is blank — so the widget rendered "No sellers
        // yet" forever, occupying a third of the dashboard to say nothing. The
        // row stays so an admin who does onboard sellers can switch it back on
        // from the Widgets screen.
        DB::table('dashboard_widgets')
            ->where('widget_key', 'admin.top_sellers')
            ->update(['default_enabled' => false, 'updated_at' => now()]);

        // Saved layouts pin per-widget overrides by key. A layout saved before
        // these existed has no row for them, which the service reads as the
        // default (on) — so nothing needs rewriting here.
        //
        // The widget data cache keys on widget + range and would otherwise
        // serve the old payload shape to the new components; deploys run
        // `optimize:clear` ahead of migrating, which flushes it.
    }

    public function down(): void
    {
        DB::table('dashboard_widgets')
            ->whereIn('widget_key', [
                'admin.revenue_trend',
                'admin.recent_orders',
                'admin.top_products',
                'admin.performance',
            ])
            ->delete();

        DB::table('dashboard_widgets')
            ->where('widget_key', 'admin.top_sellers')
            ->update(['default_enabled' => true, 'updated_at' => now()]);
    }
};
