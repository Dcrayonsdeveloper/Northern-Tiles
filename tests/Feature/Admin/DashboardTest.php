<?php

namespace Tests\Feature\Admin;

use App\Domain\Dashboard\Services\AdminAlertService;
use App\Domain\Dashboard\Services\DashboardService;
use App\Models\ContactMessage;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Widget payloads are cached per widget + range; a stale entry from an
        // earlier test would be read as this test's answer.
        Cache::flush();
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function order(string $status, float $total, ?\DateTimeInterface $at = null): Order
    {
        return Order::create([
            'order_number' => 'ORD-' . str()->random(8),
            'status' => $status,
            'customer_name' => 'Pat Morrow',
            'customer_email' => 'pat@example.test',
            'currency' => 'AUD',
            'subtotal' => $total,
            'total' => $total,
            'created_at' => $at ?? now(),
        ]);
    }

    private function widget(string $key, string $range = 'today'): array
    {
        $widgets = app(DashboardService::class)->widgetsForUser($this->admin(), $range);

        return collect($widgets)->firstWhere('widget_key', $key)['data'] ?? [];
    }

    public function test_revenue_excludes_cancelled_and_refunded_orders(): void
    {
        $this->order('delivered', 500.00);
        $this->order('pending', 180.39);
        $this->order('cancelled', 1000.00);
        $this->order('refunded', 250.00);

        $tiles = collect($this->widget('admin.revenue_overview')['tiles'] ?? [])->keyBy('label');

        // Revenue used to sum every order in the range, so this reported
        // 1930.39 — most of it money the business never kept.
        $this->assertSame(680.39, $tiles['Revenue']['value']);

        // Order count still includes them: the order was placed, and the
        // cancellation rate is built on exactly that difference.
        $this->assertSame(4, $tiles['Orders']['value']);
    }

    public function test_average_order_value_is_revenue_over_orders(): void
    {
        $this->order('delivered', 300.00);
        $this->order('delivered', 100.00);

        $tiles = collect($this->widget('admin.revenue_overview')['tiles'] ?? [])->keyBy('label');

        $this->assertSame(200.0, $tiles['Avg order value']['value']);
    }

    public function test_a_delta_is_null_when_the_previous_period_was_empty(): void
    {
        $this->order('delivered', 500.00);

        $tiles = collect($this->widget('admin.revenue_overview')['tiles'] ?? [])->keyBy('label');

        // Not 100%: a first sale is not a hundred per cent rise over nothing.
        $this->assertNull($tiles['Revenue']['delta']);
    }

    public function test_the_trend_includes_days_with_no_orders(): void
    {
        $this->order('delivered', 100.00, now()->subDays(3));

        $points = $this->widget('admin.revenue_trend', '7d')['points'] ?? [];

        // A line that skips empty days draws a busy week and a dead week alike.
        $this->assertCount(7, $points);
        $this->assertSame(0.0, $points[0]['revenue']);
    }

    public function test_status_bars_carry_counts_and_percentages(): void
    {
        $this->order('pending', 10.00);
        $this->order('pending', 10.00);
        $this->order('cancelled', 10.00);

        $data = $this->widget('admin.orders_by_status_global');

        $this->assertSame('status_bars', $data['kind']);
        $this->assertSame(3, $data['total']);

        $pending = collect($data['rows'])->firstWhere('status', 'pending');
        $this->assertSame(2, $pending['count']);
        $this->assertSame(66.7, $pending['percent']);
    }

    public function test_performance_meters_measure_against_all_orders(): void
    {
        $this->order('delivered', 10.00);
        $this->order('cancelled', 10.00);
        $this->order('pending', 10.00);
        $this->order('pending', 10.00);

        $meters = collect($this->widget('admin.performance')['meters'] ?? [])->keyBy('label');

        $this->assertSame(25.0, $meters['Completion rate']['percent']);
        $this->assertSame(25.0, $meters['Cancellation rate']['percent']);
        $this->assertSame('critical', $meters['Cancellation rate']['tone']);
    }

    public function test_the_dashboard_renders_for_an_admin(): void
    {
        $this->order('delivered', 120.00);

        $this->actingAs($this->admin())
            ->get(route('admin.dashboard', ['range' => 'this_month']))
            ->assertOk();
    }

    public function test_sidebar_alerts_count_work_still_waiting(): void
    {
        $this->order('pending', 10.00);
        $this->order('pending', 10.00);
        $this->order('delivered', 10.00);

        ContactMessage::create([
            'name' => 'Sam', 'email' => 's@example.test',
            'subject' => 'Quote', 'message' => 'Hello', 'is_read' => false,
        ]);
        ContactMessage::create([
            'name' => 'Read', 'email' => 'r@example.test',
            'subject' => 'Old', 'message' => 'Hello', 'is_read' => true,
        ]);

        User::factory()->create(['is_builder' => true, 'builder_approved_at' => null]);
        User::factory()->create(['is_builder' => true, 'builder_approved_at' => now()]);

        $alerts = app(AdminAlertService::class)->forUser($this->admin());

        $this->assertSame(2, $alerts['orders']);
        $this->assertSame(1, $alerts['messages']);
        $this->assertSame(1, $alerts['builder-accounts']);
    }

    public function test_a_cleared_queue_of_work_shows_no_dots(): void
    {
        $this->order('delivered', 10.00);

        // array_filter drops the zeros, so the sidebar renders no badge at all
        // rather than a grey "0" beside every item.
        $this->assertSame([], app(AdminAlertService::class)->forUser($this->admin()));
    }

    public function test_non_admins_are_not_given_alert_counts(): void
    {
        $this->order('pending', 10.00);

        $this->assertSame([], app(AdminAlertService::class)->forUser(User::factory()->create()));
        $this->assertSame([], app(AdminAlertService::class)->forUser(null));
    }
}
