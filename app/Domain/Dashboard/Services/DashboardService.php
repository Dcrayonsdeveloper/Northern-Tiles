<?php

namespace App\Domain\Dashboard\Services;

use App\Domain\Dashboard\Models\Announcement;
use App\Domain\Dashboard\Models\DashboardLayout;
use App\Domain\Dashboard\Models\DashboardWidget;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function widgetsForUser(User $user, string $rangeKey = '30d'): array
    {
        $roleKey = $this->roleKey($user);

        $widgets = DashboardWidget::query()
            ->get()
            ->filter(fn (DashboardWidget $w) => in_array($roleKey, (array) $w->role_scope, true))
            ->values();

        $layout = $this->layoutForUser($user, $roleKey);

        $layoutMap = collect($layout)->keyBy('widget_key');

        $items = $widgets->map(function (DashboardWidget $w) use ($layoutMap, $user, $roleKey, $rangeKey) {
            $override = (array) ($layoutMap->get($w->widget_key) ?? []);

            $enabled = Arr::get($override, 'enabled', $w->default_enabled);
            $sort = (int) Arr::get($override, 'sort', $w->default_sort);
            $width = (string) Arr::get($override, 'width', 'full');
            $ttlSeconds = (int) Arr::get($override, 'cache_ttl_seconds', $w->cache_ttl_seconds);

            $effectiveRangeKey = $w->supports_date_range
                ? (string) Arr::get($override, 'range', $rangeKey)
                : null;

            $data = $enabled
                ? $this->widgetData($user, $roleKey, $w->widget_key, $effectiveRangeKey, $ttlSeconds)
                : null;

            return [
                'widget_key' => $w->widget_key,
                'title_key' => $w->title_key,
                'description_key' => $w->description_key,
                'component' => $w->component_view,
                'supports_date_range' => (bool) $w->supports_date_range,
                'range' => $effectiveRangeKey,
                'cache_ttl_seconds' => $ttlSeconds,
                'enabled' => (bool) $enabled,
                'sort' => $sort,
                'width' => $width,
                'data' => $data,
            ];
        })
            ->filter(fn (array $w) => (bool) $w['enabled'])
            ->sortBy('sort')
            ->values()
            ->all();

        return $items;
    }

    public function availableWidgetsForRole(string $roleKey): array
    {
        return DashboardWidget::query()
            ->get()
            ->filter(fn (DashboardWidget $w) => in_array($roleKey, (array) $w->role_scope, true))
            ->sortBy('default_sort')
            ->values()
            ->map(fn (DashboardWidget $w) => [
                'widget_key' => $w->widget_key,
                'title_key' => $w->title_key,
                'description_key' => $w->description_key,
                'component' => $w->component_view,
                'supports_date_range' => (bool) $w->supports_date_range,
                'cache_ttl_seconds' => (int) $w->cache_ttl_seconds,
                'default_enabled' => (bool) $w->default_enabled,
                'default_sort' => (int) $w->default_sort,
            ])
            ->all();
    }

    public function layoutForUser(User $user, string $roleKey): array
    {
        $userLayout = DashboardLayout::query()
            ->where('scope_type', 'user')
            ->where('scope_id', (string) $user->id)
            ->first();

        if ($userLayout) {
            return (array) $userLayout->layout_json;
        }

        $roleLayout = DashboardLayout::query()
            ->where('scope_type', 'role')
            ->where('scope_id', $roleKey)
            ->first();

        return (array) ($roleLayout?->layout_json ?? []);
    }

    public function layoutForRole(string $roleKey): array
    {
        $roleLayout = DashboardLayout::query()
            ->where('scope_type', 'role')
            ->where('scope_id', $roleKey)
            ->first();

        return (array) ($roleLayout?->layout_json ?? []);
    }

    public function saveUserLayout(User $user, array $layout): void
    {
        DashboardLayout::query()->updateOrCreate(
            ['scope_type' => 'user', 'scope_id' => (string) $user->id],
            ['layout_json' => $layout],
        );
    }

    public function saveRoleLayout(string $roleKey, array $layout): void
    {
        DashboardLayout::query()->updateOrCreate(
            ['scope_type' => 'role', 'scope_id' => $roleKey],
            ['layout_json' => $layout],
        );
    }

    private function roleKey(User $user): string
    {
        if ($user->is_admin) {
            return 'admin';
        }

        if ($user->is_seller) {
            return 'seller';
        }

        return 'user';
    }

    private function widgetData(User $user, string $roleKey, string $widgetKey, ?string $rangeKey, int $ttlSeconds): array
    {
        $cacheKey = implode(':', [
            'dash',
            $roleKey,
            $user->id,
            $widgetKey,
            $rangeKey ?: 'na',
        ]);

        return Cache::remember($cacheKey, $ttlSeconds, function () use ($user, $roleKey, $widgetKey, $rangeKey) {
            return match ($widgetKey) {
                'admin.revenue_overview' => $this->adminRevenueOverview($rangeKey),
                'admin.orders_by_status_global' => $this->adminOrdersByStatus($rangeKey),
                'admin.top_sellers' => $this->adminTopSellers($rangeKey),
                'admin.system_health' => $this->systemHealth(),
                'admin.announcements' => $this->announcements(['admin']),

                'seller.sales_kpi' => $this->sellerSalesKpi($user, $rangeKey),
                'seller.orders_summary' => $this->sellerOrdersSummary($user, $rangeKey),
                'seller.top_products' => $this->sellerTopProducts($user, $rangeKey),
                'seller.low_stock_alerts' => $this->sellerLowStock($user),
                'seller.announcements' => $this->announcements(['seller']),

                default => ['kind' => 'unknown', 'message' => 'Unknown widget'],
            };
        });
    }

    private function range(?string $rangeKey): array
    {
        $now = CarbonImmutable::now();

        if ($rangeKey === 'today') {
            return [$now->startOfDay(), $now->endOfDay()];
        }

        if ($rangeKey === '7d') {
            return [$now->subDays(6)->startOfDay(), $now->endOfDay()];
        }

        if ($rangeKey === '30d' || $rangeKey === null) {
            return [$now->subDays(29)->startOfDay(), $now->endOfDay()];
        }

        return [$now->subDays(29)->startOfDay(), $now->endOfDay()];
    }

    private function adminRevenueOverview(?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $orders = Order::query()->whereBetween('created_at', [$from, $to]);

        return [
            'kind' => 'kpi',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'orders_count' => (int) $orders->count(),
            'revenue_total' => (string) $orders->sum('total'),
        ];
    }

    private function adminOrdersByStatus(?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $rows = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->select('status', DB::raw('count(*) as cnt'))
            ->groupBy('status')
            ->orderBy('cnt', 'desc')
            ->get();

        return [
            'kind' => 'table',
            'rows' => $rows->map(fn ($r) => ['status' => (string) $r->status, 'count' => (int) $r->cnt])->all(),
        ];
    }

    private function adminTopSellers(?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $rows = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->whereNotNull('products.seller_id')
            ->whereBetween('orders.created_at', [$from, $to])
            ->select('products.seller_id', DB::raw('sum(order_items.line_total) as revenue'), DB::raw('sum(order_items.quantity) as qty'))
            ->groupBy('products.seller_id')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        $sellerIds = $rows->pluck('seller_id')->all();
        $sellerMap = User::query()->whereIn('id', $sellerIds)->get(['id', 'name'])->keyBy('id');

        return [
            'kind' => 'table',
            'rows' => $rows->map(function ($r) use ($sellerMap) {
                $seller = $sellerMap->get($r->seller_id);

                return [
                    'seller_id' => (int) $r->seller_id,
                    'seller_name' => (string) ($seller?->name ?? 'Seller #' . $r->seller_id),
                    'revenue' => (string) $r->revenue,
                    'qty' => (int) $r->qty,
                ];
            })->all(),
        ];
    }

    private function systemHealth(): array
    {
        return [
            'kind' => 'system',
            'php' => PHP_VERSION,
            'laravel' => app()->version(),
            'cache_driver' => (string) config('cache.default'),
            'db_connection' => (string) config('database.default'),
        ];
    }

    private function announcements(array $audience): array
    {
        $now = CarbonImmutable::now();

        $items = Announcement::query()
            ->where('is_active', true)
            ->get()
            ->filter(function (Announcement $a) use ($audience, $now) {
                $audOk = count(array_intersect($audience, (array) $a->audience)) > 0;
                $startsOk = !$a->starts_at || $a->starts_at->lte($now);
                $endsOk = !$a->ends_at || $a->ends_at->gte($now);

                return $audOk && $startsOk && $endsOk;
            })
            ->sortByDesc('created_at')
            ->take(5)
            ->values();

        return [
            'kind' => 'announcements',
            'items' => $items->map(fn (Announcement $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'body_html' => $a->body_html,
            ])->all(),
        ];
    }

    private function sellerSalesKpi(User $seller, ?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $base = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('products.seller_id', $seller->id)
            ->whereBetween('orders.created_at', [$from, $to]);

        $revenue = (string) (clone $base)->sum('order_items.line_total');

        $ordersCount = (int) (clone $base)
            ->distinct('orders.id')
            ->count('orders.id');

        return [
            'kind' => 'kpi',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'orders_count' => $ordersCount,
            'revenue_total' => $revenue,
        ];
    }

    private function sellerOrdersSummary(User $seller, ?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $rows = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('products.seller_id', $seller->id)
            ->whereBetween('orders.created_at', [$from, $to])
            ->select('orders.status', DB::raw('count(distinct orders.id) as cnt'))
            ->groupBy('orders.status')
            ->orderByDesc('cnt')
            ->get();

        return [
            'kind' => 'table',
            'rows' => $rows->map(fn ($r) => ['status' => (string) $r->status, 'count' => (int) $r->cnt])->all(),
        ];
    }

    private function sellerTopProducts(User $seller, ?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $rows = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('products.seller_id', $seller->id)
            ->whereBetween('orders.created_at', [$from, $to])
            ->select('products.id', 'products.name', DB::raw('sum(order_items.quantity) as qty'), DB::raw('sum(order_items.line_total) as revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        return [
            'kind' => 'table',
            'rows' => $rows->map(fn ($r) => [
                'product_id' => (int) $r->id,
                'name' => (string) $r->name,
                'qty' => (int) $r->qty,
                'revenue' => (string) $r->revenue,
            ])->all(),
        ];
    }

    private function sellerLowStock(User $seller): array
    {
        $rows = Product::query()
            ->where('seller_id', $seller->id)
            ->where('is_active', true)
            ->where('stock', '<=', 5)
            ->orderBy('stock')
            ->limit(10)
            ->get(['id', 'name', 'stock']);

        return [
            'kind' => 'table',
            'rows' => $rows->map(fn (Product $p) => [
                'product_id' => $p->id,
                'name' => $p->name,
                'stock' => (int) $p->stock,
            ])->all(),
        ];
    }
}
