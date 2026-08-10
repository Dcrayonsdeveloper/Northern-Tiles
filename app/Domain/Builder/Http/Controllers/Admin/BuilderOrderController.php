<?php

namespace App\Domain\Builder\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin → Builder Panel → Orders.
 *
 * The same orders that appear under Store → Orders, filtered to trade only,
 * so the admin can look at builder volume without wading through retail.
 */
class BuilderOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('q', ''));
        $status = $request->input('status', '');

        $orders = Order::query()
            ->where('is_builder_order', true)
            ->with('user:id,name,email,builder_company')
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('order_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%");
                });
            })
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/BuilderCatalog/Orders', [
            'orders' => $orders,
            'filters' => ['q' => $search, 'status' => $status],
            'stats' => [
                'total' => Order::where('is_builder_order', true)->count(),
                'revenue' => (float) Order::where('is_builder_order', true)
                    ->where('payment_status', 'paid')
                    ->sum('total'),
            ],
        ]);
    }
}
