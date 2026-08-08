<?php

namespace App\Domain\Catalog\Http\Controllers\Admin;

use App\Domain\Catalog\Models\VariantFamily;
use App\Domain\Catalog\Support\ProductFamily;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Variant Families admin.
 *
 * index() renders Inertia; every mutating method returns JSON so the page can
 * apply changes without a full visit (the React page reloads its own props).
 */
class VariantFamilyController extends Controller
{
    public function index(): Response
    {
        $families = VariantFamily::query()
            ->orderBy('position')
            ->orderBy('id')
            ->with([
                'products' => fn ($q) => $q
                    ->select([
                        'id', 'name', 'slug', 'sku', 'price', 'image_url', 'specifications',
                        'inventory_quantity', 'inventory_policy', 'is_active', 'status',
                        'variant_family_id', 'variant_family_position',
                    ])
                    ->with(['media' => fn ($m) => $m->where('type', 'image')
                        ->orderByDesc('is_primary')
                        ->orderBy('sort')]),
            ])
            ->get()
            ->map(fn (VariantFamily $family) => [
                'id' => $family->id,
                'name' => $family->name,
                'is_active' => $family->is_active,
                'position' => $family->position,
                'default_product_id' => $family->default_product_id,
                'products' => $family->products->map(fn (Product $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'label' => ProductFamily::label($p, $family->name),
                    'slug' => $p->slug,
                    'sku' => $p->sku,
                    'price' => (float) $p->price,
                    'image_url' => $p->media->first()?->url ?: ($p->image_url ?: null),
                    'in_stock' => ($p->inventory_quantity ?? 0) > 0 || $p->inventory_policy === 'continue',
                    'is_active' => $p->is_active,
                    'is_live' => $p->is_active && $p->status === Product::STATUS_PUBLISHED,
                ])->values(),
            ])
            ->values();

        return Inertia::render('Admin/VariantFamilies/Index', [
            'families' => $families,
            'ungroupedCount' => Product::whereNull('variant_family_id')->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:variant_families,name'],
        ]);

        $family = VariantFamily::create([
            'name' => $validated['name'],
            'is_active' => true,
            'position' => (int) VariantFamily::max('position') + 1,
        ]);

        return response()->json([
            'ok' => true,
            'message' => "Family \u{201C}{$family->name}\u{201D} created.",
            'id' => $family->id,
        ]);
    }

    public function update(Request $request, VariantFamily $family): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', 'unique:variant_families,name,' . $family->id],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $family->update($validated);

        return response()->json(['ok' => true, 'message' => 'Family updated.']);
    }

    public function destroy(Request $request, VariantFamily $family): JsonResponse
    {
        $validated = $request->validate([
            'strategy' => ['required', 'in:detach,move'],
            'target_family_id' => ['nullable', 'required_if:strategy,move', 'integer', 'exists:variant_families,id'],
        ]);

        if ($validated['strategy'] === 'move' && (int) $validated['target_family_id'] === $family->id) {
            return response()->json([
                'ok' => false,
                'message' => 'Cannot move products into the family being deleted.',
            ], 422);
        }

        $name = $family->name;

        DB::transaction(function () use ($family, $validated) {
            $memberIds = $family->products()->pluck('id');

            if ($validated['strategy'] === 'move') {
                $targetId = (int) $validated['target_family_id'];
                $next = (int) Product::where('variant_family_id', $targetId)->max('variant_family_position');

                foreach ($memberIds as $id) {
                    $next++;
                    // Query-builder update: family membership never affects collection indexing.
                    Product::whereKey($id)->update([
                        'variant_family_id' => $targetId,
                        'variant_family_position' => $next,
                    ]);
                }
            } else {
                Product::whereIn('id', $memberIds)->update([
                    'variant_family_id' => null,
                    'variant_family_position' => 0,
                ]);
            }

            $family->delete();
        });

        return response()->json(['ok' => true, 'message' => "Family \u{201C}{$name}\u{201D} deleted."]);
    }

    public function addProduct(Request $request, VariantFamily $family): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if ((int) $product->variant_family_id === $family->id) {
            return response()->json([
                'ok' => false,
                'message' => 'That product is already in this family.',
            ], 422);
        }

        $previous = $product->variant_family_id
            ? VariantFamily::find($product->variant_family_id)?->name
            : null;

        $position = (int) Product::where('variant_family_id', $family->id)->max('variant_family_position') + 1;

        Product::whereKey($product->id)->update([
            'variant_family_id' => $family->id,
            'variant_family_position' => $position,
        ]);

        $label = ProductFamily::label($product, $previous);

        return response()->json([
            'ok' => true,
            'message' => $previous
                ? "Moved \u{201C}{$label}\u{201D} from \u{201C}{$previous}\u{201D}."
                : "Added \u{201C}{$label}\u{201D}.",
        ]);
    }

    public function removeProduct(VariantFamily $family, Product $product): JsonResponse
    {
        abort_unless((int) $product->variant_family_id === $family->id, 404);

        if ((int) $family->default_product_id === $product->id) {
            $family->update(['default_product_id' => null]);
        }

        Product::whereKey($product->id)->update([
            'variant_family_id' => null,
            'variant_family_position' => 0,
        ]);

        return response()->json(['ok' => true, 'message' => 'Product removed from family.']);
    }

    public function reorderProducts(Request $request, VariantFamily $family): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        foreach (array_values($validated['ids']) as $position => $id) {
            // Scoped so ids outside this family can never be repositioned.
            Product::whereKey($id)
                ->where('variant_family_id', $family->id)
                ->update(['variant_family_position' => $position]);
        }

        return response()->json(['ok' => true]);
    }

    public function reorderFamilies(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        foreach (array_values($validated['ids']) as $position => $id) {
            VariantFamily::whereKey($id)->update(['position' => $position]);
        }

        return response()->json(['ok' => true]);
    }

    public function setDefault(Request $request, VariantFamily $family): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $product = Product::findOrFail($validated['product_id']);

        abort_unless((int) $product->variant_family_id === $family->id, 422);

        $family->update(['default_product_id' => $product->id]);

        $label = ProductFamily::label($product, $family->name);

        return response()->json(['ok' => true, 'message' => "Default set to \u{201C}{$label}\u{201D}."]);
    }

    /**
     * Product search for the "Add Product" modal.
     */
    public function searchProducts(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $products = Product::query()
            ->where(fn ($sub) => $sub->where('name', 'like', "%{$q}%")->orWhere('sku', 'like', "%{$q}%"))
            ->with('variantFamily:id,name')
            ->orderBy('name')
            ->limit(15)
            ->get(['id', 'name', 'sku', 'price', 'variant_family_id'])
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'price' => (float) $p->price,
                'family' => $p->variantFamily?->name,
            ]);

        return response()->json($products);
    }
}
