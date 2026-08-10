<?php

namespace App\Domain\Builder\Http\Controllers\Admin;

use App\Domain\Builder\Models\BuilderProduct;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin → Builder Panel → Catalogue.
 *
 * Decides which products trade accounts can see and what they pay for them.
 */
class BuilderCatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('q', ''));
        $categoryId = $request->input('category_id');
        $status = $request->input('status', ''); // '', 'active', 'inactive'

        $listings = BuilderProduct::query()
            ->with(['product:id,name,slug,sku,price,image_url,category_id,is_active', 'product.category:id,name'])
            ->whereHas('product', function ($q) use ($search, $categoryId) {
                if ($search !== '') {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
                }
                if ($categoryId) {
                    $q->where('category_id', $categoryId);
                }
            })
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy('sort')
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString();

        $listings->getCollection()->transform(function (BuilderProduct $listing) {
            $retail = (float) ($listing->product->price ?? 0);
            $price = (float) $listing->price;

            $listing->retail_price = $retail;
            // Margin the trade account is getting off retail — the number the
            // admin actually reasons about when pricing.
            $listing->discount_percent = $retail > 0
                ? round((($retail - $price) / $retail) * 100, 1)
                : 0.0;

            return $listing;
        });

        return Inertia::render('Admin/BuilderCatalog/Index', [
            'listings' => $listings,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'q' => $search,
                'category_id' => $categoryId,
                'status' => $status,
            ],
            'stats' => [
                'total' => BuilderProduct::count(),
                'active' => BuilderProduct::where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * Product picker feed for the "Add products" modal: active products that
     * are not on the trade list yet.
     */
    public function available(Request $request)
    {
        $search = trim((string) $request->input('q', ''));

        $products = Product::query()
            ->where('is_active', true)
            ->whereDoesntHave('builderListing')
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->input('category_id')))
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'name', 'sku', 'price', 'image_url']);

        return response()->json(['products' => $products]);
    }

    /**
     * Add products to the trade catalogue. Accepts a batch so the picker can
     * submit a multi-select in one request.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.price' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'items.*.note' => ['nullable', 'string', 'max:255'],
        ]);

        $userId = $request->user()->id;
        $added = 0;

        DB::transaction(function () use ($validated, $userId, &$added) {
            foreach ($validated['items'] as $item) {
                // updateOrCreate, not create: re-adding a product the admin
                // previously removed should just re-price it, not blow up on
                // the unique index.
                $listing = BuilderProduct::updateOrCreate(
                    ['product_id' => $item['product_id']],
                    [
                        'price' => $item['price'],
                        'note' => $item['note'] ?? null,
                        'is_active' => true,
                        'updated_by' => $userId,
                    ]
                );

                if ($listing->wasRecentlyCreated) {
                    $listing->forceFill(['created_by' => $userId])->save();
                }

                $added++;
            }
        });

        return back()->with('success', "{$added} product(s) added to the builder catalogue.");
    }

    public function update(Request $request, BuilderProduct $builderProduct): RedirectResponse
    {
        $validated = $request->validate([
            'price' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'is_active' => ['required', 'boolean'],
            'sort' => ['nullable', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $builderProduct->update([
            ...$validated,
            'sort' => $validated['sort'] ?? $builderProduct->sort,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Builder price updated.');
    }

    public function destroy(BuilderProduct $builderProduct): RedirectResponse
    {
        $builderProduct->delete();

        return back()->with('success', 'Product removed from the builder catalogue.');
    }

    /**
     * Bulk actions from the index checkboxes: activate, deactivate or remove.
     */
    public function bulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', Rule::in(['activate', 'deactivate', 'remove'])],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:builder_products,id'],
        ]);

        $query = BuilderProduct::whereIn('id', $validated['ids']);
        $userId = $request->user()->id;

        $message = match ($validated['action']) {
            'activate' => 'Selected products are now live for builders.',
            'deactivate' => 'Selected products are hidden from builders.',
            'remove' => 'Selected products removed from the builder catalogue.',
        };

        match ($validated['action']) {
            'activate' => $query->update(['is_active' => true, 'updated_by' => $userId]),
            'deactivate' => $query->update(['is_active' => false, 'updated_by' => $userId]),
            'remove' => $query->delete(),
        };

        return back()->with('success', $message);
    }
}
