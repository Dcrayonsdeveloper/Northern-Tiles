<?php

namespace App\Domain\Marketing\Http\Controllers\Admin;

use App\Domain\Marketing\Models\Coupon;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Coupon::query()
            ->withCount('usages')
            ->latest();

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->input('status')) {
            match ($status) {
                'active' => $query->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                            ->orWhere('expires_at', '>', now());
                    }),
                'expired' => $query->where('expires_at', '<', now()),
                'inactive' => $query->where('is_active', false),
                'scheduled' => $query->where('starts_at', '>', now()),
                default => null,
            };
        }

        // Filter by type
        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        $coupons = $query->paginate(20)->withQueryString();

        // Get stats
        $stats = [
            'total' => Coupon::count(),
            'active' => Coupon::where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })->count(),
            'expired' => Coupon::where('expires_at', '<', now())->count(),
            'total_usage' => Coupon::sum('times_used'),
        ];

        return Inertia::render('Admin/Coupons/Index', [
            'coupons' => $coupons,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'type']),
            'types' => Coupon::TYPES,
        ]);
    }

    public function suggestions(Request $request): \Illuminate\Http\JsonResponse
    {
        $q = trim($request->input('q', ''));

        if ($q === '') {
            return response()->json(['suggestions' => []]);
        }

        $suggestions = Coupon::query()
            ->where(function ($query) use ($q) {
                $query->where('code', 'like', "{$q}%")
                    ->orWhere('code', 'like', "%{$q}%")
                    ->orWhere('title', 'like', "%{$q}%");
            })
            ->orderByRaw("CASE WHEN code LIKE ? THEN 0 ELSE 1 END", ["{$q}%"])
            ->orderBy('code')
            ->limit(8)
            ->get(['code', 'title', 'type', 'is_active'])
            ->map(fn($c) => [
                'code'      => $c->code,
                'title'     => $c->title,
                'type'      => $c->type,
                'is_active' => (bool) $c->is_active,
            ]);

        return response()->json(['suggestions' => $suggestions]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Coupons/Create', [
            'types' => Coupon::TYPES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:percentage,fixed_amount,free_shipping,buy_x_get_y'],
            'value' => ['nullable', 'numeric', 'min:0'],
            'minimum_purchase' => ['nullable', 'numeric', 'min:0'],
            'maximum_discount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_customer' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
            'first_order_only' => ['boolean'],
            'eligible_products' => ['nullable', 'array'],
            'eligible_categories' => ['nullable', 'array'],
            'excluded_products' => ['nullable', 'array'],
            'buy_quantity' => ['nullable', 'integer', 'min:1'],
            'get_quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $validated['value'] = $validated['value'] ?? 0;

        Coupon::create($validated);

        return redirect()
            ->route('admin.coupons.index')
            ->with('success', 'Coupon created successfully.');
    }

    public function edit(Coupon $coupon): Response
    {
        $coupon->load('usages');

        return Inertia::render('Admin/Coupons/Edit', [
            'coupon' => $coupon,
            'types' => Coupon::TYPES,
            'usageStats' => [
                'total_uses' => $coupon->times_used,
                'total_discount_given' => $coupon->usages->sum('discount_amount'),
                'unique_customers' => $coupon->usages->unique('user_id')->count(),
            ],
        ]);
    }

    public function update(Request $request, Coupon $coupon): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code,' . $coupon->id],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:percentage,fixed_amount,free_shipping,buy_x_get_y'],
            'value' => ['nullable', 'numeric', 'min:0'],
            'minimum_purchase' => ['nullable', 'numeric', 'min:0'],
            'maximum_discount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_customer' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
            'first_order_only' => ['boolean'],
            'eligible_products' => ['nullable', 'array'],
            'eligible_categories' => ['nullable', 'array'],
            'excluded_products' => ['nullable', 'array'],
            'buy_quantity' => ['nullable', 'integer', 'min:1'],
            'get_quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $validated['value'] = $validated['value'] ?? 0;

        $coupon->update($validated);

        return redirect()
            ->route('admin.coupons.index')
            ->with('success', 'Coupon updated successfully.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $coupon->delete();

        return redirect()
            ->route('admin.coupons.index')
            ->with('success', 'Coupon deleted successfully.');
    }

    public function toggleStatus(Coupon $coupon): RedirectResponse
    {
        $coupon->update(['is_active' => !$coupon->is_active]);

        return back()->with('success', 'Coupon status updated.');
    }

    public function duplicate(Coupon $coupon): RedirectResponse
    {
        $newCoupon = $coupon->replicate();
        $newCoupon->code = $coupon->code . '-COPY';
        $newCoupon->times_used = 0;
        $newCoupon->is_active = false;
        $newCoupon->save();

        return redirect()
            ->route('admin.coupons.edit', $newCoupon)
            ->with('success', 'Coupon duplicated. Please update the code.');
    }
}
