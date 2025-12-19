<?php

namespace App\Domain\Catalog\Http\Controllers\Admin;

use App\Domain\Catalog\Jobs\ReindexCollectionsJob;
use App\Domain\Catalog\Models\Collection;
use App\Domain\Catalog\Services\CollectionIndexService;
use App\Domain\Catalog\Services\CollectionRuleEngine;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function __construct(
        protected CollectionRuleEngine $ruleEngine,
        protected CollectionIndexService $indexService
    ) {}

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'type', 'status']);

        $query = Collection::query()
            ->withCount('products');

        // Filter by type
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // Filter by status
        if (isset($filters['status'])) {
            $query->where('is_active', $filters['status'] === 'active');
        }

        // Search
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('handle', 'like', "%{$filters['search']}%");
            });
        }

        $collections = $query->orderBy('title')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Collections/Index', [
            'collections' => $collections,
            'filters' => $filters,
            'types' => [
                ['value' => 'manual', 'label' => 'Manual'],
                ['value' => 'automated', 'label' => 'Automated'],
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Collections/Create', [
            'collection' => null,
            'sortModes' => Collection::getSortModes(),
            'ruleFields' => CollectionRuleEngine::getAvailableFields(),
            'ruleOperators' => CollectionRuleEngine::getAvailableOperators(),
            'rulePresets' => CollectionRuleEngine::getPresets(),
            'categories' => Category::active()->orderBy('name')->get(['id', 'name']),
            'vendors' => User::where('is_seller', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'handle' => ['nullable', 'string', 'max:255', 'unique:collections,handle'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:manual,automated'],
            'rules_json' => ['nullable', 'array'],
            'sort_mode' => ['required', 'string'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['exists:products,id'],
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        // Generate handle if not provided
        if (empty($validated['handle'])) {
            $validated['handle'] = Str::slug($validated['title']);
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('collections', 'public');
        }

        // Remove product_ids and image from validated data
        $productIds = $validated['product_ids'] ?? [];
        unset($validated['product_ids'], $validated['image']);

        $collection = Collection::create($validated);

        // Sync manual products
        if ($collection->isManual() && !empty($productIds)) {
            $this->indexService->syncManualProducts($collection, $productIds);
        }

        // Reindex if automated
        if ($collection->isAutomated()) {
            ReindexCollectionsJob::dispatch($collection->id);
        }

        return redirect()
            ->route('admin.collections.edit', $collection)
            ->with('success', 'Collection created successfully.');
    }

    public function edit(Collection $collection): Response
    {
        $collection->load(['products' => function ($q) {
            $q->select('products.id', 'name', 'slug', 'price', 'image_url')
                ->orderBy('collection_products.sort_order')
                ->limit(100);
        }]);

        return Inertia::render('Admin/Collections/Edit', [
            'collection' => [
                ...$collection->toArray(),
                'product_ids' => $collection->products->pluck('id'),
            ],
            'sortModes' => Collection::getSortModes(),
            'ruleFields' => CollectionRuleEngine::getAvailableFields(),
            'ruleOperators' => CollectionRuleEngine::getAvailableOperators(),
            'rulePresets' => CollectionRuleEngine::getPresets(),
            'categories' => Category::active()->orderBy('name')->get(['id', 'name']),
            'vendors' => User::where('is_seller', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Collection $collection): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'handle' => ['nullable', 'string', 'max:255', 'unique:collections,handle,' . $collection->id],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:manual,automated'],
            'rules_json' => ['nullable', 'array'],
            'sort_mode' => ['required', 'string'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['exists:products,id'],
            'image' => ['nullable', 'image', 'max:2048'],
            'remove_image' => ['boolean'],
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($collection->image_path) {
                Storage::disk('public')->delete($collection->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('collections', 'public');
        }

        // Handle image removal
        if ($request->boolean('remove_image') && $collection->image_path) {
            Storage::disk('public')->delete($collection->image_path);
            $validated['image_path'] = null;
        }

        // Remove product_ids, image and remove_image from validated data
        $productIds = $validated['product_ids'] ?? [];
        unset($validated['product_ids'], $validated['image'], $validated['remove_image']);

        $collection->update($validated);

        // Sync manual products
        if ($collection->isManual()) {
            $this->indexService->syncManualProducts($collection, $productIds);
        }

        // Reindex if automated and rules changed
        if ($collection->isAutomated()) {
            ReindexCollectionsJob::dispatch($collection->id);
        }

        return back()->with('success', 'Collection updated successfully.');
    }

    public function destroy(Collection $collection): RedirectResponse
    {
        // Delete image
        if ($collection->image_path) {
            Storage::disk('public')->delete($collection->image_path);
        }

        $collection->delete();

        return redirect()
            ->route('admin.collections.index')
            ->with('success', 'Collection deleted successfully.');
    }

    public function reindex(Collection $collection): JsonResponse
    {
        if ($collection->isManual()) {
            return response()->json([
                'success' => false,
                'message' => 'Manual collections cannot be reindexed.',
            ], 400);
        }

        ReindexCollectionsJob::dispatch($collection->id);

        return response()->json([
            'success' => true,
            'message' => 'Reindex job queued.',
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        $rules = $request->input('rules', []);
        $vendorId = $request->input('vendor_id');

        if (empty($rules) || empty($rules['conditions'])) {
            return response()->json([
                'count' => 0,
                'products' => [],
            ]);
        }

        // Validate rules
        $errors = $this->ruleEngine->validateRules($rules);
        if (!empty($errors)) {
            return response()->json([
                'errors' => $errors,
            ], 422);
        }

        $count = $this->ruleEngine->getMatchCount($rules, $vendorId);
        $products = $this->ruleEngine->getPreview($rules, $vendorId, 10);

        return response()->json([
            'count' => $count,
            'products' => $products,
        ]);
    }

    public function reorderProducts(Request $request, Collection $collection): JsonResponse
    {
        $request->validate([
            'product_ids' => ['required', 'array'],
            'product_ids.*' => ['exists:products,id'],
        ]);

        $this->indexService->reorderProducts($collection, $request->product_ids);

        return response()->json(['success' => true]);
    }

    public function searchProducts(Request $request): JsonResponse
    {
        $query = $request->input('q', '');
        $excludeIds = $request->input('exclude', []);

        $products = Product::active()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('sku', 'like', "%{$query}%");
            })
            ->when(!empty($excludeIds), fn($q) => $q->whereNotIn('id', $excludeIds))
            ->limit(20)
            ->get(['id', 'name', 'slug', 'price', 'image_url']);

        return response()->json($products);
    }

    /**
     * Add a product to a manual collection.
     */
    public function addProduct(Request $request, Collection $collection): JsonResponse
    {
        if (!$collection->isManual()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot manually add products to automated collections.',
            ], 400);
        }

        $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        // Check if product is already in collection
        if ($collection->products()->where('products.id', $request->product_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Product is already in this collection.',
            ], 400);
        }

        $maxSort = $collection->products()->max('collection_products.sort_order') ?? 0;

        $collection->products()->attach($request->product_id, [
            'sort_order' => $maxSort + 1,
            'added_at' => now(),
            'match_reason' => 'manual',
        ]);

        // Update products count
        $collection->update(['products_count' => $collection->products()->count()]);

        return response()->json(['success' => true]);
    }

    /**
     * Remove a product from a manual collection.
     */
    public function removeProduct(Request $request, Collection $collection): JsonResponse
    {
        if (!$collection->isManual()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot manually remove products from automated collections.',
            ], 400);
        }

        $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        $collection->products()->detach($request->product_id);

        // Update products count
        $collection->update(['products_count' => $collection->products()->count()]);

        return response()->json(['success' => true]);
    }
}
