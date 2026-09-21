<?php

namespace App\Domain\Builder\Http\Controllers\Admin;

use App\Domain\Builder\Models\BuilderAccountProduct;
use App\Domain\Builder\Models\BuilderProduct;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
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
        // Cast, do not just default: ConvertEmptyStringsToNull turns a
        // "?status=" in the query string into null, and a default only applies
        // when the key is absent entirely. Selecting an account sends every
        // current filter back, empty ones included, so this arrived as null
        // and the typed parameter below threw a 500.
        $status = (string) ($request->input('status', '') ?? '');
        $account = $this->resolveAccount($request);

        if ($account) {
            return $this->indexForAccount($request, $account, $search, $categoryId, $status);
        }

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
            'accounts' => $this->accountOptions(),
            'account' => null,
            'filters' => [
                'q' => $search,
                'category_id' => $categoryId,
                'status' => $status,
                'account' => null,
            ],
            'stats' => [
                'total' => BuilderProduct::count(),
                'active' => BuilderProduct::where('is_active', true)->count(),
            ],
        ]);
    }

    /**
     * The same screen, scoped to one trade account's own catalogue.
     *
     * Rendered by the same Inertia page: an account list and a shared list are
     * the same thing to edit, and splitting them into two screens would mean
     * two copies of the price editor, the live toggle and the bulk actions.
     */
    private function indexForAccount(Request $request, User $account, string $search, $categoryId, ?string $status): Response
    {
        $listings = BuilderAccountProduct::query()
            ->forAccount($account)
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

        // Shared prices for the rows that inherit rather than override, so the
        // screen can show what the account actually pays either way.
        $sharedPrices = BuilderProduct::whereIn('product_id', $listings->pluck('product_id'))
            ->pluck('price', 'product_id');

        $listings->getCollection()->transform(function (BuilderAccountProduct $listing) use ($sharedPrices) {
            $retail = (float) ($listing->product->price ?? 0);
            $shared = isset($sharedPrices[$listing->product_id]) ? (float) $sharedPrices[$listing->product_id] : null;
            $price = $listing->price !== null ? (float) $listing->price : $shared;

            $listing->retail_price = $retail;
            $listing->shared_price = $shared;
            // Null price means "inherit"; the UI shows the inherited figure
            // greyed so an admin can tell it apart from one typed by hand.
            $listing->inherits_price = $listing->price === null;
            $listing->effective_price = $price;
            $listing->discount_percent = ($retail > 0 && $price !== null)
                ? round((($retail - $price) / $retail) * 100, 1)
                : 0.0;

            return $listing;
        });

        return Inertia::render('Admin/BuilderCatalog/Index', [
            'listings' => $listings,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'accounts' => $this->accountOptions(),
            'account' => [
                'id' => $account->id,
                'name' => $account->name,
                'email' => $account->email,
                'company' => $account->builder_company,
            ],
            'filters' => [
                'q' => $search,
                'category_id' => $categoryId,
                'status' => $status,
                'account' => $account->id,
            ],
            'stats' => [
                'total' => BuilderAccountProduct::forAccount($account)->count(),
                'active' => BuilderAccountProduct::forAccount($account)->where('is_active', true)->count(),
            ],
        ]);
    }

    /** Approved trade accounts, for the account picker. */
    private function accountOptions(): array
    {
        return User::query()
            ->where('is_builder', true)
            ->whereNotNull('builder_approved_at')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'builder_company'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'company' => $u->builder_company,
                'own_products' => BuilderAccountProduct::forAccount($u)->count(),
            ])
            ->all();
    }

    private function resolveAccount(Request $request): ?User
    {
        $id = $request->input('account');

        if (! $id) {
            return null;
        }

        return User::where('is_builder', true)->find($id);
    }

    /**
     * Product picker feed for the "Add products" modal: active products that
     * are not on the trade list yet.
     */
    public function available(Request $request)
    {
        $search = trim((string) $request->input('q', ''));

        $account = $this->resolveAccount($request);

        $products = Product::query()
            ->where('is_active', true)
            // Exclude what is already on the list being edited - the account's
            // own when one is selected, the shared one otherwise.
            ->when(
                $account,
                fn ($q) => $q->whereDoesntHave(
                    'builderAccountListings',
                    fn ($inner) => $inner->where('user_id', $account->id),
                ),
                fn ($q) => $q->whereDoesntHave('builderListing'),
            )
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

    /* ── One account's own catalogue ──────────────────────────────────────
       Separate endpoints rather than a flag on the shared ones: the ids in a
       request body refer to different tables, and a mix-up would silently
       reprice the catalogue every other builder sees.                      */

    public function storeForAccount(Request $request, User $account): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            // Blank price = charge this account the shared catalogue price.
            'items.*.price' => ['nullable', 'numeric', 'min:0', 'max:9999999'],
            'items.*.note' => ['nullable', 'string', 'max:255'],
        ]);

        abort_unless($account->is_builder, 404);

        $userId = $request->user()->id;
        $added = 0;

        DB::transaction(function () use ($validated, $userId, $account, &$added) {
            foreach ($validated['items'] as $item) {
                $listing = BuilderAccountProduct::updateOrCreate(
                    ['user_id' => $account->id, 'product_id' => $item['product_id']],
                    [
                        'price' => $item['price'] ?? null,
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

        return back()->with('success', "{$added} product(s) added to {$account->name}'s catalogue.");
    }

    public function updateForAccount(Request $request, BuilderAccountProduct $builderAccountProduct): RedirectResponse
    {
        $validated = $request->validate([
            'price' => ['nullable', 'numeric', 'min:0', 'max:9999999'],
            'is_active' => ['required', 'boolean'],
            'sort' => ['nullable', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $builderAccountProduct->update([
            ...$validated,
            'price' => $validated['price'] ?? null,
            'sort' => $validated['sort'] ?? $builderAccountProduct->sort,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Account price updated.');
    }

    public function destroyForAccount(BuilderAccountProduct $builderAccountProduct): RedirectResponse
    {
        $builderAccountProduct->delete();

        return back()->with('success', "Product removed from this account's catalogue.");
    }

    public function bulkForAccount(Request $request, User $account): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', Rule::in(['activate', 'deactivate', 'remove'])],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:builder_account_products,id'],
        ]);

        // Scoped to the account in the URL, so a stale id from another
        // account's screen cannot reach through and change their list.
        $query = BuilderAccountProduct::forAccount($account)->whereIn('id', $validated['ids']);
        $userId = $request->user()->id;

        $message = match ($validated['action']) {
            'activate' => 'Selected products are now live for this account.',
            'deactivate' => 'Selected products are hidden from this account.',
            'remove' => "Selected products removed from this account's catalogue.",
        };

        match ($validated['action']) {
            'activate' => $query->update(['is_active' => true, 'updated_by' => $userId]),
            'deactivate' => $query->update(['is_active' => false, 'updated_by' => $userId]),
            'remove' => $query->delete(),
        };

        return back()->with('success', $message);
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
