<?php

namespace Database\Seeders;

use App\Domain\Dashboard\Models\Announcement;
use App\Domain\Dashboard\Models\DashboardLayout;
use App\Domain\Dashboard\Models\DashboardWidget;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DashboardSeeder extends Seeder
{
    public function run(): void
    {
        $seller = User::query()->firstOrNew(['email' => 'seller@example.com']);
        $seller->name = 'Seller';
        $seller->password = Hash::make('password');
        $seller->email_verified_at = now();
        $seller->is_admin = false;
        $seller->is_seller = true;
        $seller->save();

        $productIds = Product::query()
            ->whereNull('seller_id')
            ->orderBy('id')
            ->limit(3)
            ->pluck('id')
            ->all();

        if (!empty($productIds)) {
            Product::query()
                ->whereIn('id', $productIds)
                ->update(['seller_id' => $seller->id]);
        }

        $widgets = [
            [
                'widget_key' => 'admin.revenue_overview',
                'role_scope' => ['admin'],
                'title_key' => 'dash.admin.revenue_overview',
                'description_key' => null,
                'component_view' => 'RevenueOverview',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 10,
                'supports_date_range' => true,
                'cache_ttl_seconds' => 300,
            ],
            [
                'widget_key' => 'admin.orders_by_status_global',
                'role_scope' => ['admin'],
                'title_key' => 'dash.admin.orders_by_status',
                'description_key' => null,
                'component_view' => 'OrdersByStatus',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 20,
                'supports_date_range' => true,
                'cache_ttl_seconds' => 300,
            ],
            [
                'widget_key' => 'admin.top_sellers',
                'role_scope' => ['admin'],
                'title_key' => 'dash.admin.top_sellers',
                'description_key' => null,
                'component_view' => 'TopSellers',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 30,
                'supports_date_range' => true,
                'cache_ttl_seconds' => 600,
            ],
            [
                'widget_key' => 'admin.system_health',
                'role_scope' => ['admin'],
                'title_key' => 'dash.admin.system_health',
                'description_key' => null,
                'component_view' => 'SystemHealth',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 90,
                'supports_date_range' => false,
                'cache_ttl_seconds' => 600,
            ],
            [
                'widget_key' => 'admin.announcements',
                'role_scope' => ['admin'],
                'title_key' => 'dash.common.announcements',
                'description_key' => null,
                'component_view' => 'Announcements',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 100,
                'supports_date_range' => false,
                'cache_ttl_seconds' => 60,
            ],

            [
                'widget_key' => 'seller.sales_kpi',
                'role_scope' => ['seller'],
                'title_key' => 'dash.seller.sales_kpi',
                'description_key' => null,
                'component_view' => 'SalesKpi',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 10,
                'supports_date_range' => true,
                'cache_ttl_seconds' => 300,
            ],
            [
                'widget_key' => 'seller.orders_summary',
                'role_scope' => ['seller'],
                'title_key' => 'dash.seller.orders_summary',
                'description_key' => null,
                'component_view' => 'OrdersSummary',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 20,
                'supports_date_range' => true,
                'cache_ttl_seconds' => 300,
            ],
            [
                'widget_key' => 'seller.top_products',
                'role_scope' => ['seller'],
                'title_key' => 'dash.seller.top_products',
                'description_key' => null,
                'component_view' => 'TopProducts',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 30,
                'supports_date_range' => true,
                'cache_ttl_seconds' => 600,
            ],
            [
                'widget_key' => 'seller.low_stock_alerts',
                'role_scope' => ['seller'],
                'title_key' => 'dash.seller.low_stock',
                'description_key' => null,
                'component_view' => 'LowStock',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 40,
                'supports_date_range' => false,
                'cache_ttl_seconds' => 120,
            ],
            [
                'widget_key' => 'seller.announcements',
                'role_scope' => ['seller'],
                'title_key' => 'dash.common.announcements',
                'description_key' => null,
                'component_view' => 'Announcements',
                'permissions' => null,
                'default_enabled' => true,
                'default_sort' => 100,
                'supports_date_range' => false,
                'cache_ttl_seconds' => 60,
            ],
        ];

        foreach ($widgets as $w) {
            DashboardWidget::query()->updateOrCreate(
                ['widget_key' => $w['widget_key']],
                $w,
            );
        }

        DashboardLayout::query()->updateOrCreate(
            ['scope_type' => 'role', 'scope_id' => 'admin'],
            [
                'layout_json' => [
                    ['widget_key' => 'admin.revenue_overview', 'enabled' => true, 'sort' => 10, 'width' => 'full', 'range' => '30d'],
                    ['widget_key' => 'admin.orders_by_status_global', 'enabled' => true, 'sort' => 20, 'width' => 'half', 'range' => '30d'],
                    ['widget_key' => 'admin.top_sellers', 'enabled' => true, 'sort' => 30, 'width' => 'half', 'range' => '30d'],
                    ['widget_key' => 'admin.system_health', 'enabled' => true, 'sort' => 90, 'width' => 'third'],
                    ['widget_key' => 'admin.announcements', 'enabled' => true, 'sort' => 100, 'width' => 'third'],
                ],
            ],
        );

        DashboardLayout::query()->updateOrCreate(
            ['scope_type' => 'role', 'scope_id' => 'seller'],
            [
                'layout_json' => [
                    ['widget_key' => 'seller.sales_kpi', 'enabled' => true, 'sort' => 10, 'width' => 'full', 'range' => '30d'],
                    ['widget_key' => 'seller.orders_summary', 'enabled' => true, 'sort' => 20, 'width' => 'half', 'range' => '30d'],
                    ['widget_key' => 'seller.top_products', 'enabled' => true, 'sort' => 30, 'width' => 'half', 'range' => '30d'],
                    ['widget_key' => 'seller.low_stock_alerts', 'enabled' => true, 'sort' => 40, 'width' => 'third'],
                    ['widget_key' => 'seller.announcements', 'enabled' => true, 'sort' => 100, 'width' => 'third'],
                ],
            ],
        );

        Announcement::query()->firstOrCreate(
            ['title' => 'Welcome'],
            [
                'body_html' => '<p>Welcome to the dashboard.</p>',
                'audience' => ['admin', 'seller'],
                'is_active' => true,
            ],
        );
    }
}
