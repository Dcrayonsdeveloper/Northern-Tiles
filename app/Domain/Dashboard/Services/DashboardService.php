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
    /**
     * Where each widget sits when the admin has not arranged the page itself.
     *
     * Everything defaulted to full width before, which stacked six widgets
     * into one tall column and pushed the orders table below the fold. An
     * explicit width per widget is only the default — a saved layout still
     * wins.
     */
    private const DEFAULT_WIDTHS = [
        'admin.revenue_overview' => 'full',
        'admin.revenue_trend' => 'full',
        'admin.orders_by_status_global' => 'third',
        'admin.performance' => 'third',
        'admin.top_products' => 'third',
        'admin.recent_orders' => 'full',
        'admin.system_health' => 'half',
        'admin.announcements' => 'half',
    ];

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
            $width = (string) Arr::get($override, 'width', self::DEFAULT_WIDTHS[$w->widget_key] ?? 'full');
            $ttlSeconds = (int) Arr::get($override, 'cache_ttl_seconds', $w->cache_ttl_seconds);

            // The range tabs on the page win, full stop.
            //
            // This used to read a per-widget `range` out of the saved layout
            // and prefer it, so a layout that pinned one silently defeated the
            // tabs: the KPI row and the status chart answered for whatever was
            // pinned while the trend answered for the tab, and the page showed
            // two different periods at once with no sign which was which.
            // Clicking Today or This year changed nothing above the fold.
            $effectiveRangeKey = $w->supports_date_range ? $rangeKey : null;

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
                'admin.revenue_trend' => $this->adminRevenueTrend($rangeKey),
                'admin.orders_by_status_global' => $this->adminOrdersByStatus($rangeKey),
                'admin.recent_orders' => $this->adminRecentOrders($rangeKey),
                'admin.top_products' => $this->adminTopProducts($rangeKey),
                'admin.performance' => $this->adminPerformance($rangeKey),
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

    /**
     * Orders that count as money taken.
     *
     * Revenue used to sum every order in the range, cancelled and refunded
     * included, so the dashboard reported more than the business had actually
     * earned — on a quiet day a single cancelled order was most of the figure.
     * Order counts still include them: an order placed and then cancelled did
     * happen, and the cancellation rate is built on exactly that difference.
     */
    private const REVENUE_EXCLUDED_STATUSES = ['cancelled', 'refunded'];

    /** Delivered is the end of the pipeline; these never will be. */
    private const TERMINAL_FAILED_STATUSES = ['cancelled', 'refunded'];

    private function range(?string $rangeKey): array
    {
        $now = CarbonImmutable::now();

        return match ($rangeKey) {
            'today' => [$now->startOfDay(), $now->endOfDay()],
            '7d' => [$now->subDays(6)->startOfDay(), $now->endOfDay()],
            'this_month' => [$now->startOfMonth(), $now->endOfDay()],
            'this_year' => [$now->startOfYear(), $now->endOfDay()],
            default => [$now->subDays(29)->startOfDay(), $now->endOfDay()],
        };
    }

    /**
     * The window immediately before this one, of the same length.
     *
     * Same length rather than "the previous calendar month", so a comparison
     * made 3 days into a month is not measured against a full one — which
     * would read as a collapse every time a month turned over.
     */
    private function previousRange(?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $seconds = $from->diffInSeconds($to);

        return [$from->subSeconds($seconds + 1), $from->subSecond()];
    }

    private function revenueQuery(CarbonImmutable $from, CarbonImmutable $to)
    {
        return Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', self::REVENUE_EXCLUDED_STATUSES);
    }

    /**
     * Percentage change, or null when there is no base to compare against.
     *
     * Null rather than 100%: going from nothing to something is not a hundred
     * per cent rise, and printing one makes a first sale look like a trend.
     */
    private function delta(float $current, float $previous): ?float
    {
        if ($previous <= 0.0) {
            return null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function adminRevenueOverview(?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);
        [$prevFrom, $prevTo] = $this->previousRange($rangeKey);

        $orders = Order::query()->whereBetween('created_at', [$from, $to]);
        $prevOrders = Order::query()->whereBetween('created_at', [$prevFrom, $prevTo]);

        $ordersCount = (int) $orders->count();
        $revenue = (float) $this->revenueQuery($from, $to)->sum('total');

        $prevCount = (int) $prevOrders->count();
        $prevRevenue = (float) $this->revenueQuery($prevFrom, $prevTo)->sum('total');

        $customers = (int) User::query()
            ->where('is_admin', false)
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $prevCustomers = (int) User::query()
            ->where('is_admin', false)
            ->whereBetween('created_at', [$prevFrom, $prevTo])
            ->count();

        return [
            'kind' => 'stat_tiles',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'currency' => config('app.currency', 'AUD'),
            'tiles' => [
                [
                    'label' => 'Revenue',
                    'value' => round($revenue, 2),
                    'format' => 'currency',
                    'delta' => $this->delta($revenue, $prevRevenue),
                    'hint' => 'Excludes cancelled and refunded',
                ],
                [
                    'label' => 'Orders',
                    'value' => $ordersCount,
                    'format' => 'number',
                    'delta' => $this->delta($ordersCount, $prevCount),
                ],
                [
                    'label' => 'Avg order value',
                    'value' => $ordersCount > 0 ? round($revenue / $ordersCount, 2) : 0,
                    'format' => 'currency',
                    'delta' => null,
                ],
                [
                    'label' => 'New customers',
                    'value' => $customers,
                    'format' => 'number',
                    'delta' => $this->delta($customers, $prevCustomers),
                ],
                [
                    'label' => 'Awaiting action',
                    'value' => (int) Order::query()->where('status', 'pending')->count(),
                    'format' => 'number',
                    'delta' => null,
                    'hint' => 'Pending orders, all time',
                ],
                [
                    'label' => 'Live products',
                    'value' => (int) Product::query()->where('status', Product::STATUS_PUBLISHED)->count(),
                    'format' => 'number',
                    'delta' => null,
                ],
            ],
        ];
    }

    /**
     * Revenue and orders per day across the range.
     *
     * Two series on their own scales, returned together but charted as small
     * multiples — one axis each. Plotting dollars and order counts against two
     * y-axes in one frame is the chart mistake that makes any two lines appear
     * to cross wherever the scales happen to put them.
     */
    private function adminRevenueTrend(?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $rows = Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw('COUNT(*) as orders')
            ->selectRaw('SUM(CASE WHEN status IN (?, ?) THEN 0 ELSE total END) as revenue', self::REVENUE_EXCLUDED_STATUSES)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy(fn ($r) => (string) $r->day);

        // Every day in the window, not just the ones with orders — a line that
        // skips empty days draws a busy week and a dead week identically.
        $points = [];
        for ($day = $from; $day->lte($to); $day = $day->addDay()) {
            $key = $day->toDateString();
            $row = $rows->get($key);

            $points[] = [
                'date' => $key,
                'label' => $day->format('j M'),
                'revenue' => round((float) ($row->revenue ?? 0), 2),
                'orders' => (int) ($row->orders ?? 0),
            ];
        }

        return [
            'kind' => 'trend',
            'currency' => config('app.currency', 'AUD'),
            'points' => $points,
        ];
    }

    private function adminRecentOrders(?string $rangeKey): array
    {
        $rows = Order::query()
            ->latest('created_at')
            ->limit(8)
            ->get(['id', 'order_number', 'customer_name', 'status', 'total', 'created_at']);

        return [
            'kind' => 'recent_orders',
            'currency' => config('app.currency', 'AUD'),
            'rows' => $rows->map(fn (Order $o) => [
                'id' => $o->id,
                'order_number' => (string) $o->order_number,
                'customer' => (string) ($o->customer_name ?: 'Guest'),
                'status' => (string) $o->status,
                'total' => round((float) $o->total, 2),
                'placed_at' => $o->created_at?->diffForHumans(),
            ])->all(),
        ];
    }

    private function adminTopProducts(?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $rows = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereBetween('orders.created_at', [$from, $to])
            ->whereNotIn('orders.status', self::REVENUE_EXCLUDED_STATUSES)
            ->selectRaw('order_items.name, order_items.sku')
            ->selectRaw('SUM(order_items.quantity) as qty')
            ->selectRaw('SUM(order_items.line_total) as revenue')
            ->groupBy('order_items.name', 'order_items.sku')
            ->orderByDesc('revenue')
            ->limit(6)
            ->get();

        return [
            'kind' => 'top_products',
            'currency' => config('app.currency', 'AUD'),
            'rows' => $rows->map(fn ($r) => [
                // Stored on the line, not joined from products: an item sold
                // under a name that has since changed should report the name it
                // was actually sold under, and still appear if it was deleted.
                'name' => (string) $r->name,
                'sku' => (string) $r->sku,
                'qty' => (int) $r->qty,
                'revenue' => round((float) $r->revenue, 2),
            ])->all(),
        ];
    }

    private function adminPerformance(?string $rangeKey): array
    {
        [$from, $to] = $this->range($rangeKey);

        $total = (int) Order::query()->whereBetween('created_at', [$from, $to])->count();

        $delivered = (int) Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'delivered')
            ->count();

        $failed = (int) Order::query()
            ->whereBetween('created_at', [$from, $to])
            ->whereIn('status', self::TERMINAL_FAILED_STATUSES)
            ->count();

        $products = (int) Product::query()->count();
        $live = (int) Product::query()->where('status', Product::STATUS_PUBLISHED)->count();

        $pct = fn (int $part, int $whole) => $whole > 0 ? round(($part / $whole) * 100, 1) : 0.0;

        return [
            'kind' => 'meters',
            'meters' => [
                [
                    'label' => 'Completion rate',
                    'percent' => $pct($delivered, $total),
                    'detail' => "{$delivered} of {$total} delivered",
                    'tone' => 'good',
                ],
                [
                    'label' => 'Cancellation rate',
                    'percent' => $pct($failed, $total),
                    'detail' => "{$failed} of {$total} cancelled or refunded",
                    // The only meter where a bigger number is worse, so it is
                    // the only one painted with the critical token.
                    'tone' => 'critical',
                ],
                [
                    'label' => 'Live products',
                    'percent' => $pct($live, $products),
                    'detail' => "{$live} of {$products} published",
                    'tone' => 'neutral',
                ],
            ],
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

        $total = (int) $rows->sum('cnt');

        return [
            // Bars, not a donut. These counts are a magnitude comparison, and
            // the status hues that would colour a donut put cancelled-red next
            // to delivered-green — a pair that is 4.1 ΔE apart under deuteran
            // vision, which is to say indistinguishable to the readers most
            // likely to be scanning for cancellations. One hue, sorted, with
            // the status named on every bar.
            'kind' => 'status_bars',
            'total' => $total,
            'rows' => $rows->map(fn ($r) => [
                'status' => (string) $r->status,
                'count' => (int) $r->cnt,
                'percent' => $total > 0 ? round(((int) $r->cnt / $total) * 100, 1) : 0.0,
            ])->all(),
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
