<?php

namespace App\Domain\Marketing\Http\Controllers\Admin;

use App\Domain\Marketing\Models\AbandonedCartFlow;
use App\Domain\Marketing\Models\AbandonedCartMessage;
use App\Domain\Marketing\Services\AbandonedCartService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AbandonedCartController extends Controller
{
    public function __construct(
        protected AbandonedCartService $abandonedCartService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'date_from', 'date_to']);

        $carts = $this->abandonedCartService->getAbandonedCarts($filters);
        $statistics = $this->abandonedCartService->getStatistics(null, $request->input('period', '30d'));

        // Checkouts that reached the payment screen and were never paid.
        // They are the same failure as an abandoned cart -- a customer who got
        // further and still did not buy -- so they belong here rather than in
        // the order list, which is for work to action. Each one is a real
        // order row, so it links straight through.
        $abandonedCheckouts = \App\Models\Order::query()
            ->where('payment_method', 'card')
            ->where('payment_status', 'pending')
            ->latest()
            ->limit(50)
            ->get(['id', 'order_number', 'customer_name', 'customer_email', 'total', 'is_builder_order', 'created_at'])
            ->map(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'customer' => $o->customer_name ?: 'Guest',
                'email' => $o->customer_email,
                'total' => (float) $o->total,
                'source' => $o->is_builder_order ? 'Trade' : 'Website',
                'abandoned_at' => $o->created_at?->diffForHumans(),
            ]);

        return Inertia::render('Admin/AbandonedCarts/Index', [
            'carts' => $carts,
            'statistics' => $statistics,
            'filters' => $filters,
            'abandonedCheckouts' => $abandonedCheckouts,
        ]);
    }

    public function show(int $cartId): Response
    {
        $cart = \App\Domain\Cart\Models\Cart::with([
            'items.product',
            'customer',
            'abandonedCartMessages' => fn($q) => $q->orderBy('step'),
        ])->findOrFail($cartId);

        return Inertia::render('Admin/AbandonedCarts/Show', [
            'cart' => $cart,
        ]);
    }

    public function flows(Request $request): Response
    {
        $flows = AbandonedCartFlow::withCount('messages')
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Admin/AbandonedCarts/Flows', [
            'flows' => $flows,
            'defaultFlow' => AbandonedCartFlow::getDefaultFlow(),
        ]);
    }

    public function createFlow(): Response
    {
        return Inertia::render('Admin/AbandonedCarts/FlowForm', [
            'flow' => null,
            'defaultDelays' => AbandonedCartFlow::DEFAULT_DELAYS,
            'defaultTemplates' => AbandonedCartFlow::DEFAULT_TEMPLATES,
        ]);
    }

    public function storeFlow(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'delays_json' => ['required', 'array'],
            'delays_json.*' => ['integer', 'min:1'],
            'template_keys_json' => ['required', 'array'],
            'template_keys_json.*' => ['string'],
            'min_cart_value' => ['nullable', 'numeric', 'min:0'],
            'abandon_threshold_minutes' => ['required', 'integer', 'min:10'],
            'require_email' => ['boolean'],
            'respect_opt_in' => ['boolean'],
            'max_emails_per_cart' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        AbandonedCartFlow::create($validated);

        return redirect()
            ->route('admin.abandoned-carts.flows')
            ->with('success', 'Flow created successfully.');
    }

    public function editFlow(AbandonedCartFlow $flow): Response
    {
        return Inertia::render('Admin/AbandonedCarts/FlowForm', [
            'flow' => $flow,
            'defaultDelays' => AbandonedCartFlow::DEFAULT_DELAYS,
            'defaultTemplates' => AbandonedCartFlow::DEFAULT_TEMPLATES,
        ]);
    }

    public function updateFlow(Request $request, AbandonedCartFlow $flow): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'delays_json' => ['required', 'array'],
            'delays_json.*' => ['integer', 'min:1'],
            'template_keys_json' => ['required', 'array'],
            'template_keys_json.*' => ['string'],
            'min_cart_value' => ['nullable', 'numeric', 'min:0'],
            'abandon_threshold_minutes' => ['required', 'integer', 'min:10'],
            'require_email' => ['boolean'],
            'respect_opt_in' => ['boolean'],
            'max_emails_per_cart' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $flow->update($validated);

        return back()->with('success', 'Flow updated successfully.');
    }

    public function destroyFlow(AbandonedCartFlow $flow): RedirectResponse
    {
        $flow->delete();

        return redirect()
            ->route('admin.abandoned-carts.flows')
            ->with('success', 'Flow deleted successfully.');
    }

    public function messages(Request $request): Response
    {
        $filters = $request->only(['status', 'search']);

        $query = AbandonedCartMessage::with(['cart', 'flow'])
            ->orderByDesc('created_at');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->whereHas('cart', function ($q) use ($filters) {
                $q->where('email', 'like', "%{$filters['search']}%");
            });
        }

        $messages = $query->paginate(30)->withQueryString();

        return Inertia::render('Admin/AbandonedCarts/Messages', [
            'messages' => $messages,
            'filters' => $filters,
            'statuses' => AbandonedCartMessage::getStatuses(),
        ]);
    }

    public function statistics(Request $request): JsonResponse
    {
        $period = $request->input('period', '30d');
        $stats = $this->abandonedCartService->getStatistics(null, $period);

        return response()->json($stats);
    }
}
